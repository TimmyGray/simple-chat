import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import OpenAI from 'openai';
import { DatabaseService } from '../database/database.service';
import type { TokenUsage } from '../types/documents';
import { FileExtractionService } from './file-extraction.service';
import {
  SSE_ERROR_CODE,
  type StreamEvent,
} from './interfaces/stream-event.interface';
import {
  getErrorMessage,
  getErrorStack,
} from '../common/utils/get-error-message';

@Injectable()
export class LlmStreamService {
  private readonly logger = new Logger(LlmStreamService.name);
  private openai: OpenAI;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileExtractionService: FileExtractionService,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openrouter.apiKey'),
      baseURL: this.configService.get<string>('openrouter.baseUrl'),
      defaultHeaders: {
        'HTTP-Referer': this.configService.get<string>('corsOrigin'),
        'X-Title': 'Simple Chat',
      },
    });
    this.logger.log(
      `OpenAI client initialized with baseURL: ${this.configService.get<string>('openrouter.baseUrl')}`,
    );
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
    let fullContent = '';
    let usage: TokenUsage | undefined;
    try {
      this.logger.log(
        `Starting LLM stream: model="${model}", messages=${llmMessages.length}, conversation=${conversationId}`,
      );
      const stream = await this.openai.chat.completions.create({
        model,
        messages: llmMessages,
        stream: true,
        stream_options: { include_usage: true },
      });
      for await (const chunk of stream) {
        if (abortSignal?.aborted) {
          this.logger.log(
            `Client disconnected during stream for conversation ${conversationId}`,
          );
          stream.controller.abort();
          break;
        }
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          yield { type: 'content', content };
        }
        if (chunk.usage) {
          usage = {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          };
        }
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
}
