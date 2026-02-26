import type { MessageDoc } from '../../types/documents';

/** Events emitted from server to client */
export const WS_SERVER_EVENT = {
  MESSAGE_CREATED: 'message:created',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
} as const;

/** Events emitted from client to server */
export const WS_CLIENT_EVENT = {
  JOIN_CONVERSATION: 'conversation:join',
  LEAVE_CONVERSATION: 'conversation:leave',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
} as const;

export interface WsMessagePayload {
  conversationId: string;
  message: MessageDoc;
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

export interface WsPresencePayload {
  conversationId: string;
  userId: string;
  email: string;
}

export interface JoinConversationPayload {
  conversationId: string;
}

export interface LeaveConversationPayload {
  conversationId: string;
}
