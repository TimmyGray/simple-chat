import { useRef, useMemo, useEffect, useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { Message, MessageId } from '../../types';
import { asMessageId, asConversationId } from '../../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import {
  VIRTUOSO_AT_BOTTOM_THRESHOLD,
  VIRTUOSO_VIEWPORT_INCREASE,
  LIST_SPACER_HEIGHT,
  LOADING_SPINNER_LG,
} from '../../constants';

const SCROLL_THROTTLE_MS = 150;

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  streaming: boolean;
  streamingContent: string;
  onEditMessage?: (messageId: MessageId, content: string) => void;
  onRegenerateMessage?: (messageId: MessageId) => void;
  onStopStreaming?: () => void;
}

export default function MessageList({
  messages,
  loading,
  streaming,
  streamingContent,
  onEditMessage,
  onRegenerateMessage,
  onStopStreaming,
}: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const isAtBottomRef = useRef(true);

  const items = useMemo(() => {
    if (!streaming || !streamingContent) return messages;
    return [
      ...messages,
      {
        _id: asMessageId('streaming'),
        conversationId: asConversationId(''),
        role: 'assistant' as const,
        content: streamingContent,
        attachments: [],
        createdAt: new Date().toISOString(),
      },
    ];
  }, [messages, streaming, streamingContent]);

  // Throttle scroll-to-bottom during streaming (F-M2)
  const lastScrollRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const scrollToBottom = useCallback(() => {
    lastScrollRef.current = Date.now();
    virtuosoRef.current?.scrollToIndex({
      index: items.length - 1,
      align: 'end',
      behavior: 'smooth',
    });
  }, [items.length]);

  useEffect(() => {
    if (!isAtBottomRef.current || !streaming || !streamingContent || items.length === 0) return;

    const elapsed = Date.now() - lastScrollRef.current;
    if (elapsed >= SCROLL_THROTTLE_MS) {
      requestAnimationFrame(scrollToBottom);
    } else if (!scrollTimerRef.current) {
      scrollTimerRef.current = setTimeout(() => {
        scrollTimerRef.current = null;
        requestAnimationFrame(scrollToBottom);
      }, SCROLL_THROTTLE_MS - elapsed);
    }

    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };
  }, [streamingContent, streaming, items.length, scrollToBottom]);

  // Deliver final scroll when streaming ends (pending timer would be cleared)
  useEffect(() => {
    if (!streaming && isAtBottomRef.current) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [streaming, scrollToBottom]);

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
        <CircularProgress size={LOADING_SPINNER_LG} />
      </Box>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      style={{ flex: 1 }}
      data={items}
      followOutput={(atBottom) => (atBottom && !streaming ? 'smooth' : false)}
      atBottomStateChange={handleAtBottomChange}
      atBottomThreshold={VIRTUOSO_AT_BOTTOM_THRESHOLD}
      initialTopMostItemIndex={items.length > 0 ? items.length - 1 : 0}
      increaseViewportBy={VIRTUOSO_VIEWPORT_INCREASE}
      itemContent={(_, message) => (
        <Box sx={{ px: { xs: 2, md: 3, lg: 4 }, pb: 2 }}>
          <MessageBubble
            message={message}
            onEdit={onEditMessage}
            onRegenerate={onRegenerateMessage}
            onStop={streaming && message._id === asMessageId('streaming') ? onStopStreaming : undefined}
            isStreaming={streaming && message._id === asMessageId('streaming')}
          />
        </Box>
      )}
      components={{
        Header: () => <Box sx={{ height: LIST_SPACER_HEIGHT }} />,
        Footer: () =>
          streaming && !streamingContent ? (
            <Box sx={{ px: { xs: 2, md: 3, lg: 4 }, pb: 2 }}>
              <TypingIndicator />
            </Box>
          ) : (
            <Box sx={{ height: LIST_SPACER_HEIGHT }} />
          ),
      }}
    />
  );
}
