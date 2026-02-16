import { useState, useEffect } from 'react';
import type { ModelInfo } from '../types';
import * as api from '../api/client';

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getModels()
      .then(setModels)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Failed to fetch models';
        setError(msg);
        console.error('Failed to fetch models:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { models, loading, error };
}
