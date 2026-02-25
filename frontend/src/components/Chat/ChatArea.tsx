import { useState, useEffect, useCallback } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import type { Attachment, MessageId } from '../../types';
import { useChatApp } from '../../contexts/ChatAppContext';
import { useModel } from '../../contexts/ModelContext';
import { useMessages } from '../../hooks/useMessages';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ExportMenu from './ExportMenu';
import EmptyState from '../common/EmptyState';
import { ERROR_SNACKBAR_AUTO_HIDE_MS } from '../../constants';

export default function ChatArea() {
  const {
    selectedConversation: conversation,
    isOnline,
    onConversationUpdate,
  } = useChatApp();
  const { models, selectedModel, changeModel } = useModel();

  const {
    messages,
    loading,
    streaming,
    streamingContent,
    fetchMessages,
    sendMessage,
    editMessage,
    regenerateMessage,
    stopStreaming,
    clear,
  } = useMessages();

  const [exportError, setExportError] = useState<string | null>(null);

  // Depend on conversation ID (not object reference) to avoid
  // re-fetching messages when the conversation list refreshes
  // but the selected conversation hasn't actually changed.
  const conversationId = conversation?._id ?? null;

  useEffect(() => {
    if (conversationId) {
      void fetchMessages(conversationId);
    } else {
      clear();
    }
  }, [conversationId, fetchMessages, clear]);

  const handleSend = useCallback(
    async (content: string, attachments: Attachment[]) => {
      if (!conversation) return;
      await sendMessage(
        conversation._id,
        content,
        selectedModel,
        attachments.length > 0 ? attachments : undefined,
      );
      onConversationUpdate();
    },
    [conversation, selectedModel, sendMessage, onConversationUpdate],
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pt: 0.5 }}>
        <ExportMenu conversationId={conversation._id} onError={setExportError} />
      </Box>
      <MessageList
        messages={messages}
        loading={loading}
        streaming={streaming}
        streamingContent={streamingContent}
        onEditMessage={handleEditMessage}
        onRegenerateMessage={handleRegenerateMessage}
        onStopStreaming={stopStreaming}
      />
      <ChatInput
        key={conversation._id}
        models={models}
        selectedModel={selectedModel}
        onModelChange={changeModel}
        onSend={handleSend}
        disabled={streaming || !isOnline}
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
