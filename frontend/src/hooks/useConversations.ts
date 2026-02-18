import { useState, useEffect, useCallback } from 'react';
import type { Conversation } from '../types';
import * as api from '../api/client';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(msg);
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = useCallback(
    async (model?: string) => {
      try {
        const conversation = await api.createConversation({ model });
        setConversations((prev) => [conversation, ...prev]);
        return conversation;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create conversation';
        setError(msg);
        throw err;
      }
    },
    [],
  );

  const update = useCallback(
    async (id: string, body: { title?: string; model?: string }) => {
      try {
        const updated = await api.updateConversation(id, body);
        setConversations((prev) =>
          prev.map((c) => (c._id === id ? updated : c)),
        );
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update conversation';
        setError(msg);
        throw err;
      }
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(msg);
      throw err;
    }
  }, []);

  return { conversations, loading, error, refresh: fetch, create, update, remove };
}
