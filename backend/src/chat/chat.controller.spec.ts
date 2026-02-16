import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: any;

  const mockConversation = {
    _id: '507f1f77bcf86cd799439011',
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
    it('should return all conversations', async () => {
      const result = await controller.getConversations();
      expect(result).toEqual([mockConversation]);
      expect(chatService.getConversations).toHaveBeenCalled();
    });
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const dto = { title: 'New Chat' };
      const result = await controller.createConversation(dto);
      expect(result).toEqual(mockConversation);
      expect(chatService.createConversation).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateConversation', () => {
    it('should update a conversation', async () => {
      const dto = { title: 'Updated' };
      const result = await controller.updateConversation(
        '507f1f77bcf86cd799439011',
        dto,
      );
      expect(result).toEqual(mockConversation);
      expect(chatService.updateConversation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dto,
      );
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      await controller.deleteConversation('507f1f77bcf86cd799439011');
      expect(chatService.deleteConversation).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('getMessages', () => {
    it('should return messages for a conversation', async () => {
      const result = await controller.getMessages('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockMessages);
      expect(chatService.getMessages).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('sendMessage', () => {
    it('should call sendMessageAndStream', async () => {
      const dto = { content: 'Hello' };
      const mockReq = {} as any;
      const mockRes = {} as any;

      await controller.sendMessage(
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
      );
    });
  });
});
