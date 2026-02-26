import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import { SharingService } from './sharing.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { MessageDoc } from '../types/documents';
import {
  WS_SERVER_EVENT,
  WS_CLIENT_EVENT,
  type JoinConversationPayload,
  type LeaveConversationPayload,
  type WsMessagePayload,
  type WsMessageDeletedPayload,
  type WsTypingPayload,
  type WsPresencePayload,
} from './interfaces/ws-events.interface';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    email: string;
  };
}

const ROOM_PREFIX = 'conversation:';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly sharingService: SharingService,
  ) {}

  handleConnection(client: AuthenticatedSocket): void {
    try {
      const auth = client.handshake.auth as Record<string, unknown> | undefined;
      const token =
        (typeof auth?.token === 'string' ? auth.token : undefined) ??
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const secret = this.configService.get<string>('jwt.secret');
      if (!secret) {
        throw new UnauthorizedException('JWT secret not configured');
      }

      const decoded = verify(token, secret);
      const payload =
        typeof decoded === 'object' && decoded !== null
          ? (decoded as JwtPayload)
          : undefined;
      if (!payload?.sub || !ObjectId.isValid(payload.sub)) {
        throw new UnauthorizedException('Invalid token payload');
      }

      client.data = {
        userId: payload.sub,
        email: payload.email,
      };

      this.logger.debug(
        `Client connected: ${client.id} (user: ${payload.email})`,
      );
    } catch {
      this.logger.warn(`Connection rejected: ${client.id} — invalid token`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    if (!client.data?.userId) return;

    this.logger.debug(
      `Client disconnected: ${client.id} (user: ${client.data.email})`,
    );
  }

  @SubscribeMessage(WS_CLIENT_EVENT.JOIN_CONVERSATION)
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinConversationPayload,
  ): Promise<{ success: boolean }> {
    if (!client.data?.userId) return { success: false };

    const { conversationId } = payload;
    if (!conversationId || !ObjectId.isValid(conversationId)) {
      return { success: false };
    }

    try {
      await this.sharingService.findAccessibleConversation(
        conversationId,
        new ObjectId(client.data.userId),
      );
    } catch {
      return { success: false };
    }

    const room = `${ROOM_PREFIX}${conversationId}`;
    await client.join(room);

    const presencePayload: WsPresencePayload = {
      conversationId,
      userId: client.data.userId,
      email: client.data.email,
    };
    client.to(room).emit(WS_SERVER_EVENT.USER_JOINED, presencePayload);

    this.logger.debug(
      `User ${client.data.email} joined room ${conversationId}`,
    );
    return { success: true };
  }

  @SubscribeMessage(WS_CLIENT_EVENT.LEAVE_CONVERSATION)
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: LeaveConversationPayload,
  ): Promise<{ success: boolean }> {
    if (!client.data?.userId) return { success: false };

    const { conversationId } = payload;
    const room = `${ROOM_PREFIX}${conversationId}`;
    await client.leave(room);

    const presencePayload: WsPresencePayload = {
      conversationId,
      userId: client.data.userId,
      email: client.data.email,
    };
    client.to(room).emit(WS_SERVER_EVENT.USER_LEFT, presencePayload);

    this.logger.debug(`User ${client.data.email} left room ${conversationId}`);
    return { success: true };
  }

  @SubscribeMessage(WS_CLIENT_EVENT.TYPING_START)
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ): void {
    if (!client.data?.userId) return;

    const room = `${ROOM_PREFIX}${payload.conversationId}`;
    const typingPayload: WsTypingPayload = {
      conversationId: payload.conversationId,
      userId: client.data.userId,
      email: client.data.email,
    };
    client.to(room).emit(WS_SERVER_EVENT.TYPING_START, typingPayload);
  }

  @SubscribeMessage(WS_CLIENT_EVENT.TYPING_STOP)
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ): void {
    if (!client.data?.userId) return;

    const room = `${ROOM_PREFIX}${payload.conversationId}`;
    const typingPayload: WsTypingPayload = {
      conversationId: payload.conversationId,
      userId: client.data.userId,
      email: client.data.email,
    };
    client.to(room).emit(WS_SERVER_EVENT.TYPING_STOP, typingPayload);
  }

  /** Broadcast new message to all clients in the conversation room (except sender) */
  emitMessageCreated(
    conversationId: string,
    message: MessageDoc,
    excludeUserId?: string,
  ): void {
    const room = `${ROOM_PREFIX}${conversationId}`;
    const payload: WsMessagePayload = { conversationId, message };

    if (excludeUserId) {
      this.emitToRoomExcludingUser(
        room,
        WS_SERVER_EVENT.MESSAGE_CREATED,
        payload,
        excludeUserId,
      );
    } else {
      this.server.to(room).emit(WS_SERVER_EVENT.MESSAGE_CREATED, payload);
    }
  }

  /** Broadcast message update to all clients in the conversation room */
  emitMessageUpdated(
    conversationId: string,
    message: MessageDoc,
    excludeUserId?: string,
  ): void {
    const room = `${ROOM_PREFIX}${conversationId}`;
    const payload: WsMessagePayload = { conversationId, message };

    if (excludeUserId) {
      this.emitToRoomExcludingUser(
        room,
        WS_SERVER_EVENT.MESSAGE_UPDATED,
        payload,
        excludeUserId,
      );
    } else {
      this.server.to(room).emit(WS_SERVER_EVENT.MESSAGE_UPDATED, payload);
    }
  }

  /** Broadcast message deletion to all clients in the conversation room */
  emitMessageDeleted(
    conversationId: string,
    messageId: string,
    excludeUserId?: string,
  ): void {
    const room = `${ROOM_PREFIX}${conversationId}`;
    const payload: WsMessageDeletedPayload = { conversationId, messageId };

    if (excludeUserId) {
      this.emitToRoomExcludingUser(
        room,
        WS_SERVER_EVENT.MESSAGE_DELETED,
        payload,
        excludeUserId,
      );
    } else {
      this.server.to(room).emit(WS_SERVER_EVENT.MESSAGE_DELETED, payload);
    }
  }

  private emitToRoomExcludingUser(
    room: string,
    event: string,
    payload: WsMessagePayload | WsMessageDeletedPayload,
    excludeUserId: string,
  ): void {
    const sockets = this.server.sockets.adapter.rooms.get(room);
    if (!sockets) return;

    for (const socketId of sockets) {
      const socket = this.server.sockets.sockets.get(socketId) as
        | AuthenticatedSocket
        | undefined;
      if (socket && socket.data?.userId !== excludeUserId) {
        socket.emit(event, payload);
      }
    }
  }
}
