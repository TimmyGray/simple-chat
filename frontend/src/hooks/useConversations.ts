import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Conversation, ConversationId, ModelId } from '../types';
import * as api from '../api/client';
import { useFocusRevalidation } from './useFocusRevalidation';
import { getErrorMessage } from '../utils/getErrorMessage';

export function useConversations() {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);

  const fetchConversations = useCallback(async () => {
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
        const msg = getErrorMessage(err, tRef.current('errors.fetchConversations'), tRef.current('errors.corsOrNetwork'));
        setError(msg);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useFocusRevalidation(fetchConversations);

  const create = useCallback(
    async (model?: ModelId) => {
      try {
        const conversation = await api.createConversation({ model });
        setConversations((prev) => [conversation, ...prev]);
        return conversation;
      } catch (err) {
        const msg = getErrorMessage(err, tRef.current('errors.createConversation'), tRef.current('errors.corsOrNetwork'));
        setError(msg);
        throw err;
      }
    },
    [],
  );

  const update = useCallback(
    async (id: ConversationId, body: { title?: string; model?: ModelId }) => {
      try {
        const updated = await api.updateConversation(id, body);
        setConversations((prev) =>
          prev.map((c) => (c._id === id ? updated : c)),
        );
        return updated;
      } catch (err) {
        const msg = getErrorMessage(err, tRef.current('errors.updateConversation'), tRef.current('errors.corsOrNetwork'));
        setError(msg);
        throw err;
      }
    },
    [],
  );

  const remove = useCallback(async (id: ConversationId) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      const msg = getErrorMessage(err, tRef.current('errors.deleteConversation'), tRef.current('errors.corsOrNetwork'));
      setError(msg);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { conversations, loading, error, clearError, refresh: fetchConversations, create, update, remove };
}
