import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Conversation, ConversationId, MessageId, ModelId, TemplateId } from '../types';
import * as api from '../api/client';
import { useFocusRevalidation } from './useFocusRevalidation';
import { getErrorMessage } from '../utils/getErrorMessage';

export interface UseConversationsReturn {
  conversations: Conversation[];
  sharedConversations: Conversation[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  create: (model?: ModelId, templateId?: TemplateId | null) => Promise<Conversation>;
  update: (id: ConversationId, body: { title?: string; model?: ModelId }) => Promise<Conversation>;
  remove: (id: ConversationId) => Promise<void>;
  fork: (conversationId: ConversationId, messageId: MessageId) => Promise<Conversation>;
}

export function useConversations(): UseConversationsReturn {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sharedConversations, setSharedConversations] = useState<Conversation[]>([]);
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
      const [owned, shared] = await Promise.all([
        api.getConversations(),
        api.getSharedConversations(),
      ]);
      setConversations(owned);
      setSharedConversations(shared);
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
    void fetchConversations();
  }, [fetchConversations]);

  useFocusRevalidation(fetchConversations);

  const create = useCallback(
    async (model?: ModelId, templateId?: TemplateId | null) => {
      try {
        const conversation = await api.createConversation({
          model,
          ...(templateId ? { templateId } : {}),
        });
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

  const fork = useCallback(
    async (conversationId: ConversationId, messageId: MessageId) => {
      try {
        const forked = await api.forkConversation(conversationId, messageId);
        setConversations((prev) => [forked, ...prev]);
        return forked;
      } catch (err) {
        const msg = getErrorMessage(err, tRef.current('errors.forkConversation'), tRef.current('errors.corsOrNetwork'));
        setError(msg);
        throw err;
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { conversations, sharedConversations, loading, error, clearError, refresh: fetchConversations, create, update, remove, fork };
}
