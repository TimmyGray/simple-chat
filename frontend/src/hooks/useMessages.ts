import { useState, useCallback } from 'react';
import type { Message, Attachment } from '../types';
import * as api from '../api/client';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
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
        _id: `temp-${Date.now()}`,
        conversationId,
        role: 'user',
        content,
        attachments: attachments || [],
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      setStreaming(true);
      setStreamingContent('');

      let fullContent = '';

      await api.sendMessageStream(
        conversationId,
        content,
        model,
        attachments,
        (chunk) => {
          fullContent += chunk;
          setStreamingContent(fullContent);
        },
        () => {
          setStreaming(false);
          setStreamingContent('');
          // Add the full assistant message
          const assistantMsg: Message = {
            _id: `temp-assistant-${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: fullContent,
            model,
            attachments: [],
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        (error) => {
          setStreaming(false);
          setStreamingContent('');
          console.error('Streaming error:', error);
          const errorMsg: Message = {
            _id: `temp-error-${Date.now()}`,
            conversationId,
            role: 'assistant',
            content: `Error: ${error}`,
            attachments: [],
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
      );
    },
    [],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setStreaming(false);
  }, []);

  return {
    messages,
    loading,
    streaming,
    streamingContent,
    fetchMessages,
    sendMessage,
    clear,
  };
}
