import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LlmStreamService } from './llm-stream.service';
import { DatabaseService } from '../database/database.service';
import { FileExtractionService } from './file-extraction.service';
import type { StreamEvent } from './interfaces/stream-event.interface';

describe('LlmStreamService', () => {
  let service: LlmStreamService;
  let mockMessagesCollection: any;
  let mockUsersCollection: any;
  let mockConversationsCollection: any;
  let mockTemplatesCollection: any;

  const mockObjectId = new ObjectId('507f1f77bcf86cd799439011');
  const mockUserId = new ObjectId('607f1f77bcf86cd799439099');
  const mockMessage = {
    _id: new ObjectId('507f1f77bcf86cd799439012'),
    conversationId: mockObjectId,
    role: 'user',
    content: 'Hello',
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockMessagesCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([mockMessage]),
        }),
      }),
    };
    mockUsersCollection = {
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    mockConversationsCollection = {
      findOne: vi.fn().mockResolvedValue({ _id: mockObjectId }),
    };
    mockTemplatesCollection = {
      findOne: vi.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmStreamService,
        {
          provide: DatabaseService,
          useValue: {
            messages: vi.fn().mockReturnValue(mockMessagesCollection),
            users: vi.fn().mockReturnValue(mockUsersCollection),
            conversations: vi.fn().mockReturnValue(mockConversationsCollection),
            templates: vi.fn().mockReturnValue(mockTemplatesCollection),
          },
        },
        {
          provide: FileExtractionService,
          useValue: {
            buildLlmMessages: vi
              .fn()
              .mockResolvedValue([{ role: 'user', content: 'Hello' }]),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === 'openrouter.apiKey') return 'test-key';
              if (key === 'openrouter.baseUrl')
                return 'https://openrouter.ai/api/v1';
              if (key === 'corsOrigin') return 'http://localhost:5173';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LlmStreamService>(LlmStreamService);
  });

  async function collectEvents(
    gen: AsyncGenerator<StreamEvent>,
  ): Promise<StreamEvent[]> {
    const events: StreamEvent[] = [];
    for await (const event of gen) events.push(event);
    return events;
  }

  function mockOpenAiStream(chunks: any[]) {
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of chunks) yield chunk;
      },
      controller: { abort: vi.fn() },
    };
    vi.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(
      mockStream as any,
    );
    return mockStream;
  }

  it('should yield content events and a done event', async () => {
    mockOpenAiStream([
      { choices: [{ delta: { content: 'Hello' } }] },
      { choices: [{ delta: { content: ' world' } }] },
      {
        choices: [],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      },
    ]);
    const events = await collectEvents(
      service.stream('507f1f77bcf86cd799439011', 'openrouter/free', mockUserId),
    );
    expect(events).toEqual([
      { type: 'content', content: 'Hello' },
      { type: 'content', content: ' world' },
      {
        type: 'done',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      },
    ]);
  });

  it('should save assistant message with token usage', async () => {
    mockOpenAiStream([
      { choices: [{ delta: { content: 'Response' } }] },
      {
        choices: [],
        usage: { prompt_tokens: 20, completion_tokens: 8, total_tokens: 28 },
      },
    ]);
    await collectEvents(
      service.stream('507f1f77bcf86cd799439011', 'openrouter/free', mockUserId),
    );
    expect(mockMessagesCollection.insertOne).toHaveBeenCalledTimes(1);
    const assistantCall = mockMessagesCollection.insertOne.mock.calls[0][0];
    expect(assistantCall.role).toBe('assistant');
    expect(assistantCall.content).toBe('Response');
    expect(assistantCall.promptTokens).toBe(20);
  });

  it('should update user cumulative token usage', async () => {
    mockOpenAiStream([
      { choices: [{ delta: { content: 'Hi' } }] },
      {
        choices: [],
        usage: { prompt_tokens: 15, completion_tokens: 3, total_tokens: 18 },
      },
    ]);
    await collectEvents(
      service.stream('507f1f77bcf86cd799439011', 'openrouter/free', mockUserId),
    );
    expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
      { _id: mockUserId },
      {
        $inc: {
          totalTokensUsed: 18,
          totalPromptTokens: 15,
          totalCompletionTokens: 3,
        },
      },
    );
  });

  it('should skip empty delta content', async () => {
    mockOpenAiStream([
      { choices: [{ delta: {} }] },
      { choices: [{ delta: { content: '' } }] },
      { choices: [{ delta: { content: 'Real content' } }] },
    ]);
    const events = await collectEvents(
      service.stream('507f1f77bcf86cd799439011', 'openrouter/free', mockUserId),
    );
    const contentEvents = events.filter((e) => e.type === 'content');
    expect(contentEvents).toHaveLength(1);
    expect(contentEvents[0]).toEqual({
      type: 'content',
      content: 'Real content',
    });
  });

  it('should yield error event when LLM call fails', async () => {
    vi.spyOn(service['openai'].chat.completions, 'create').mockRejectedValue(
      new Error('API rate limit exceeded'),
    );
    const events = await collectEvents(
      service.stream('507f1f77bcf86cd799439011', 'openrouter/free', mockUserId),
    );
    expect(events).toEqual([
      {
        type: 'error',
        code: 'LLM_FAILURE',
        message: 'API rate limit exceeded',
      },
    ]);
  });

  it('should abort LLM stream when abortSignal is triggered', async () => {
    const abortController = new AbortController();
    const mockStream = mockOpenAiStream([
      { choices: [{ delta: { content: 'First' } }] },
      { choices: [{ delta: { content: 'Second' } }] },
    ]);
    // Override to abort after first chunk
    const originalIterator = mockStream[Symbol.asyncIterator];
    mockStream[Symbol.asyncIterator] = async function* () {
      const gen = originalIterator();
      const first = await gen.next();
      if (!first.done) yield first.value;
      abortController.abort();
      const second = await gen.next();
      if (!second.done) yield second.value;
    };
    vi.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(
      mockStream as any,
    );

    const events = await collectEvents(
      service.stream(
        '507f1f77bcf86cd799439011',
        'openrouter/free',
        mockUserId,
        abortController.signal,
      ),
    );
    expect(events[0]).toEqual({ type: 'content', content: 'First' });
    expect(mockStream.controller.abort).toHaveBeenCalled();
  });

  it('should not save assistant message if stream yields no content', async () => {
    mockOpenAiStream([]);
    await collectEvents(
      service.stream('507f1f77bcf86cd799439011', 'openrouter/free', mockUserId),
    );
    expect(mockMessagesCollection.insertOne).not.toHaveBeenCalled();
  });

  it('should prepend system prompt when conversation has templateId', async () => {
    const templateId = new ObjectId('707f1f77bcf86cd799439033');
    mockConversationsCollection.findOne.mockResolvedValue({
      _id: mockObjectId,
      templateId,
    });
    mockTemplatesCollection.findOne.mockResolvedValue({
      _id: templateId,
      name: 'Code Reviewer',
      content: 'You are a code reviewer.',
      category: 'development',
      isDefault: true,
    });

    mockOpenAiStream([
      { choices: [{ delta: { content: 'Review' } }] },
    ]);
    await collectEvents(
      service.stream('507f1f77bcf86cd799439011', 'openrouter/free', mockUserId),
    );

    const createCall = vi.spyOn(service['openai'].chat.completions, 'create').mock.calls[0];
    const messages = (createCall[0] as any).messages;
    expect(messages[0]).toEqual({ role: 'system', content: 'You are a code reviewer.' });
    expect(messages[1]).toEqual({ role: 'user', content: 'Hello' });
  });

  it('should not prepend system prompt when conversation has no templateId', async () => {
    mockConversationsCollection.findOne.mockResolvedValue({
      _id: mockObjectId,
    });

    mockOpenAiStream([
      { choices: [{ delta: { content: 'Hi' } }] },
    ]);
    await collectEvents(
      service.stream('507f1f77bcf86cd799439011', 'openrouter/free', mockUserId),
    );

    const createCall = vi.spyOn(service['openai'].chat.completions, 'create').mock.calls[0];
    const messages = (createCall[0] as any).messages;
    expect(messages).toEqual([{ role: 'user', content: 'Hello' }]);
  });
});
