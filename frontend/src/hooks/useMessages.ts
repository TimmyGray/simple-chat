import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Message, Attachment } from '../types';
import * as api from '../api/client';

export function useMessages() {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fullContentRef = useRef('');

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : tRef.current('errors.fetchMessages');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      model?: string,
      attachments?: Attachment[],
    ) => {
      // Optimistically add user message
      const userMsg: Message = {
        _id: crypto.randomUUID(),
        conversationId,
        role: 'user',
        content,
        attachments: attachments || [],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setError(null);
      setStreaming(true);
      setStreamingContent('');

      const abortController = new AbortController();
      abortRef.current = abortController;
      fullContentRef.current = '';
      let completed = false;

      const idempotencyKey = crypto.randomUUID();

      try {
        await api.sendMessageStream(
          conversationId,
          content,
          model,
          attachments,
          (chunk) => {
            fullContentRef.current += chunk;
            setStreamingContent(fullContentRef.current);
          },
          () => {
            completed = true;
            const assistantMsg: Message = {
              _id: crypto.randomUUID(),
              conversationId,
              role: 'assistant',
              content: fullContentRef.current,
              model,
              attachments: [],
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          },
          (streamError) => {
            const errorMsg: Message = {
              _id: crypto.randomUUID(),
              conversationId,
              role: 'assistant',
              content: tRef.current('errors.streamErrorPrefix', { message: streamError }),
              attachments: [],
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMsg]);
          },
          abortController.signal,
          idempotencyKey,
        );
      } catch (err) {
        if (!completed) {
          const msg = err instanceof Error ? err.message : tRef.current('errors.streamingFailed');
          setError(msg);
        }
      } finally {
        setStreaming(false);
        setStreamingContent('');
        fullContentRef.current = '';
        abortRef.current = null;
      }
    },
    [],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingContent('');
    fullContentRef.current = '';
    setStreaming(false);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    streaming,
    streamingContent,
    error,
    fetchMessages,
    sendMessage,
    stopStreaming,
    clear,
  };
}
