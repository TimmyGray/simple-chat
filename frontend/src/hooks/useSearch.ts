import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '../types';
import * as api from '../api/client';
import { getErrorMessage } from '../utils/getErrorMessage';

const DEBOUNCE_MS = 300;

export interface UseSearchReturn {
  query: string;
  results: Conversation[];
  loading: boolean;
  error: string | null;
  setQuery: (q: string) => void;
  reset: () => void;
}

export function useSearch(): UseSearchReturn {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        try {
          const data = await api.searchConversations(trimmed);
          if (!controller.signal.aborted) {
            setResults(data);
            setError(null);
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            const msg = getErrorMessage(
              err,
              tRef.current('errors.searchFailed'),
              tRef.current('errors.corsOrNetwork'),
            );
            setError(msg);
            setResults([]);
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setLoading(false);
    setError(null);
    abortRef.current?.abort();
  }, []);

  return { query, results, loading, error, setQuery, reset };
}
