import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '../types';
import * as api from '../api/client';
import { useFocusRevalidation } from './useFocusRevalidation';

export function useConversations() {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);

  const fetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    // Only show loading spinner on initial fetch, not revalidation
    if (!initializedRef.current) {
      setError(null);
    }

    try {
      const data = await api.getConversations();
      setConversations(data);
      initializedRef.current = true;
    } catch (err) {
      // Only surface errors when there's no stale data to show
      if (!initializedRef.current) {
        const msg = err instanceof Error ? err.message : tRef.current('errors.fetchConversations');
        setError(msg);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useFocusRevalidation(fetch);

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
