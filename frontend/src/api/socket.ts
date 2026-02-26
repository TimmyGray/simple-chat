import { io, type Socket } from 'socket.io-client';
import type { Message, ConversationId, MessageId, ModelId } from '../types';
import { asConversationId, asMessageId, asModelId } from '../types';
import { getStoredToken, BASE_URL } from './client';

/** Server → Client events (mirror backend ws-events.interface.ts) */
export const WS_SERVER_EVENT = {
  MESSAGE_CREATED: 'message:created',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
} as const;

/** Client → Server events */
export const WS_CLIENT_EVENT = {
  JOIN_CONVERSATION: 'conversation:join',
  LEAVE_CONVERSATION: 'conversation:leave',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
} as const;

/** JSON-serialized message from WebSocket (ObjectId → string, Date → ISO string) */
export interface WsMessagePayload {
  conversationId: string;
  message: {
    _id: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    model?: string;
    isEdited?: boolean;
    attachments: Array<{
      fileName: string;
      fileType: string;
      filePath: string;
      fileSize: number;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}

export interface WsMessageDeletedPayload {
  conversationId: string;
  messageId: string;
}

export interface WsTypingPayload {
  conversationId: string;
  userId: string;
  email: string;
}

/** Convert WS message payload to frontend Message type */
export function toFrontendMessage(payload: WsMessagePayload): { conversationId: ConversationId; message: Message } {
  const { message: msg } = payload;
  return {
    conversationId: asConversationId(payload.conversationId),
    message: {
      _id: asMessageId(msg._id),
      conversationId: asConversationId(msg.conversationId),
      role: msg.role,
      content: msg.content,
      model: msg.model ? asModelId(msg.model) : undefined as ModelId | undefined,
      attachments: msg.attachments,
      isEdited: msg.isEdited,
      createdAt: msg.createdAt,
    },
  };
}

/** Convert WS deleted payload to typed IDs */
export function toDeletedIds(payload: WsMessageDeletedPayload): { conversationId: ConversationId; messageId: MessageId } {
  return {
    conversationId: asConversationId(payload.conversationId),
    messageId: asMessageId(payload.messageId),
  };
}

/** WebSocket URL is the root server (not /api) */
const WS_URL = BASE_URL.endsWith('/api') ? BASE_URL.slice(0, -4) : BASE_URL;

/** Create a new Socket.IO client instance (not yet connected) */
export function createSocket(): Socket {
  return io(WS_URL, {
    auth: (cb) => { cb({ token: getStoredToken() }); },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    transports: ['websocket', 'polling'],
  });
}
