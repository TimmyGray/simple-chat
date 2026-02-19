import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ModelInfo } from '../types';
import * as api from '../api/client';

export function useModels() {
  const { t } = useTranslation();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getModels()
      .then(setModels)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : t('errors.fetchModels');
        setError(msg);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { models, loading, error, clearError };
}
