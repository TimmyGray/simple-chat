import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import OpenAI from 'openai';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import { DatabaseService } from '../database/database.service';
import type { TokenUsage } from '../types/documents';
import { FileExtractionService } from './file-extraction.service';
import { McpService } from '../mcp/mcp.service';
import {
  SSE_ERROR_CODE,
  type StreamEvent,
} from './interfaces/stream-event.interface';
import {
  getErrorMessage,
  getErrorStack,
} from '../common/utils/get-error-message';

const OLLAMA_MODEL_PREFIX = 'ollama/';
const MAX_TOOL_ITERATIONS = 10;

interface ToolCallAccumulator {
  id: string;
  name: string;
  arguments: string;
}

@Injectable()
export class LlmStreamService {
  private readonly logger = new Logger(LlmStreamService.name);
  private readonly openrouterClient: OpenAI;
  private readonly ollamaClient: OpenAI | null;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileExtractionService: FileExtractionService,
    private configService: ConfigService,
    @Optional() private readonly mcpService?: McpService,
  ) {
    this.openrouterClient = new OpenAI({
      apiKey: this.configService.get<string>('openrouter.apiKey'),
      baseURL: this.configService.get<string>('openrouter.baseUrl'),
      defaultHeaders: {
        'HTTP-Referer': this.configService.get<string>('corsOrigin'),
        'X-Title': 'Simple Chat',
      },
    });
    this.logger.log(
      `OpenRouter client initialized with baseURL: ${this.configService.get<string>('openrouter.baseUrl')}`,
    );

    const ollamaBaseUrl = this.configService.get<string>('ollama.baseUrl');
    if (ollamaBaseUrl) {
      this.ollamaClient = new OpenAI({
        apiKey: 'ollama',
        baseURL: `${ollamaBaseUrl}/v1`,
      });
      this.logger.log(
        `Ollama client initialized with baseURL: ${ollamaBaseUrl}/v1`,
      );
    } else {
      this.ollamaClient = null;
    }
  }

  private getClientAndModel(model: string): {
    client: OpenAI;
    modelName: string;
  } {
    if (model.startsWith(OLLAMA_MODEL_PREFIX)) {
      if (!this.ollamaClient) {
        throw new Error('Ollama is not configured');
      }
      return {
        client: this.ollamaClient,
        modelName: model.slice(OLLAMA_MODEL_PREFIX.length),
      };
    }
    return { client: this.openrouterClient, modelName: model };
  }

  private async getSystemPrompt(
    templateId: ObjectId | undefined,
    conversationId: string,
  ): Promise<string | null> {
    if (!templateId) return null;
    const template = await this.databaseService
      .templates()
      .findOne({ _id: templateId });
    if (!template) {
      this.logger.warn(
        `Template ${String(templateId)} not found for conversation ${conversationId}`,
      );
      return null;
    }
    return template.content;
  }

  private accumulateToolCalls(
    delta: ChatCompletionChunk.Choice.Delta,
    toolCalls: Map<number, ToolCallAccumulator>,
  ): void {
    if (!delta.tool_calls) return;
    for (const tc of delta.tool_calls) {
      if (!toolCalls.has(tc.index)) {
        toolCalls.set(tc.index, {
          id: tc.id ?? '',
          name: tc.function?.name ?? '',
          arguments: '',
        });
      }
      const acc = toolCalls.get(tc.index)!;
      if (tc.id) acc.id = tc.id;
      if (tc.function?.name) acc.name = tc.function.name;
      if (tc.function?.arguments) acc.arguments += tc.function.arguments;
    }
  }

  async *stream(
    conversationId: string,
    model: string,
    userId: ObjectId,
    abortSignal?: AbortSignal,
    templateId?: ObjectId,
  ): AsyncGenerator<StreamEvent> {
    const messages = await this.databaseService
      .messages()
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();
    const llmMessages =
      await this.fileExtractionService.buildLlmMessages(messages);
    const systemPrompt = await this.getSystemPrompt(templateId, conversationId);
    if (systemPrompt) {
      llmMessages.unshift({ role: 'system', content: systemPrompt });
    }

    const tools = this.mcpService?.getOpenAITools() ?? [];
    let fullContent = '';
    let usage: TokenUsage | undefined;

    try {
      const { client, modelName } = this.getClientAndModel(model);
      const isOllama = model.startsWith(OLLAMA_MODEL_PREFIX);
      this.logger.log(
        `Starting LLM stream: model="${modelName}", provider=${isOllama ? 'ollama' : 'openrouter'}, messages=${llmMessages.length}, tools=${tools.length}, conversation=${conversationId}`,
      );

      const currentMessages = [
        ...llmMessages,
      ] as OpenAI.Chat.ChatCompletionMessageParam[];

      for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
        const stream = await client.chat.completions.create({
          model: modelName,
          messages: currentMessages,
          stream: true,
          ...(tools.length > 0 ? { tools } : {}),
          ...(isOllama ? {} : { stream_options: { include_usage: true } }),
        });

        let finishReason = '';
        const toolCalls = new Map<number, ToolCallAccumulator>();

        for await (const chunk of stream) {
          if (abortSignal?.aborted) {
            this.logger.log(
              `Client disconnected during stream for conversation ${conversationId}`,
            );
            stream.controller.abort();
            break;
          }
          const delta = chunk.choices[0]?.delta;
          if (delta) {
            const content = delta.content || '';
            if (content) {
              fullContent += content;
              yield { type: 'content', content };
            }
            this.accumulateToolCalls(delta, toolCalls);
          }
          if (chunk.choices[0]?.finish_reason) {
            finishReason = chunk.choices[0].finish_reason;
          }
          if (chunk.usage) {
            if (!usage) {
              usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
            }
            usage.promptTokens += chunk.usage.prompt_tokens;
            usage.completionTokens += chunk.usage.completion_tokens;
            usage.totalTokens += chunk.usage.total_tokens;
          }
        }

        if (abortSignal?.aborted) break;

        if (finishReason !== 'tool_calls' || toolCalls.size === 0) break;

        yield* this.executeToolCalls(toolCalls, currentMessages);
      }

      if (fullContent.length > 0) {
        const assistantNow = new Date();
        await this.databaseService.messages().insertOne({
          conversationId: new ObjectId(conversationId),
          role: 'assistant',
          content: fullContent,
          model,
          attachments: [],
          ...(usage
            ? {
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens,
              }
            : {}),
          createdAt: assistantNow,
          updatedAt: assistantNow,
        });
      }
      if (usage) {
        await this.databaseService.users().updateOne(
          { _id: userId },
          {
            $inc: {
              totalTokensUsed: usage.totalTokens,
              totalPromptTokens: usage.promptTokens,
              totalCompletionTokens: usage.completionTokens,
            },
          },
        );
        this.logger.debug(
          `Token usage for conversation ${conversationId}: prompt=${usage.promptTokens}, completion=${usage.completionTokens}, total=${usage.totalTokens}`,
        );
      }
      this.logger.log(
        `Stream complete for conversation ${conversationId}: ${fullContent.length} chars`,
      );
      yield { type: 'done', usage };
    } catch (error) {
      this.logger.error(
        `LLM stream failed for conversation ${conversationId}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      yield {
        type: 'error',
        code: SSE_ERROR_CODE.LLM_FAILURE,
        message: getErrorMessage(error),
      };
    }
  }

  private async *executeToolCalls(
    toolCalls: Map<number, ToolCallAccumulator>,
    currentMessages: OpenAI.Chat.ChatCompletionMessageParam[],
  ): AsyncGenerator<StreamEvent> {
    if (!this.mcpService) {
      this.logger.error('McpService unavailable during tool execution');
      return;
    }

    const assistantToolCalls = [...toolCalls.values()].map((tc) => ({
      id: tc.id,
      type: 'function' as const,
      function: { name: tc.name, arguments: tc.arguments },
    }));
    currentMessages.push({
      role: 'assistant',
      content: null,
      tool_calls: assistantToolCalls,
    });

    for (const tc of toolCalls.values()) {
      yield { type: 'tool_call', name: tc.name, arguments: tc.arguments };
      this.logger.debug(`Executing tool call: ${tc.name}`);

      let parsedArgs: Record<string, unknown>;
      try {
        parsedArgs = JSON.parse(tc.arguments) as Record<string, unknown>;
      } catch {
        this.logger.warn(
          `Malformed tool arguments for ${tc.name}: ${tc.arguments}`,
        );
        const errorMsg = 'Failed to parse tool arguments: invalid JSON';
        yield {
          type: 'tool_result',
          name: tc.name,
          content: errorMsg,
          isError: true,
        };
        currentMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: errorMsg,
        });
        continue;
      }

      const result = await this.mcpService.callTool(tc.name, parsedArgs);

      yield {
        type: 'tool_result',
        name: tc.name,
        content: result.content,
        isError: result.isError,
      };

      currentMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result.content,
      });
    }
  }
}
