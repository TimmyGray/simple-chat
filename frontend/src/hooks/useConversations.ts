import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '../types';
import * as api from '../api/client';

export function useConversations() {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : tRef.current('errors.fetchConversations');
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
        const msg = err instanceof Error ? err.message : tRef.current('errors.createConversation');
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
        const msg = err instanceof Error ? err.message : tRef.current('errors.updateConversation');
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
      const msg = err instanceof Error ? err.message : tRef.current('errors.deleteConversation');
      setError(msg);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { conversations, loading, error, clearError, refresh: fetch, create, update, remove };
}
