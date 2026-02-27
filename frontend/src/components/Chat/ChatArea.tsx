import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Snackbar, Alert, Chip } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import type { Attachment, MessageId } from '../../types';
import { useChatApp } from '../../contexts/ChatAppContext';
import { useModel } from '../../contexts/ModelContext';
import { useTemplate } from '../../contexts/TemplateContext';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useMessages } from '../../hooks/useMessages';
import { WS_SERVER_EVENT, toFrontendMessage, toDeletedIds } from '../../api/socket';
import type { WsMessagePayload, WsMessageDeletedPayload, WsTypingPayload } from '../../api/socket';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ExportMenu from './ExportMenu';
import ShareButton from './ShareButton';
import ConnectionStatus from './ConnectionStatus';
import EmptyState from '../common/EmptyState';
import { ERROR_SNACKBAR_AUTO_HIDE_MS } from '../../constants';

const TYPING_DEBOUNCE_MS = 3000;
const TYPING_TIMEOUT_MS = 5000;

export default function ChatArea() {
  const {
    selectedConversation: conversation,
    currentUserId,
    isOnline,
    forkConversation,
    onConversationUpdate,
  } = useChatApp();
  const { models, selectedModel, changeModel } = useModel();
  const { templates, selectedTemplateId, changeTemplate } = useTemplate();
  const { socket, connectionStatus, reconnectCount, joinConversation, leaveConversation, emitTypingStart, emitTypingStop } = useWebSocketContext();
  const { t } = useTranslation();

  const {
    messages,
    loading,
    streaming,
    streamingContent,
    streamingToolCalls,
    fetchMessages,
    sendMessage,
    editMessage,
    regenerateMessage,
    stopStreaming,
    clear,
    addRemoteMessage,
    updateRemoteMessage,
    removeRemoteMessage,
  } = useMessages();

  const [exportError, setExportError] = useState<string | null>(null);
  const [remoteTypingUsers, setRemoteTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Escape key stops streaming when active
  useEffect(() => {
    if (!streaming) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        stopStreaming();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [streaming, stopStreaming]);

  const conversationId = conversation?._id ?? null;

  useEffect(() => {
    if (conversationId) {
      void fetchMessages(conversationId);
    } else {
      clear();
    }
  }, [conversationId, fetchMessages, clear]);

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

  const handleSend = useCallback(
    async (content: string, attachments: Attachment[]) => {
      if (!conversation) return;
      // Stop typing indicator on send
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
        emitTypingStop(conversation._id);
      }
      await sendMessage(
        conversation._id,
        content,
        selectedModel,
        attachments.length > 0 ? attachments : undefined,
      );
      onConversationUpdate();
    },
    [conversation, selectedModel, sendMessage, onConversationUpdate, emitTypingStop],
  );

  const handleEditMessage = useCallback(
    async (messageId: MessageId, content: string) => {
      if (!conversation) return;
      await editMessage(conversation._id, messageId, content);
      onConversationUpdate();
    },
    [conversation, editMessage, onConversationUpdate],
  );

  const handleRegenerateMessage = useCallback(
    async (messageId: MessageId) => {
      if (!conversation) return;
      await regenerateMessage(conversation._id, messageId);
      onConversationUpdate();
    },
    [conversation, regenerateMessage, onConversationUpdate],
  );

  const handleForkMessage = useCallback(
    async (messageId: MessageId) => {
      if (!conversation) return;
      if (!/^[a-f\d]{24}$/i.test(messageId)) return;
      await forkConversation(conversation._id, messageId);
    },
    [conversation, forkConversation],
  );

  const conversationTemplateId = conversation?.templateId ?? null;
  const activeTemplateName = useMemo(() => {
    if (!conversationTemplateId) return null;
    return templates.find((tmpl) => tmpl._id === conversationTemplateId)?.name ?? null;
  }, [conversationTemplateId, templates]);

  if (!conversation) {
    return <EmptyState />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        pb: 0.5,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', px: 1, pt: 0.5, gap: 1 }}>
        <ConnectionStatus status={connectionStatus} />
        {activeTemplateName && (
          <Chip
            icon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
            label={activeTemplateName}
            size="small"
            variant="outlined"
            color="primary"
            aria-label={t('templates.activeTemplate', { name: activeTemplateName })}
          />
        )}
        <ShareButton conversationId={conversation._id} currentUserId={currentUserId} />
        <ExportMenu conversationId={conversation._id} onError={setExportError} />
      </Box>
      <MessageList
        messages={messages}
        loading={loading}
        streaming={streaming}
        streamingContent={streamingContent}
        streamingToolCalls={streamingToolCalls}
        onEditMessage={handleEditMessage}
        onRegenerateMessage={handleRegenerateMessage}
        onForkMessage={handleForkMessage}
        onStopStreaming={stopStreaming}
        remoteTypingUsers={remoteTypingUsers}
      />
      <ChatInput
        key={conversation._id}
        models={models}
        selectedModel={selectedModel}
        onModelChange={changeModel}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={changeTemplate}
        onSend={handleSend}
        disabled={streaming || !isOnline}
        onTyping={handleTyping}
      />
      <Snackbar
        open={!!exportError}
        autoHideDuration={ERROR_SNACKBAR_AUTO_HIDE_MS}
        onClose={() => setExportError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
