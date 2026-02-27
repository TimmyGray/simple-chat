import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { WS_SERVER_EVENT, toFrontendMessage, toDeletedIds } from '../api/socket';
import type { WsMessagePayload, WsMessageDeletedPayload, WsTypingPayload } from '../api/socket';
import type { ConnectionStatus } from './useWebSocket';
import type { ConversationId, Message, MessageId } from '../types';

const TYPING_DEBOUNCE_MS = 3000;
const TYPING_TIMEOUT_MS = 5000;

interface RemoteMessageHandlers {
  addRemoteMessage: (message: Message) => void;
  updateRemoteMessage: (message: Message) => void;
  removeRemoteMessage: (messageId: MessageId) => void;
}

interface UseConversationWebSocketReturn {
  connectionStatus: ConnectionStatus;
  remoteTypingUsers: string[];
  handleTyping: () => void;
  cancelTyping: () => void;
}

/**
 * Manages WebSocket room membership, real-time message sync,
 * and typing indicators for the active conversation.
 */
export function useConversationWebSocket(
  conversationId: ConversationId | null,
  handlers: RemoteMessageHandlers,
): UseConversationWebSocketReturn {
  const {
    socket,
    connectionStatus,
    reconnectCount,
    joinConversation,
    leaveConversation,
    emitTypingStart,
    emitTypingStop,
  } = useWebSocketContext();

  const [remoteTypingUsers, setRemoteTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Join/leave WebSocket rooms on conversation change + re-join after reconnect
  const prevConversationIdRef = useRef(conversationId);
  useEffect(() => {
    const prev = prevConversationIdRef.current;
    if (prev && prev !== conversationId) {
      leaveConversation(prev);
      // Clean up typing timeout from previous conversation
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
    if (conversationId) {
      joinConversation(conversationId);
    }
    prevConversationIdRef.current = conversationId;
    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId, reconnectCount, joinConversation, leaveConversation]);

  // Listen for WebSocket events
  const { addRemoteMessage, updateRemoteMessage, removeRemoteMessage } = handlers;
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleMessageCreated = (payload: WsMessagePayload) => {
      const { conversationId: msgConvId, message } = toFrontendMessage(payload);
      if (msgConvId === conversationId) {
        addRemoteMessage(message);
      }
    };

    const handleMessageUpdated = (payload: WsMessagePayload) => {
      const { conversationId: msgConvId, message } = toFrontendMessage(payload);
      if (msgConvId === conversationId) {
        updateRemoteMessage(message);
      }
    };

    const handleMessageDeleted = (payload: WsMessageDeletedPayload) => {
      const { conversationId: msgConvId, messageId } = toDeletedIds(payload);
      if (msgConvId === conversationId) {
        removeRemoteMessage(messageId);
      }
    };

    const handleTypingStart = (payload: WsTypingPayload) => {
      if (payload.conversationId !== conversationId) return;
      setRemoteTypingUsers((prev) =>
        prev.includes(payload.email) ? prev : [...prev, payload.email],
      );
      // Auto-clear after timeout (safety net)
      const existing = typingTimersRef.current.get(payload.userId);
      if (existing) clearTimeout(existing);
      typingTimersRef.current.set(
        payload.userId,
        setTimeout(() => {
          setRemoteTypingUsers((prev) => prev.filter((e) => e !== payload.email));
          typingTimersRef.current.delete(payload.userId);
        }, TYPING_TIMEOUT_MS),
      );
    };

    const handleTypingStop = (payload: WsTypingPayload) => {
      if (payload.conversationId !== conversationId) return;
      setRemoteTypingUsers((prev) => prev.filter((e) => e !== payload.email));
      const timer = typingTimersRef.current.get(payload.userId);
      if (timer) {
        clearTimeout(timer);
        typingTimersRef.current.delete(payload.userId);
      }
    };

    socket.on(WS_SERVER_EVENT.MESSAGE_CREATED, handleMessageCreated);
    socket.on(WS_SERVER_EVENT.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(WS_SERVER_EVENT.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(WS_SERVER_EVENT.TYPING_START, handleTypingStart);
    socket.on(WS_SERVER_EVENT.TYPING_STOP, handleTypingStop);

    const timers = typingTimersRef.current;
    return () => {
      socket.off(WS_SERVER_EVENT.MESSAGE_CREATED, handleMessageCreated);
      socket.off(WS_SERVER_EVENT.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(WS_SERVER_EVENT.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(WS_SERVER_EVENT.TYPING_START, handleTypingStart);
      socket.off(WS_SERVER_EVENT.TYPING_STOP, handleTypingStop);
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      setRemoteTypingUsers([]);
    };
  }, [socket, conversationId, addRemoteMessage, updateRemoteMessage, removeRemoteMessage]);

  // Typing emission with debounce
  const handleTyping = useCallback(() => {
    if (!conversationId) return;
    emitTypingStart(conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(conversationId);
      typingTimeoutRef.current = null;
    }, TYPING_DEBOUNCE_MS);
  }, [conversationId, emitTypingStart, emitTypingStop]);

  // Cancel typing debounce and immediately emit stop (used on message send)
  const cancelTyping = useCallback(() => {
    if (!conversationId) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      emitTypingStop(conversationId);
    }
  }, [conversationId, emitTypingStop]);

  return { connectionStatus, remoteTypingUsers, handleTyping, cancelTyping };
}
