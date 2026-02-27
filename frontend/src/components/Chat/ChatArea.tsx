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
import { useConversationWebSocket } from '../../hooks/useConversationWebSocket';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ExportMenu from './ExportMenu';
import ShareButton from './ShareButton';
import ConnectionStatus from './ConnectionStatus';
import EmptyState from '../common/EmptyState';
import { ERROR_SNACKBAR_AUTO_HIDE_MS } from '../../constants';

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
  const { emitTypingStop } = useWebSocketContext();
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

  const conversationId = conversation?._id ?? null;

  const { connectionStatus, remoteTypingUsers, handleTyping } = useConversationWebSocket(
    conversationId,
    { addRemoteMessage, updateRemoteMessage, removeRemoteMessage },
  );

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

  useEffect(() => {
    if (conversationId) {
      void fetchMessages(conversationId);
    } else {
      clear();
    }
  }, [conversationId, fetchMessages, clear]);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

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
