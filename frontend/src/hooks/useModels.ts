import { useState, useEffect } from 'react';
import type { ModelInfo } from '../types';
import * as api from '../api/client';

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getModels()
      .then(setModels)
      .catch((err) => console.error('Failed to fetch models:', err))
      .finally(() => setLoading(false));
  }, []);

  return { models, loading };
}
