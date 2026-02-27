import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ToolExecutionService,
  MAX_TOOL_ITERATIONS,
  type ToolCallAccumulator,
} from './tool-execution.service';
import { McpService } from '../mcp/mcp.service';
import type { StreamEvent } from './interfaces/stream-event.interface';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import type OpenAI from 'openai';

async function collectEvents(
  gen: AsyncGenerator<StreamEvent>,
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of gen) events.push(event);
  return events;
}

describe('ToolExecutionService', () => {
  let service: ToolExecutionService;
  let mockMcpService: { getOpenAITools: any; callTool: any };

  beforeEach(async () => {
    mockMcpService = {
      getOpenAITools: vi.fn().mockReturnValue([]),
      callTool: vi.fn().mockResolvedValue({
        content: 'tool result',
        isError: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolExecutionService,
        { provide: McpService, useValue: mockMcpService },
      ],
    }).compile();

    service = module.get<ToolExecutionService>(ToolExecutionService);
  });

  it('should export MAX_TOOL_ITERATIONS as 10', () => {
    expect(MAX_TOOL_ITERATIONS).toBe(10);
  });

  describe('getOpenAITools', () => {
    it('should delegate to McpService', () => {
      const mockTools = [
        {
          type: 'function' as const,
          function: { name: 'test', parameters: {} },
        },
      ];
      mockMcpService.getOpenAITools.mockReturnValue(mockTools);
      expect(service.getOpenAITools()).toBe(mockTools);
    });

    it('should return empty array when McpService is not available', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [ToolExecutionService],
      }).compile();
      const serviceNoMcp =
        module.get<ToolExecutionService>(ToolExecutionService);
      expect(serviceNoMcp.getOpenAITools()).toEqual([]);
    });
  });

  describe('accumulateToolCalls', () => {
    it('should create new accumulator entries from delta', () => {
      const toolCalls = new Map<number, ToolCallAccumulator>();
      const delta = {
        tool_calls: [
          {
            index: 0,
            id: 'call_1',
            function: { name: 'search', arguments: '{"q":' },
          },
        ],
      } as ChatCompletionChunk.Choice.Delta;

      service.accumulateToolCalls(delta, toolCalls);

      expect(toolCalls.get(0)).toEqual({
        id: 'call_1',
        name: 'search',
        arguments: '{"q":',
      });
    });

    it('should append arguments to existing accumulator', () => {
      const toolCalls = new Map<number, ToolCallAccumulator>();
      toolCalls.set(0, { id: 'call_1', name: 'search', arguments: '{"q":' });

      const delta = {
        tool_calls: [{ index: 0, function: { arguments: '"hello"}' } }],
      } as ChatCompletionChunk.Choice.Delta;

      service.accumulateToolCalls(delta, toolCalls);

      expect(toolCalls.get(0)!.arguments).toBe('{"q":"hello"}');
    });

    it('should handle delta without tool_calls', () => {
      const toolCalls = new Map<number, ToolCallAccumulator>();
      const delta = { content: 'hello' } as ChatCompletionChunk.Choice.Delta;

      service.accumulateToolCalls(delta, toolCalls);

      expect(toolCalls.size).toBe(0);
    });

    it('should accumulate multiple tool calls', () => {
      const toolCalls = new Map<number, ToolCallAccumulator>();
      const delta = {
        tool_calls: [
          {
            index: 0,
            id: 'call_1',
            function: { name: 'search', arguments: '{}' },
          },
          {
            index: 1,
            id: 'call_2',
            function: { name: 'fetch', arguments: '{}' },
          },
        ],
      } as ChatCompletionChunk.Choice.Delta;

      service.accumulateToolCalls(delta, toolCalls);

      expect(toolCalls.size).toBe(2);
      expect(toolCalls.get(0)!.name).toBe('search');
      expect(toolCalls.get(1)!.name).toBe('fetch');
    });
  });

  describe('executeToolCalls', () => {
    it('should yield tool_call and tool_result events', async () => {
      const toolCalls = new Map<number, ToolCallAccumulator>();
      toolCalls.set(0, {
        id: 'call_1',
        name: 'search',
        arguments: '{"q":"test"}',
      });

      const currentMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      const events = await collectEvents(
        service.executeToolCalls(toolCalls, currentMessages),
      );

      expect(events).toEqual([
        { type: 'tool_call', name: 'search', arguments: '{"q":"test"}' },
        {
          type: 'tool_result',
          name: 'search',
          content: 'tool result',
          isError: false,
        },
      ]);
    });

    it('should push assistant and tool messages to currentMessages', async () => {
      const toolCalls = new Map<number, ToolCallAccumulator>();
      toolCalls.set(0, {
        id: 'call_1',
        name: 'search',
        arguments: '{"q":"test"}',
      });

      const currentMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      await collectEvents(service.executeToolCalls(toolCalls, currentMessages));

      expect(currentMessages).toHaveLength(2);
      expect(currentMessages[0]).toEqual({
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'search', arguments: '{"q":"test"}' },
          },
        ],
      });
      expect(currentMessages[1]).toEqual({
        role: 'tool',
        tool_call_id: 'call_1',
        content: 'tool result',
      });
    });

    it('should handle malformed JSON arguments gracefully', async () => {
      const toolCalls = new Map<number, ToolCallAccumulator>();
      toolCalls.set(0, { id: 'call_1', name: 'search', arguments: 'not json' });

      const currentMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      const events = await collectEvents(
        service.executeToolCalls(toolCalls, currentMessages),
      );

      expect(events[0]).toEqual({
        type: 'tool_call',
        name: 'search',
        arguments: 'not json',
      });
      expect(events[1]).toEqual({
        type: 'tool_result',
        name: 'search',
        content: 'Failed to parse tool arguments: invalid JSON',
        isError: true,
      });
      expect(mockMcpService.callTool).not.toHaveBeenCalled();
    });

    it('should yield no events when McpService is unavailable', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [ToolExecutionService],
      }).compile();
      const serviceNoMcp =
        module.get<ToolExecutionService>(ToolExecutionService);

      const toolCalls = new Map<number, ToolCallAccumulator>();
      toolCalls.set(0, { id: 'call_1', name: 'search', arguments: '{}' });

      const currentMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      const events = await collectEvents(
        serviceNoMcp.executeToolCalls(toolCalls, currentMessages),
      );

      expect(events).toHaveLength(0);
    });

    it('should execute multiple tool calls sequentially', async () => {
      mockMcpService.callTool
        .mockResolvedValueOnce({ content: 'result 1', isError: false })
        .mockResolvedValueOnce({ content: 'result 2', isError: false });

      const toolCalls = new Map<number, ToolCallAccumulator>();
      toolCalls.set(0, {
        id: 'call_1',
        name: 'search',
        arguments: '{"q":"a"}',
      });
      toolCalls.set(1, {
        id: 'call_2',
        name: 'fetch',
        arguments: '{"url":"b"}',
      });

      const currentMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      const events = await collectEvents(
        service.executeToolCalls(toolCalls, currentMessages),
      );

      expect(events).toHaveLength(4);
      expect(events[0]).toEqual({
        type: 'tool_call',
        name: 'search',
        arguments: '{"q":"a"}',
      });
      expect(events[1]).toEqual({
        type: 'tool_result',
        name: 'search',
        content: 'result 1',
        isError: false,
      });
      expect(events[2]).toEqual({
        type: 'tool_call',
        name: 'fetch',
        arguments: '{"url":"b"}',
      });
      expect(events[3]).toEqual({
        type: 'tool_result',
        name: 'fetch',
        content: 'result 2',
        isError: false,
      });
    });
  });
});
