import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import type { ConnectionStatus } from '../hooks/useWebSocket';
import type { ConversationId } from '../types';

export interface WebSocketContextValue {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  joinConversation: (conversationId: ConversationId) => void;
  leaveConversation: (conversationId: ConversationId) => void;
  emitTypingStart: (conversationId: ConversationId) => void;
  emitTypingStop: (conversationId: ConversationId) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: WebSocketContextValue;
}) {
  return (
    <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook is standard for context files
export function useWebSocketContext(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return ctx;
}
