import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import { sign } from 'jsonwebtoken';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatGateway } from './chat.gateway';
import { DatabaseService } from '../database/database.service';
import { SharingService } from './sharing.service';
import { WS_SERVER_EVENT } from './interfaces/ws-events.interface';

const JWT_SECRET = 'test-secret-key';
const MOCK_USER_ID = '607f1f77bcf86cd799439099';
const MOCK_CONV_ID = '507f1f77bcf86cd799439011';

function createMockSocket(data?: { userId: string; email: string }) {
  const emitFn = vi.fn();
  const joinFn = vi.fn();
  const leaveFn = vi.fn();
  const toFn = vi.fn().mockReturnValue({ emit: emitFn });
  const disconnectFn = vi.fn();

  return {
    id: 'socket-1',
    handshake: {
      auth: {},
      headers: {},
    },
    data: data ?? {},
    emit: emitFn,
    join: joinFn,
    leave: leaveFn,
    to: toFn,
    disconnect: disconnectFn,
    _emitFn: emitFn,
    _joinFn: joinFn,
    _leaveFn: leaveFn,
    _toFn: toFn,
    _disconnectFn: disconnectFn,
  };
}

function makeToken(payload?: Record<string, unknown>): string {
  return sign(
    { sub: MOCK_USER_ID, email: 'test@example.com', ...payload },
    JWT_SECRET,
  );
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let mockSharingService: any;

  const mockConversation = {
    _id: new ObjectId(MOCK_CONV_ID),
    userId: new ObjectId(MOCK_USER_ID),
    title: 'Test Chat',
    model: 'openrouter/free',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockSharingService = {
      findAccessibleConversation: vi.fn().mockResolvedValue(mockConversation),
    };

    const mockDatabaseService = {
      conversations: vi.fn().mockReturnValue({
        findOne: vi.fn().mockResolvedValue(mockConversation),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockImplementation((key: string) => {
              if (key === 'jwt.secret') return JWT_SECRET;
              return undefined;
            }),
          },
        },
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: SharingService, useValue: mockSharingService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);

    gateway.server = {
      to: vi.fn().mockReturnValue({ emit: vi.fn() }),
      sockets: {
        adapter: { rooms: new Map() },
        sockets: new Map(),
      },
    } as any;
  });

  describe('handleConnection', () => {
    it('should authenticate client with valid JWT in auth field', () => {
      const token = makeToken();
      const client = createMockSocket();
      client.handshake.auth = { token };

      gateway.handleConnection(client as any);

      expect((client.data as any).userId).toBe(MOCK_USER_ID);
      expect((client.data as any).email).toBe('test@example.com');
      expect(client._disconnectFn).not.toHaveBeenCalled();
    });

    it('should authenticate client with Bearer token in authorization header', () => {
      const token = makeToken();
      const client = createMockSocket();
      client.handshake.headers = { authorization: `Bearer ${token}` };

      gateway.handleConnection(client as any);

      expect((client.data as any).userId).toBe(MOCK_USER_ID);
      expect(client._disconnectFn).not.toHaveBeenCalled();
    });

    it('should disconnect client with no token', () => {
      const client = createMockSocket();

      gateway.handleConnection(client as any);

      expect(client._disconnectFn).toHaveBeenCalledWith(true);
    });

    it('should disconnect client with invalid token', () => {
      const client = createMockSocket();
      client.handshake.auth = { token: 'invalid-token' };

      gateway.handleConnection(client as any);

      expect(client._disconnectFn).toHaveBeenCalledWith(true);
    });

    it('should disconnect client with expired token', () => {
      const token = sign(
        { sub: MOCK_USER_ID, email: 'test@example.com' },
        JWT_SECRET,
        { expiresIn: -10 },
      );
      const client = createMockSocket();
      client.handshake.auth = { token };

      gateway.handleConnection(client as any);

      expect(client._disconnectFn).toHaveBeenCalledWith(true);
    });
  });

  describe('handleJoinConversation', () => {
    it('should join room when user owns the conversation', async () => {
      const client = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });

      const result = await gateway.handleJoinConversation(client as any, {
        conversationId: MOCK_CONV_ID,
      });

      expect(result.success).toBe(true);
      expect(client._joinFn).toHaveBeenCalledWith(
        `conversation:${MOCK_CONV_ID}`,
      );
    });

    it('should emit user:joined to other clients in room', async () => {
      const client = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });

      await gateway.handleJoinConversation(client as any, {
        conversationId: MOCK_CONV_ID,
      });

      expect(client._toFn).toHaveBeenCalledWith(`conversation:${MOCK_CONV_ID}`);
      const emitMock = client._toFn.mock.results[0].value.emit;
      expect(emitMock).toHaveBeenCalledWith(WS_SERVER_EVENT.USER_JOINED, {
        conversationId: MOCK_CONV_ID,
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });
    });

    it('should reject join when conversation not found', async () => {
      mockSharingService.findAccessibleConversation.mockRejectedValueOnce(
        new Error('Conversation not found'),
      );
      const client = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });

      const result = await gateway.handleJoinConversation(client as any, {
        conversationId: MOCK_CONV_ID,
      });

      expect(result.success).toBe(false);
      expect(client._joinFn).not.toHaveBeenCalled();
    });

    it('should reject join with invalid conversationId', async () => {
      const client = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });

      const result = await gateway.handleJoinConversation(client as any, {
        conversationId: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    it('should reject join when client is not authenticated', async () => {
      const client = createMockSocket();

      const result = await gateway.handleJoinConversation(client as any, {
        conversationId: MOCK_CONV_ID,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('handleLeaveConversation', () => {
    it('should leave room and notify other clients', async () => {
      const client = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });

      const result = await gateway.handleLeaveConversation(client as any, {
        conversationId: MOCK_CONV_ID,
      });

      expect(result.success).toBe(true);
      expect(client._leaveFn).toHaveBeenCalledWith(
        `conversation:${MOCK_CONV_ID}`,
      );
      expect(client._toFn).toHaveBeenCalledWith(`conversation:${MOCK_CONV_ID}`);
    });

    it('should reject leave with invalid conversationId', async () => {
      const client = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });

      const result = await gateway.handleLeaveConversation(client as any, {
        conversationId: 'invalid',
      });

      expect(result.success).toBe(false);
      expect(client._leaveFn).not.toHaveBeenCalled();
    });
  });

  describe('typing indicators', () => {
    it('should broadcast typing:start when client is in room', () => {
      const room = `conversation:${MOCK_CONV_ID}`;
      const rooms = new Set([room]);
      const client = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });
      (client as any).rooms = rooms;

      gateway.handleTypingStart(client as any, {
        conversationId: MOCK_CONV_ID,
      });

      expect(client._toFn).toHaveBeenCalledWith(room);
      const emitMock = client._toFn.mock.results[0].value.emit;
      expect(emitMock).toHaveBeenCalledWith(WS_SERVER_EVENT.TYPING_START, {
        conversationId: MOCK_CONV_ID,
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });
    });

    it('should broadcast typing:stop when client is in room', () => {
      const room = `conversation:${MOCK_CONV_ID}`;
      const rooms = new Set([room]);
      const client = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });
      (client as any).rooms = rooms;

      gateway.handleTypingStop(client as any, {
        conversationId: MOCK_CONV_ID,
      });

      expect(client._toFn).toHaveBeenCalledWith(room);
      const emitMock = client._toFn.mock.results[0].value.emit;
      expect(emitMock).toHaveBeenCalledWith(WS_SERVER_EVENT.TYPING_STOP, {
        conversationId: MOCK_CONV_ID,
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });
    });

    it('should not broadcast typing when client is not in room', () => {
      const client = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });
      (client as any).rooms = new Set();

      gateway.handleTypingStart(client as any, {
        conversationId: MOCK_CONV_ID,
      });

      expect(client._toFn).not.toHaveBeenCalled();
    });

    it('should not broadcast typing when client is unauthenticated', () => {
      const client = createMockSocket();

      gateway.handleTypingStart(client as any, {
        conversationId: MOCK_CONV_ID,
      });

      expect(client._toFn).not.toHaveBeenCalled();
    });
  });

  describe('emitMessageCreated', () => {
    it('should broadcast to all clients in room when no excludeUserId', () => {
      const mockMessage = {
        _id: new ObjectId(),
        conversationId: new ObjectId(MOCK_CONV_ID),
        role: 'assistant' as const,
        content: 'Hello!',
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      gateway.emitMessageCreated(MOCK_CONV_ID, mockMessage);

      expect(gateway.server.to).toHaveBeenCalledWith(
        `conversation:${MOCK_CONV_ID}`,
      );
    });

    it('should exclude specific user when excludeUserId provided', () => {
      const otherSocket = createMockSocket({
        userId: 'other-user-id',
        email: 'other@example.com',
      });
      const senderSocket = createMockSocket({
        userId: MOCK_USER_ID,
        email: 'test@example.com',
      });

      const room = new Set(['socket-other', 'socket-sender']);
      gateway.server.sockets.adapter.rooms.set(
        `conversation:${MOCK_CONV_ID}`,
        room,
      );
      (gateway.server.sockets.sockets as Map<string, any>).set(
        'socket-other',
        otherSocket,
      );
      (gateway.server.sockets.sockets as Map<string, any>).set(
        'socket-sender',
        senderSocket,
      );

      const mockMessage = {
        _id: new ObjectId(),
        conversationId: new ObjectId(MOCK_CONV_ID),
        role: 'user' as const,
        content: 'Hello!',
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      gateway.emitMessageCreated(MOCK_CONV_ID, mockMessage, MOCK_USER_ID);

      expect(otherSocket._emitFn).toHaveBeenCalledWith(
        WS_SERVER_EVENT.MESSAGE_CREATED,
        expect.objectContaining({
          conversationId: MOCK_CONV_ID,
          message: mockMessage,
        }),
      );
      expect(senderSocket._emitFn).not.toHaveBeenCalled();
    });
  });

  describe('emitMessageDeleted', () => {
    it('should broadcast deletion to room', () => {
      const messageId = new ObjectId().toHexString();
      gateway.emitMessageDeleted(MOCK_CONV_ID, messageId);

      expect(gateway.server.to).toHaveBeenCalledWith(
        `conversation:${MOCK_CONV_ID}`,
      );
    });
  });
});
