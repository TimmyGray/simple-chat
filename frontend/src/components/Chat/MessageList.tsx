import { useEffect, useRef } from 'react';
import { Box, CircularProgress } from '@mui/material';
import type { Message } from '../../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  streaming: boolean;
  streamingContent: string;
}

export default function MessageList({
  messages,
  loading,
  streaming,
  streamingContent,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        px: { xs: 2, md: 4 },
        py: 2,
      }}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg._id} message={msg} />
      ))}

      {/* Streaming message */}
      {streaming && streamingContent && (
        <MessageBubble
          message={{
            _id: 'streaming',
            conversationId: '',
            role: 'assistant',
            content: streamingContent,
            attachments: [],
            createdAt: new Date().toISOString(),
          }}
        />
      )}

      {streaming && !streamingContent && <TypingIndicator />}

      <div ref={bottomRef} />
    </Box>
  );
}
