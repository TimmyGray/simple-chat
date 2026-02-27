import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConversationId, Participant, ParticipantRole } from '../types';
import * as api from '../api/client';
import { getErrorMessage } from '../utils/getErrorMessage';

export interface UseSharingReturn {
  participants: Participant[];
  loading: boolean;
  inviting: boolean;
  error: string | null;
  clearError: () => void;
  fetchParticipants: (conversationId: ConversationId) => Promise<void>;
  invite: (conversationId: ConversationId, email: string, role?: ParticipantRole) => Promise<boolean>;
  revoke: (conversationId: ConversationId, userId: string) => Promise<void>;
}

export function useSharing(): UseSharingReturn {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async (conversationId: ConversationId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getParticipants(conversationId);
      setParticipants(data);
    } catch (err) {
      const msg = getErrorMessage(err, tRef.current('errors.fetchParticipants'), tRef.current('errors.corsOrNetwork'));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const invite = useCallback(async (conversationId: ConversationId, email: string, role?: ParticipantRole): Promise<boolean> => {
    setInviting(true);
    setError(null);
    try {
      const participant = await api.inviteParticipant(conversationId, email, role);
      setParticipants((prev) => [...prev, participant]);
      return true;
    } catch (err) {
      const msg = getErrorMessage(err, tRef.current('errors.inviteParticipant'), tRef.current('errors.corsOrNetwork'));
      setError(msg);
      return false;
    } finally {
      setInviting(false);
    }
  }, []);

  const revoke = useCallback(async (conversationId: ConversationId, userId: string) => {
    setError(null);
    try {
      await api.revokeParticipant(conversationId, userId);
      setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    } catch (err) {
      const msg = getErrorMessage(err, tRef.current('errors.revokeParticipant'), tRef.current('errors.corsOrNetwork'));
      setError(msg);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { participants, loading, inviting, error, clearError, fetchParticipants, invite, revoke };
}
