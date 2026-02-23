import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ModelInfo } from '../types';
import * as api from '../api/client';
import { useFocusRevalidation } from './useFocusRevalidation';
import { getErrorMessage } from '../utils/getErrorMessage';

export function useModels() {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);

  const fetchModels = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (!initializedRef.current) {
      setError(null);
    }

    try {
      const data = await api.getModels();
      setModels(data);
      initializedRef.current = true;
    } catch (err) {
      if (!initializedRef.current) {
        const msg = getErrorMessage(err, tRef.current('errors.fetchModels'));
        setError(msg);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useFocusRevalidation(fetchModels);

  const clearError = useCallback(() => setError(null), []);

  return { models, loading, error, clearError };
}
