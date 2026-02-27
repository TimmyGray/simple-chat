import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Message, Attachment, ConversationId, MessageId, ModelId, ToolCallEntry, ToolCallEvent, ToolResultEvent } from '../types';
import { asMessageId } from '../types';
import * as api from '../api/client';
import { getErrorMessage } from '../utils/getErrorMessage';

export interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  streaming: boolean;
  streamingContent: string;
  streamingToolCalls: ToolCallEntry[];
  error: string | null;
  fetchMessages: (conversationId: ConversationId) => Promise<void>;
  sendMessage: (conversationId: ConversationId, content: string, model?: ModelId, attachments?: Attachment[]) => Promise<void>;
  editMessage: (conversationId: ConversationId, messageId: MessageId, content: string) => Promise<void>;
  regenerateMessage: (conversationId: ConversationId, messageId: MessageId) => Promise<void>;
  stopStreaming: () => void;
  clear: () => void;
  addRemoteMessage: (message: Message) => void;
  updateRemoteMessage: (message: Message) => void;
  removeRemoteMessage: (messageId: MessageId) => void;
}

export function useMessages(): UseMessagesReturn {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCallEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fullContentRef = useRef('');
  const toolCallsRef = useRef<ToolCallEntry[]>([]);

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

  const handleToolCall = useCallback((tc: ToolCallEvent) => {
    const entry: ToolCallEntry = { name: tc.name, arguments: tc.arguments };
    toolCallsRef.current = [...toolCallsRef.current, entry];
    setStreamingToolCalls(toolCallsRef.current);
  }, []);

  const handleToolResult = useCallback((tr: ToolResultEvent) => {
    const calls = toolCallsRef.current;
    // Find the last entry matching this tool name that has no result yet
    let idx = -1;
    for (let i = calls.length - 1; i >= 0; i--) {
      if (calls[i].name === tr.name && !calls[i].result) {
        idx = i;
        break;
      }
    }
    if (idx !== -1) {
      const updated = [...calls];
      updated[idx] = { ...updated[idx], result: { content: tr.content, isError: tr.isError } };
      toolCallsRef.current = updated;
      setStreamingToolCalls(toolCallsRef.current);
    }
  }, []);

  /** Shared streaming boilerplate for send, edit, and regenerate operations. */
  const runStreamOperation = async (
    conversationId: ConversationId,
    streamFn: (
      onChunk: (chunk: string) => void,
      onDone: () => void,
      onError: (message: string, code?: string) => void,
      signal: AbortSignal,
      onToolCall: (tc: ToolCallEvent) => void,
      onToolResult: (tr: ToolResultEvent) => void,
    ) => Promise<void>,
    errorI18nKey: string,
    doneMessageExtra?: Partial<Message>,
  ) => {
    setError(null);
    setStreaming(true);
    setStreamingContent('');
    setStreamingToolCalls([]);

    const abortController = new AbortController();
    abortRef.current = abortController;
    fullContentRef.current = '';
    toolCallsRef.current = [];
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
            ...(toolCallsRef.current.length > 0 ? { toolCalls: toolCallsRef.current } : {}),
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
        handleToolCall,
        handleToolResult,
      );
    } catch (err) {
      if (!completed) {
        const msg = getErrorMessage(err, tRef.current(errorI18nKey), tRef.current('errors.corsOrNetwork'));
        setError(msg);
      }
    } finally {
      const savedToolCalls = toolCallsRef.current.length > 0
        ? [...toolCallsRef.current]
        : undefined;
      setStreaming(false);
      setStreamingContent('');
      setStreamingToolCalls([]);
      fullContentRef.current = '';
      toolCallsRef.current = [];
      abortRef.current = null;
      // Re-fetch messages to replace optimistic UUIDs with real server ObjectIds.
      // Without this, fork and regenerate fail because they need real _ids.
      if (completed) {
        const data = await api.getMessages(conversationId);
        // Merge tool calls into the last assistant message (backend doesn't persist them)
        if (savedToolCalls && data.length > 0) {
          const lastMsg = data[data.length - 1];
          if (lastMsg.role === 'assistant') {
            data[data.length - 1] = { ...lastMsg, toolCalls: savedToolCalls };
          }
        }
        setMessages(data);
      }
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
        (onChunk, onDone, onError, signal, onToolCall, onToolResult) =>
          api.sendMessageStream(conversationId, content, model, attachments, onChunk, onDone, onError, signal, idempotencyKey, onToolCall, onToolResult),
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
        (onChunk, onDone, onError, signal, onToolCall, onToolResult) =>
          api.editMessageStream(conversationId, messageId, content, onChunk, onDone, onError, signal, onToolCall, onToolResult),
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
        (onChunk, onDone, onError, signal, onToolCall, onToolResult) =>
          api.regenerateMessageStream(conversationId, messageId, onChunk, onDone, onError, signal, onToolCall, onToolResult),
        'errors.regenerateFailed',
      );
    },
    [],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingContent('');
    setStreamingToolCalls([]);
    fullContentRef.current = '';
    toolCallsRef.current = [];
    setStreaming(false);
    setError(null);
  }, []);

  const addRemoteMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === message._id)) return prev;
      return [...prev, message];
    });
  }, []);

  const updateRemoteMessage = useCallback((message: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m._id === message._id ? message : m)),
    );
  }, []);

  const removeRemoteMessage = useCallback((messageId: MessageId) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  }, []);

  return {
    messages,
    loading,
    streaming,
    streamingContent,
    streamingToolCalls,
    error,
    fetchMessages,
    sendMessage,
    editMessage,
    regenerateMessage,
    stopStreaming,
    clear,
    addRemoteMessage,
    updateRemoteMessage,
    removeRemoteMessage,
  };
}
