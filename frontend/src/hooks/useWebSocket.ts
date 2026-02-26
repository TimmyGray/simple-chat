import { useState, useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { createSocket, WS_CLIENT_EVENT } from '../api/socket';
import { getStoredToken } from '../api/client';
import type { ConversationId } from '../types';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface UseWebSocketReturn {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  joinConversation: (conversationId: ConversationId) => void;
  leaveConversation: (conversationId: ConversationId) => void;
  emitTypingStart: (conversationId: ConversationId) => void;
  emitTypingStop: (conversationId: ConversationId) => void;
}

export function useWebSocket(isAuthenticated: boolean): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !getStoredToken()) return;

    const newSocket = createSocket();
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setSocket(newSocket);
      setConnectionStatus('connected');
    });
    newSocket.on('disconnect', () => setConnectionStatus('disconnected'));
    newSocket.io.on('reconnect_attempt', () => setConnectionStatus('connecting'));
    newSocket.io.on('reconnect', () => setConnectionStatus('connected'));

    newSocket.connect();

    return () => {
      newSocket.removeAllListeners();
      newSocket.io.removeAllListeners();
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnectionStatus('disconnected');
    };
  }, [isAuthenticated]);

  const joinConversation = useCallback((conversationId: ConversationId) => {
    socketRef.current?.emit(WS_CLIENT_EVENT.JOIN_CONVERSATION, { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: ConversationId) => {
    socketRef.current?.emit(WS_CLIENT_EVENT.LEAVE_CONVERSATION, { conversationId });
  }, []);

  const emitTypingStart = useCallback((conversationId: ConversationId) => {
    socketRef.current?.emit(WS_CLIENT_EVENT.TYPING_START, { conversationId });
  }, []);

  const emitTypingStop = useCallback((conversationId: ConversationId) => {
    socketRef.current?.emit(WS_CLIENT_EVENT.TYPING_STOP, { conversationId });
  }, []);

  return {
    socket,
    connectionStatus,
    joinConversation,
    leaveConversation,
    emitTypingStart,
    emitTypingStop,
  };
}
