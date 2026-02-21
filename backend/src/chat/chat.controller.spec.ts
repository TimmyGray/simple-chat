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
    it('should set SSE headers, consume stream events, and end response', async () => {
      const dto = { content: 'Hello' };
      const mockReq = { on: vi.fn(), headers: {} } as any;
      const written: string[] = [];
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn((data: string) => written.push(data)),
        end: vi.fn(),
        writableEnded: false,
      } as any;

      // Mock service to return an async generator
      async function* mockGenerator() {
        yield { type: 'content' as const, content: 'Hi' };
        yield { type: 'done' as const };
      }
      chatService.sendMessageAndStream = vi
        .fn()
        .mockReturnValue(mockGenerator());

      await controller.sendMessage(
        mockUser,
        '507f1f77bcf86cd799439011',
        dto,
        mockReq,
        mockRes,
      );

      // Verify SSE headers
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Connection',
        'keep-alive',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');

      // Verify SSE wire format
      expect(written).toContain('data: {"content":"Hi"}\n\n');
      expect(written).toContain('data: [DONE]\n\n');

      // Verify response ended
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should pass AbortSignal to service (not req/res)', async () => {
      const dto = { content: 'Hello' };
      const mockReq = { on: vi.fn(), headers: {} } as any;
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        writableEnded: false,
      } as any;

      async function* emptyGenerator() {
        yield { type: 'done' as const };
      }
      chatService.sendMessageAndStream = vi
        .fn()
        .mockReturnValue(emptyGenerator());

      await controller.sendMessage(
        mockUser,
        '507f1f77bcf86cd799439011',
        dto,
        mockReq,
        mockRes,
      );

      // Service should receive (id, dto, userId, AbortSignal, idempotencyKey) — NOT req/res
      expect(chatService.sendMessageAndStream).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        dto,
        mockUserId,
        expect.any(AbortSignal),
        undefined,
      );
    });

    it('should write error event from stream to SSE format', async () => {
      const dto = { content: 'Hello' };
      const mockReq = { on: vi.fn(), headers: {} } as any;
      const written: string[] = [];
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn((data: string) => written.push(data)),
        end: vi.fn(),
        writableEnded: false,
      } as any;

      async function* errorGenerator() {
        yield { type: 'error' as const, message: 'LLM failed' };
      }
      chatService.sendMessageAndStream = vi
        .fn()
        .mockReturnValue(errorGenerator());

      await controller.sendMessage(
        mockUser,
        '507f1f77bcf86cd799439011',
        dto,
        mockReq,
        mockRes,
      );

      expect(written).toContain('data: {"error":"LLM failed"}\n\n');
    });
  });
});
