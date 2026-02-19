import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: any;

  const mockUserId = new ObjectId('607f1f77bcf86cd799439099');
  const mockUser = { _id: mockUserId, email: 'test@example.com' };

  const mockConversation = {
    _id: '507f1f77bcf86cd799439011',
    userId: mockUserId,
    title: 'Test Chat',
    model: 'openrouter/free',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessages = [
    {
      _id: '507f1f77bcf86cd799439012',
      conversationId: '507f1f77bcf86cd799439011',
      role: 'user',
      content: 'Hello',
      attachments: [],
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    chatService = {
      getConversations: vi.fn().mockResolvedValue([mockConversation]),
      createConversation: vi.fn().mockResolvedValue(mockConversation),
      updateConversation: vi.fn().mockResolvedValue(mockConversation),
      deleteConversation: vi.fn().mockResolvedValue(undefined),
      getMessages: vi.fn().mockResolvedValue(mockMessages),
      sendMessageAndStream: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: chatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  describe('getConversations', () => {
    it('should return conversations for the authenticated user', async () => {
      const result = await controller.getConversations(mockUser);
      expect(result).toEqual([mockConversation]);
      expect(chatService.getConversations).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('createConversation', () => {
    it('should create a new conversation with userId', async () => {
      const dto = { title: 'New Chat' };
      const result = await controller.createConversation(mockUser, dto);
      expect(result).toEqual(mockConversation);
      expect(chatService.createConversation).toHaveBeenCalledWith(
        dto,
        mockUserId,
      );
    });
  });

  describe('updateConversation', () => {
    it('should update a conversation with ownership check', async () => {
      const dto = { title: 'Updated' };
      const result = await controller.updateConversation(
        mockUser,
        '507f1f77bcf86cd799439011',
        dto,
      );
      expect(result).toEqual(mockConversation);
      expect(chatService.updateConversation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dto,
        mockUserId,
      );
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation with ownership check', async () => {
      await controller.deleteConversation(mockUser, '507f1f77bcf86cd799439011');
      expect(chatService.deleteConversation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockUserId,
      );
    });
  });

  describe('getMessages', () => {
    it('should return messages with ownership check', async () => {
      const result = await controller.getMessages(
        mockUser,
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockMessages);
      expect(chatService.getMessages).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockUserId,
      );
    });
  });

  describe('sendMessage', () => {
    it('should call sendMessageAndStream with userId', async () => {
      const dto = { content: 'Hello' };
      const mockReq = {} as any;
      const mockRes = {} as any;

      await controller.sendMessage(
        mockUser,
        '507f1f77bcf86cd799439011',
        dto,
        mockReq,
        mockRes,
      );
      expect(chatService.sendMessageAndStream).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dto,
        mockReq,
        mockRes,
        mockUserId,
      );
    });
  });
});
