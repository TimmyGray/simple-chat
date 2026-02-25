import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Template } from '../types';
import * as api from '../api/client';
import { getErrorMessage } from '../utils/getErrorMessage';

export interface UseTemplatesReturn {
  templates: Template[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
}

export function useTemplates(): UseTemplatesReturn {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchTemplates = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      const msg = getErrorMessage(err, tRef.current('errors.fetchTemplates'), tRef.current('errors.corsOrNetwork'));
      setError(msg);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const clearError = useCallback(() => setError(null), []);

  return { templates, loading, error, clearError, refresh: fetchTemplates };
}
