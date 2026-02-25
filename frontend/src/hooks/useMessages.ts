import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Message, Attachment, ConversationId, MessageId, ModelId } from '../types';
import { asMessageId } from '../types';
import * as api from '../api/client';
import { getErrorMessage } from '../utils/getErrorMessage';

export interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  streaming: boolean;
  streamingContent: string;
  error: string | null;
  fetchMessages: (conversationId: ConversationId) => Promise<void>;
  sendMessage: (conversationId: ConversationId, content: string, model?: ModelId, attachments?: Attachment[]) => Promise<void>;
  editMessage: (conversationId: ConversationId, messageId: MessageId, content: string) => Promise<void>;
  regenerateMessage: (conversationId: ConversationId, messageId: MessageId) => Promise<void>;
  stopStreaming: () => void;
  clear: () => void;
}

export function useMessages(): UseMessagesReturn {
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

  const fetchMessages = useCallback(async (conversationId: ConversationId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      const msg = getErrorMessage(err, tRef.current('errors.fetchMessages'), tRef.current('errors.corsOrNetwork'));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Shared streaming boilerplate for send, edit, and regenerate operations. */
  const runStreamOperation = async (
    conversationId: ConversationId,
    streamFn: (
      onChunk: (chunk: string) => void,
      onDone: () => void,
      onError: (message: string, code?: string) => void,
      signal: AbortSignal,
    ) => Promise<void>,
    errorI18nKey: string,
    doneMessageExtra?: Partial<Message>,
  ) => {
    setError(null);
    setStreaming(true);
    setStreamingContent('');

    const abortController = new AbortController();
    abortRef.current = abortController;
    fullContentRef.current = '';
    let completed = false;

    try {
      await streamFn(
        (chunk) => {
          fullContentRef.current += chunk;
          setStreamingContent(fullContentRef.current);
        },
        () => {
          completed = true;
          const assistantMsg: Message = {
            _id: asMessageId(crypto.randomUUID()),
            conversationId,
            role: 'assistant',
            content: fullContentRef.current,
            attachments: [],
            createdAt: new Date().toISOString(),
            ...doneMessageExtra,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        (streamError, code) => {
          const i18nKey = code ? `errors.sse.${code}` : '';
          const localizedMsg = i18nKey && tRef.current(i18nKey) !== i18nKey
            ? tRef.current(i18nKey)
            : streamError;
          const errorMsg: Message = {
            _id: asMessageId(crypto.randomUUID()),
            conversationId,
            role: 'assistant',
            content: tRef.current('errors.streamErrorPrefix', { message: localizedMsg }),
            attachments: [],
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
        abortController.signal,
      );
    } catch (err) {
      if (!completed) {
        const msg = getErrorMessage(err, tRef.current(errorI18nKey), tRef.current('errors.corsOrNetwork'));
        setError(msg);
      }
    } finally {
      setStreaming(false);
      setStreamingContent('');
      fullContentRef.current = '';
      abortRef.current = null;
    }
  };

  const sendMessage = useCallback(
    async (
      conversationId: ConversationId,
      content: string,
      model?: ModelId,
      attachments?: Attachment[],
    ) => {
      if (abortRef.current) return;
      const userMsg: Message = {
        _id: asMessageId(crypto.randomUUID()),
        conversationId,
        role: 'user',
        content,
        attachments: attachments || [],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      const idempotencyKey = crypto.randomUUID();
      await runStreamOperation(
        conversationId,
        (onChunk, onDone, onError, signal) =>
          api.sendMessageStream(conversationId, content, model, attachments, onChunk, onDone, onError, signal, idempotencyKey),
        'errors.streamingFailed',
        { model },
      );
    },
    [],
  );

  const editMessage = useCallback(
    async (
      conversationId: ConversationId,
      messageId: MessageId,
      content: string,
    ) => {
      if (abortRef.current) return;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._id === messageId);
        if (idx === -1) return prev;
        const updated = prev.slice(0, idx + 1);
        updated[idx] = { ...updated[idx], content, isEdited: true };
        return updated;
      });
      await runStreamOperation(
        conversationId,
        (onChunk, onDone, onError, signal) =>
          api.editMessageStream(conversationId, messageId, content, onChunk, onDone, onError, signal),
        'errors.editFailed',
      );
    },
    [],
  );

  const regenerateMessage = useCallback(
    async (
      conversationId: ConversationId,
      messageId: MessageId,
    ) => {
      if (abortRef.current) return;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._id === messageId);
        if (idx === -1) return prev;
        return prev.slice(0, idx);
      });
      await runStreamOperation(
        conversationId,
        (onChunk, onDone, onError, signal) =>
          api.regenerateMessageStream(conversationId, messageId, onChunk, onDone, onError, signal),
        'errors.regenerateFailed',
      );
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
    editMessage,
    regenerateMessage,
    stopStreaming,
    clear,
  };
}
