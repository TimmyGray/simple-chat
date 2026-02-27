import { Injectable, Logger, Optional } from '@nestjs/common';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import type OpenAI from 'openai';
import { McpService } from '../mcp/mcp.service';
import type { StreamEvent } from './interfaces/stream-event.interface';

export const MAX_TOOL_ITERATIONS = 10;

export interface ToolCallAccumulator {
  id: string;
  name: string;
  arguments: string;
}

@Injectable()
export class ToolExecutionService {
  private readonly logger = new Logger(ToolExecutionService.name);

  constructor(@Optional() private readonly mcpService?: McpService) {}

  accumulateToolCalls(
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

  getOpenAITools(): OpenAI.Chat.ChatCompletionTool[] {
    return this.mcpService?.getOpenAITools() ?? [];
  }

  async *executeToolCalls(
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
