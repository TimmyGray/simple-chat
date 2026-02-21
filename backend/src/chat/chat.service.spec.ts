import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MongoServerError, ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatService } from './chat.service';
import { DatabaseService } from '../database/database.service';
import type { StreamEvent } from './interfaces/stream-event.interface';

describe('ChatService', () => {
  let service: ChatService;
  let mockConversationsCollection: any;
  let mockMessagesCollection: any;

  const mockObjectId = new ObjectId('507f1f77bcf86cd799439011');
  const mockMessageId = new ObjectId('507f1f77bcf86cd799439012');
  const mockUserId = new ObjectId('607f1f77bcf86cd799439099');
  const otherUserId = new ObjectId('607f1f77bcf86cd799439100');

  const mockConversation = {
    _id: mockObjectId,
    userId: mockUserId,
    title: 'Test Chat',
    model: 'openrouter/free',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessage = {
    _id: mockMessageId,
    conversationId: mockObjectId,
    role: 'user',
    content: 'Hello',
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockConversationsCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: mockObjectId }),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([mockConversation]),
        }),
      }),
      findOne: vi.fn().mockResolvedValue(mockConversation),
      findOneAndUpdate: vi.fn().mockResolvedValue(mockConversation),
      findOneAndDelete: vi.fn().mockResolvedValue(mockConversation),
    };

    mockMessagesCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: mockMessageId }),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([mockMessage]),
        }),
      }),
      findOne: vi.fn().mockResolvedValue(mockMessage),
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      countDocuments: vi.fn().mockResolvedValue(1),
    };

    const mockDatabaseService = {
      conversations: vi.fn().mockReturnValue(mockConversationsCollection),
      messages: vi.fn().mockReturnValue(mockMessagesCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
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

    service = module.get<ChatService>(ChatService);
  });

  describe('createConversation', () => {
    it('should create a conversation with userId and default values', async () => {
      const result = await service.createConversation({}, mockUserId);
      expect(result).toBeDefined();
      expect(result.title).toBe('New Chat');
      expect(result.userId).toEqual(mockUserId);
      const insertArg = mockConversationsCollection.insertOne.mock.calls[0][0];
      expect(insertArg.userId).toEqual(mockUserId);
    });

    it('should create a conversation with custom title', async () => {
      const result = await service.createConversation(
        {
          title: 'My Chat',
          model: 'meta-llama/llama-3.3-70b-instruct:free',
        },
        mockUserId,
      );
      expect(result).toBeDefined();
      expect(result.title).toBe('My Chat');
      expect(result.model).toBe('meta-llama/llama-3.3-70b-instruct:free');
    });
  });

  describe('getConversations', () => {
    it('should return conversations filtered by userId', async () => {
      const result = await service.getConversations(mockUserId);
      expect(result).toHaveLength(1);
      expect(mockConversationsCollection.find).toHaveBeenCalledWith({
        userId: mockUserId,
      });
    });
  });

  describe('getConversation', () => {
    it('should return a conversation owned by the user', async () => {
      const result = await service.getConversation(
        '507f1f77bcf86cd799439011',
        mockUserId,
      );
      expect(result).toBeDefined();
      expect(result._id).toEqual(mockObjectId);
    });

    it('should throw NotFoundException when not found', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.getConversation('507f1f77bcf86cd799439011', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own the conversation', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.getConversation('507f1f77bcf86cd799439011', otherUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateConversation', () => {
    it('should update a conversation owned by the user', async () => {
      const result = await service.updateConversation(
        '507f1f77bcf86cd799439011',
        { title: 'Updated Title' },
        mockUserId,
      );
      expect(result).toBeDefined();
      expect(mockConversationsCollection.findOneAndUpdate).toHaveBeenCalled();
      const callArgs =
        mockConversationsCollection.findOneAndUpdate.mock.calls[0];
      expect(callArgs[0]).toEqual({
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        userId: mockUserId,
      });
      expect(callArgs[1].$set.title).toBe('Updated Title');
      expect(callArgs[2]).toEqual({ returnDocument: 'after' });
    });

    it('should throw NotFoundException when not found or not owned', async () => {
      mockConversationsCollection.findOneAndUpdate = vi
        .fn()
        .mockResolvedValue(null);

      await expect(
        service.updateConversation(
          '507f1f77bcf86cd799439011',
          { title: 'x' },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation owned by the user and its messages', async () => {
      await service.deleteConversation('507f1f77bcf86cd799439011', mockUserId);
      expect(mockConversationsCollection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        userId: mockUserId,
      });
      expect(mockMessagesCollection.deleteMany).toHaveBeenCalled();
      expect(mockConversationsCollection.findOneAndDelete).toHaveBeenCalledWith(
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          userId: mockUserId,
        },
      );
    });

    it('should delete messages before the conversation', async () => {
      const callOrder: string[] = [];
      mockMessagesCollection.deleteMany = vi.fn().mockImplementation(() => {
        callOrder.push('deleteMessages');
        return Promise.resolve({ deletedCount: 1 });
      });
      mockConversationsCollection.findOneAndDelete = vi
        .fn()
        .mockImplementation(() => {
          callOrder.push('deleteConversation');
          return Promise.resolve(mockConversation);
        });

      await service.deleteConversation('507f1f77bcf86cd799439011', mockUserId);
      expect(callOrder).toEqual(['deleteMessages', 'deleteConversation']);
    });

    it('should throw NotFoundException when not found or not owned', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.deleteConversation('507f1f77bcf86cd799439011', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not delete messages if conversation not found', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.deleteConversation('507f1f77bcf86cd799439011', mockUserId),
      ).rejects.toThrow(NotFoundException);
      expect(mockMessagesCollection.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return messages for a conversation owned by user', async () => {
      const result = await service.getMessages(
        '507f1f77bcf86cd799439011',
        mockUserId,
      );
      expect(result).toHaveLength(1);
      expect(mockMessagesCollection.find).toHaveBeenCalled();
    });

    it('should throw NotFoundException if conversation not owned by user', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.getMessages('507f1f77bcf86cd799439011', otherUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendMessageAndStream', () => {
    async function collectEvents(
      gen: AsyncGenerator<StreamEvent>,
    ): Promise<StreamEvent[]> {
      const events: StreamEvent[] = [];
      for await (const event of gen) {
        events.push(event);
      }
      return events;
    }

    it('should yield content events and a done event on successful stream', async () => {
      // Mock OpenAI streaming response
      const mockChunks = [
        { choices: [{ delta: { content: 'Hello' } }] },
        { choices: [{ delta: { content: ' world' } }] },
      ];
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
        controller: { abort: vi.fn() },
      };
      vi.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(
        mockStream as any,
      );

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test message' },
        mockUserId,
      );
      const events = await collectEvents(gen);

      expect(events).toEqual([
        { type: 'content', content: 'Hello' },
        { type: 'content', content: ' world' },
        { type: 'done' },
      ]);
    });

    it('should save user and assistant messages to the database', async () => {
      const mockChunks = [{ choices: [{ delta: { content: 'Response' } }] }];
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
        controller: { abort: vi.fn() },
      };
      vi.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(
        mockStream as any,
      );

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Hello' },
        mockUserId,
      );
      await collectEvents(gen);

      // First call saves user message, second saves assistant message
      expect(mockMessagesCollection.insertOne).toHaveBeenCalledTimes(2);
      const assistantCall = mockMessagesCollection.insertOne.mock.calls[1][0];
      expect(assistantCall.role).toBe('assistant');
      expect(assistantCall.content).toBe('Response');
    });

    it('should skip empty delta content', async () => {
      const mockChunks = [
        { choices: [{ delta: {} }] },
        { choices: [{ delta: { content: '' } }] },
        { choices: [{ delta: { content: 'Real content' } }] },
      ];
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
        controller: { abort: vi.fn() },
      };
      vi.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(
        mockStream as any,
      );

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test' },
        mockUserId,
      );
      const events = await collectEvents(gen);

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

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test' },
        mockUserId,
      );
      const events = await collectEvents(gen);

      expect(events).toEqual([
        { type: 'error', message: 'API rate limit exceeded' },
      ]);
    });

    it('should abort LLM stream when abortSignal is triggered', async () => {
      const abortFn = vi.fn();
      const abortController = new AbortController();

      const mockChunks = [
        { choices: [{ delta: { content: 'First' } }] },
        { choices: [{ delta: { content: 'Second' } }] },
      ];
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield mockChunks[0];
          // Abort after first chunk
          abortController.abort();
          yield mockChunks[1];
        },
        controller: { abort: abortFn },
      };
      vi.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(
        mockStream as any,
      );

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test' },
        mockUserId,
        abortController.signal,
      );
      const events = await collectEvents(gen);

      // Should have yielded the first chunk, then detected abort
      expect(events[0]).toEqual({ type: 'content', content: 'First' });
      expect(abortFn).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent conversation', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test' },
        mockUserId,
      );

      await expect(collectEvents(gen)).rejects.toThrow(NotFoundException);
    });

    it('should not save assistant message if stream yields no content', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          // Empty stream - no chunks
        },
        controller: { abort: vi.fn() },
      };
      vi.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(
        mockStream as any,
      );

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test' },
        mockUserId,
      );
      await collectEvents(gen);

      // Only user message saved, not assistant
      expect(mockMessagesCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockMessagesCollection.insertOne.mock.calls[0][0].role).toBe(
        'user',
      );
    });

    it('should include idempotencyKey in user message when provided', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Hi' } }] };
        },
        controller: { abort: vi.fn() },
      };
      vi.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(
        mockStream as any,
      );

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test' },
        mockUserId,
        undefined,
        'test-key-123',
      );
      await collectEvents(gen);

      const userInsert = mockMessagesCollection.insertOne.mock.calls[0][0];
      expect(userInsert.idempotencyKey).toBe('test-key-123');
    });

    it('should not include idempotencyKey when not provided', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Hi' } }] };
        },
        controller: { abort: vi.fn() },
      };
      vi.spyOn(service['openai'].chat.completions, 'create').mockResolvedValue(
        mockStream as any,
      );

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test' },
        mockUserId,
      );
      await collectEvents(gen);

      const userInsert = mockMessagesCollection.insertOne.mock.calls[0][0];
      expect(userInsert).not.toHaveProperty('idempotencyKey');
    });

    it('should throw ConflictException on duplicate idempotency key', async () => {
      const duplicateError = new MongoServerError({
        message: 'E11000 duplicate key error',
      });
      duplicateError.code = 11000;
      mockMessagesCollection.insertOne = vi
        .fn()
        .mockRejectedValue(duplicateError);

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test' },
        mockUserId,
        undefined,
        'duplicate-key',
      );

      await expect(collectEvents(gen)).rejects.toThrow(ConflictException);
    });

    it('should rethrow non-duplicate insert errors', async () => {
      mockMessagesCollection.insertOne = vi
        .fn()
        .mockRejectedValue(new Error('Connection lost'));

      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test' },
        mockUserId,
        undefined,
        'some-key',
      );

      await expect(collectEvents(gen)).rejects.toThrow('Connection lost');
    });
  });
});
