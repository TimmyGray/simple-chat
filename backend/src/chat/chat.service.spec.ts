import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MongoServerError, ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatService } from './chat.service';
import { LlmStreamService } from './llm-stream.service';
import { DatabaseService } from '../database/database.service';
import type { StreamEvent } from './interfaces/stream-event.interface';

describe('ChatService', () => {
  let service: ChatService;
  let mockConversationsCollection: any;
  let mockMessagesCollection: any;
  let mockLlmStreamService: any;

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

  function createMockStreamFn(events: StreamEvent[]) {
    return vi.fn().mockImplementation(async function* () {
      for (const event of events) yield event;
    });
  }

  const defaultStreamEvents: StreamEvent[] = [
    { type: 'content', content: 'Hi' },
    {
      type: 'done',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    },
  ];

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
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([mockMessage]),
          }),
          toArray: vi.fn().mockResolvedValue([mockMessage]),
        }),
      }),
      findOne: vi.fn().mockResolvedValue(mockMessage),
      findOneAndUpdate: vi.fn().mockResolvedValue(mockMessage),
      insertMany: vi.fn().mockResolvedValue({ insertedCount: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      countDocuments: vi.fn().mockResolvedValue(1),
    };

    const mockDatabaseService = {
      conversations: vi.fn().mockReturnValue(mockConversationsCollection),
      messages: vi.fn().mockReturnValue(mockMessagesCollection),
      users: vi.fn().mockReturnValue({ updateOne: vi.fn() }),
    };

    mockLlmStreamService = {
      stream: createMockStreamFn(defaultStreamEvents),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: LlmStreamService, useValue: mockLlmStreamService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  async function collectEvents(
    gen: AsyncGenerator<StreamEvent>,
  ): Promise<StreamEvent[]> {
    const events: StreamEvent[] = [];
    for await (const event of gen) events.push(event);
    return events;
  }

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
        { title: 'My Chat', model: 'meta-llama/llama-3.3-70b-instruct:free' },
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
    it('should save user message and delegate to LlmStreamService', async () => {
      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test message' },
        mockUserId,
      );
      const events = await collectEvents(gen);

      expect(mockMessagesCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockMessagesCollection.insertOne.mock.calls[0][0].role).toBe(
        'user',
      );
      expect(mockMessagesCollection.insertOne.mock.calls[0][0].content).toBe(
        'Test message',
      );
      expect(mockLlmStreamService.stream).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'openrouter/free',
        mockUserId,
        undefined,
        undefined,
      );
      expect(events).toEqual(defaultStreamEvents);
    });

    it('should use dto model if provided', async () => {
      const gen = service.sendMessageAndStream(
        '507f1f77bcf86cd799439011',
        { content: 'Test', model: 'custom-model' },
        mockUserId,
      );
      await collectEvents(gen);
      expect(mockLlmStreamService.stream).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'custom-model',
        mockUserId,
        undefined,
        undefined,
      );
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

    it('should include idempotencyKey in user message when provided', async () => {
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

  describe('forkConversation', () => {
    const mockAssistantMsg = {
      _id: new ObjectId('507f1f77bcf86cd799439013'),
      conversationId: mockObjectId,
      role: 'assistant',
      content: 'Hi there',
      model: 'openrouter/free',
      attachments: [],
      createdAt: new Date('2026-01-01T00:01:00Z'),
      updatedAt: new Date('2026-01-01T00:01:00Z'),
    };

    it('should create a new conversation with forkedFrom reference', async () => {
      const result = await service.forkConversation(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        mockUserId,
      );
      expect(result).toBeDefined();
      expect(result.forkedFrom).toBeDefined();
      expect(result.forkedFrom!.conversationId).toEqual(mockObjectId);
      expect(result.forkedFrom!.messageId).toEqual(mockMessageId);
    });

    it('should copy messages up to the fork point', async () => {
      mockMessagesCollection.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([mockMessage, mockAssistantMsg]),
          }),
          toArray: vi.fn().mockResolvedValue([mockMessage, mockAssistantMsg]),
        }),
      });
      mockMessagesCollection.insertMany = vi
        .fn()
        .mockResolvedValue({ insertedCount: 2 });

      await service.forkConversation(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        mockUserId,
      );
      expect(mockMessagesCollection.insertMany).toHaveBeenCalledTimes(1);
      const copiedMsgs = mockMessagesCollection.insertMany.mock.calls[0][0];
      expect(copiedMsgs).toHaveLength(2);
      expect(copiedMsgs[0].role).toBe('user');
      expect(copiedMsgs[1].role).toBe('assistant');
    });

    it('should throw NotFoundException if message not found', async () => {
      mockMessagesCollection.findOne = vi.fn().mockResolvedValue(null);
      await expect(
        service.forkConversation(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should preserve source conversation model and template', async () => {
      const convWithTemplate = {
        ...mockConversation,
        templateId: new ObjectId('607f1f77bcf86cd799439050'),
      };
      mockConversationsCollection.findOne = vi
        .fn()
        .mockResolvedValue(convWithTemplate);

      await service.forkConversation(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        mockUserId,
      );
      const insertArg = mockConversationsCollection.insertOne.mock.calls[0][0];
      expect(insertArg.model).toBe('openrouter/free');
      expect(insertArg.templateId).toEqual(
        new ObjectId('607f1f77bcf86cd799439050'),
      );
    });
  });

  describe('editMessageAndStream', () => {
    it('should update user message content and set isEdited', async () => {
      const gen = service.editMessageAndStream(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        { content: 'Updated content' },
        mockUserId,
      );
      await collectEvents(gen);
      expect(mockMessagesCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId('507f1f77bcf86cd799439012') },
        {
          $set: {
            content: 'Updated content',
            isEdited: true,
            updatedAt: expect.any(Date),
          },
        },
      );
    });

    it('should delete messages after the edited message', async () => {
      const gen = service.editMessageAndStream(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        { content: 'Updated content' },
        mockUserId,
      );
      await collectEvents(gen);
      expect(mockMessagesCollection.deleteMany).toHaveBeenCalledWith({
        conversationId: new ObjectId('507f1f77bcf86cd799439011'),
        createdAt: { $gt: mockMessage.createdAt },
      });
    });

    it('should stream a new AI response after editing', async () => {
      const gen = service.editMessageAndStream(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        { content: 'Updated content' },
        mockUserId,
      );
      const events = await collectEvents(gen);
      expect(events).toEqual(defaultStreamEvents);
      expect(mockLlmStreamService.stream).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent message', async () => {
      mockMessagesCollection.findOne = vi.fn().mockResolvedValue(null);
      const gen = service.editMessageAndStream(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        { content: 'Updated' },
        mockUserId,
      );
      await expect(collectEvents(gen)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for assistant message (cannot edit)', async () => {
      mockMessagesCollection.findOne = vi.fn().mockImplementation((query) => {
        if (query.role === 'user') return Promise.resolve(null);
        return Promise.resolve(mockMessage);
      });
      const gen = service.editMessageAndStream(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        { content: 'Updated' },
        mockUserId,
      );
      await expect(collectEvents(gen)).rejects.toThrow(NotFoundException);
    });
  });

  describe('regenerateAndStream', () => {
    const mockAssistantMessage = {
      ...mockMessage,
      _id: new ObjectId('507f1f77bcf86cd799439013'),
      role: 'assistant',
      content: 'Old response',
    };

    it('should delete the assistant message and subsequent messages', async () => {
      mockMessagesCollection.findOne = vi.fn().mockImplementation((query) => {
        if (query.role === 'assistant')
          return Promise.resolve(mockAssistantMessage);
        return Promise.resolve(null);
      });
      mockConversationsCollection.findOne = vi
        .fn()
        .mockResolvedValue(mockConversation);
      const gen = service.regenerateAndStream(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013',
        mockUserId,
      );
      await collectEvents(gen);
      expect(mockMessagesCollection.deleteMany).toHaveBeenCalledWith({
        conversationId: new ObjectId('507f1f77bcf86cd799439011'),
        createdAt: { $gte: mockAssistantMessage.createdAt },
      });
    });

    it('should stream a new AI response', async () => {
      mockMessagesCollection.findOne = vi.fn().mockImplementation((query) => {
        if (query.role === 'assistant')
          return Promise.resolve(mockAssistantMessage);
        return Promise.resolve(null);
      });
      mockConversationsCollection.findOne = vi
        .fn()
        .mockResolvedValue(mockConversation);
      const gen = service.regenerateAndStream(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013',
        mockUserId,
      );
      const events = await collectEvents(gen);
      expect(events).toEqual(defaultStreamEvents);
      expect(mockLlmStreamService.stream).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent message', async () => {
      mockMessagesCollection.findOne = vi.fn().mockResolvedValue(null);
      mockConversationsCollection.findOne = vi
        .fn()
        .mockResolvedValue(mockConversation);
      const gen = service.regenerateAndStream(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439013',
        mockUserId,
      );
      await expect(collectEvents(gen)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for user message (cannot regenerate)', async () => {
      mockMessagesCollection.findOne = vi.fn().mockImplementation((query) => {
        if (query.role === 'assistant') return Promise.resolve(null);
        return Promise.resolve(mockMessage);
      });
      mockConversationsCollection.findOne = vi
        .fn()
        .mockResolvedValue(mockConversation);
      const gen = service.regenerateAndStream(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        mockUserId,
      );
      await expect(collectEvents(gen)).rejects.toThrow(NotFoundException);
    });
  });
});
