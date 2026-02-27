import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationForkService } from './conversation-fork.service';
import { SharingService } from './sharing.service';
import { DatabaseService } from '../database/database.service';

describe('ConversationForkService', () => {
  let service: ConversationForkService;
  let mockConversationsCollection: any;
  let mockMessagesCollection: any;
  let mockSharingService: any;

  const mockObjectId = new ObjectId('507f1f77bcf86cd799439011');
  const mockMessageId = new ObjectId('507f1f77bcf86cd799439012');
  const mockUserId = new ObjectId('607f1f77bcf86cd799439099');

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
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    mockMessagesCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([mockMessage]),
          }),
        }),
      }),
      findOne: vi.fn().mockResolvedValue(mockMessage),
      insertMany: vi.fn().mockResolvedValue({ insertedCount: 1 }),
    };

    const mockDatabaseService = {
      conversations: vi.fn().mockReturnValue(mockConversationsCollection),
      messages: vi.fn().mockReturnValue(mockMessagesCollection),
    };

    mockSharingService = {
      findAccessibleConversation: vi.fn().mockResolvedValue(mockConversation),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationForkService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: SharingService, useValue: mockSharingService },
      ],
    }).compile();

    service = module.get<ConversationForkService>(ConversationForkService);
  });

  describe('forkConversation', () => {
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

      mockMessagesCollection.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([mockMessage, mockAssistantMsg]),
          }),
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
      mockSharingService.findAccessibleConversation = vi
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
});
