import { useRef, useMemo, useEffect, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
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
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const isAtBottomRef = useRef(true);

  const items = useMemo(() => {
    if (!streaming || !streamingContent) return messages;
    return [
      ...messages,
      {
        _id: 'streaming',
        conversationId: '',
        role: 'assistant' as const,
        content: streamingContent,
        attachments: [],
        createdAt: new Date().toISOString(),
      },
    ];
  }, [messages, streaming, streamingContent]);

  // Auto-scroll during streaming when content grows
  useEffect(() => {
    if (isAtBottomRef.current && streaming && streamingContent && items.length > 0) {
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({
          index: items.length - 1,
          align: 'end',
          behavior: 'smooth',
        });
      });
    }
  }, [streamingContent, streaming, items.length]);

  const handleAtBottomChange = useCallback((atBottom: boolean) => {
    isAtBottomRef.current = atBottom;
  }, []);

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
    <Virtuoso
      ref={virtuosoRef}
      style={{ flex: 1 }}
      data={items}
      followOutput="smooth"
      atBottomStateChange={handleAtBottomChange}
      atBottomThreshold={100}
      initialTopMostItemIndex={items.length > 0 ? items.length - 1 : 0}
      increaseViewportBy={200}
      itemContent={(_, message) => (
        <Box sx={{ px: { xs: 2, md: 4 }, pb: 2 }}>
          <MessageBubble message={message} />
        </Box>
      )}
      components={{
        Header: () => <Box sx={{ height: 16 }} />,
        Footer: () =>
          streaming && !streamingContent ? (
            <Box sx={{ px: { xs: 2, md: 4 }, pb: 2 }}>
              <TypingIndicator />
            </Box>
          ) : (
            <Box sx={{ height: 16 }} />
          ),
      }}
    />
  );
}
