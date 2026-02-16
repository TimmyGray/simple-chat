import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatService } from './chat.service';
import { DatabaseService } from '../database/database.service';

describe('ChatService', () => {
  let service: ChatService;
  let mockConversationsCollection: any;
  let mockMessagesCollection: any;

  const mockObjectId = new ObjectId('507f1f77bcf86cd799439011');
  const mockMessageId = new ObjectId('507f1f77bcf86cd799439012');

  const mockConversation = {
    _id: mockObjectId,
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
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('createConversation', () => {
    it('should create a conversation with default values', async () => {
      const result = await service.createConversation({});
      expect(result).toBeDefined();
      expect(result.title).toBe('New Chat');
    });

    it('should create a conversation with custom title', async () => {
      const result = await service.createConversation({
        title: 'My Chat',
        model: 'meta-llama/llama-3.3-70b-instruct:free',
      });
      expect(result).toBeDefined();
      expect(result.title).toBe('My Chat');
      expect(result.model).toBe('meta-llama/llama-3.3-70b-instruct:free');
    });
  });

  describe('getConversations', () => {
    it('should return list of conversations sorted by updatedAt', async () => {
      const result = await service.getConversations();
      expect(result).toHaveLength(1);
      expect(mockConversationsCollection.find).toHaveBeenCalled();
    });
  });

  describe('getConversation', () => {
    it('should return a conversation by id', async () => {
      const result = await service.getConversation('507f1f77bcf86cd799439011');
      expect(result).toBeDefined();
      expect(result._id).toEqual(mockObjectId);
    });

    it('should throw NotFoundException when not found', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.getConversation('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateConversation', () => {
    it('should update a conversation', async () => {
      const result = await service.updateConversation(
        '507f1f77bcf86cd799439011',
        { title: 'Updated Title' },
      );
      expect(result).toBeDefined();
      expect(mockConversationsCollection.findOneAndUpdate).toHaveBeenCalled();
      const callArgs =
        mockConversationsCollection.findOneAndUpdate.mock.calls[0];
      expect(callArgs[0]).toEqual({
        _id: new ObjectId('507f1f77bcf86cd799439011'),
      });
      expect(callArgs[1].$set.title).toBe('Updated Title');
      expect(callArgs[2]).toEqual({ returnDocument: 'after' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockConversationsCollection.findOneAndUpdate = vi
        .fn()
        .mockResolvedValue(null);

      await expect(
        service.updateConversation('507f1f77bcf86cd799439011', {
          title: 'x',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation and its messages', async () => {
      await service.deleteConversation('507f1f77bcf86cd799439011');
      expect(mockConversationsCollection.findOne).toHaveBeenCalled();
      expect(mockMessagesCollection.deleteMany).toHaveBeenCalled();
      expect(mockConversationsCollection.findOneAndDelete).toHaveBeenCalled();
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

      await service.deleteConversation('507f1f77bcf86cd799439011');
      expect(callOrder).toEqual(['deleteMessages', 'deleteConversation']);
    });

    it('should throw NotFoundException when not found', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.deleteConversation('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not delete messages if conversation not found', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        service.deleteConversation('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
      expect(mockMessagesCollection.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return messages for a conversation', async () => {
      const result = await service.getMessages('507f1f77bcf86cd799439011');
      expect(result).toHaveLength(1);
      expect(mockMessagesCollection.find).toHaveBeenCalled();
    });
  });
});
