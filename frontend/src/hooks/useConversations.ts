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
      const conversation = await api.createConversation({ model });
      setConversations((prev) => [conversation, ...prev]);
      return conversation;
    },
    [],
  );

  const update = useCallback(
    async (id: string, body: { title?: string; model?: string }) => {
      const updated = await api.updateConversation(id, body);
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? updated : c)),
      );
      return updated;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await api.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c._id !== id));
  }, []);

  return { conversations, loading, error, refresh: fetch, create, update, remove };
}
