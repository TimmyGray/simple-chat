import { useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import type { Conversation, ModelInfo, Attachment } from '../../types';
import { useMessages } from '../../hooks/useMessages';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import EmptyState from '../common/EmptyState';

interface ChatAreaProps {
  conversation: Conversation | null;
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  onConversationUpdate?: () => void;
}

export default function ChatArea({
  conversation,
  models,
  selectedModel,
  onModelChange,
  onConversationUpdate,
}: ChatAreaProps) {
  const { messages, loading, streaming, streamingContent, fetchMessages, sendMessage, clear } =
    useMessages();

  useEffect(() => {
    if (conversation) {
      fetchMessages(conversation._id);
    } else {
      clear();
    }
  }, [conversation, fetchMessages, clear]);

  const handleSend = useCallback(
    async (content: string, attachments: Attachment[]) => {
      if (!conversation) return;
      await sendMessage(
        conversation._id,
        content,
        selectedModel,
        attachments.length > 0 ? attachments : undefined,
      );
      onConversationUpdate?.();
    },
    [conversation, selectedModel, sendMessage, onConversationUpdate],
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
      <MessageList
        messages={messages}
        loading={loading}
        streaming={streaming}
        streamingContent={streamingContent}
      />
      <ChatInput
        models={models}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        onSend={handleSend}
        disabled={streaming}
      />
    </Box>
  );
}
