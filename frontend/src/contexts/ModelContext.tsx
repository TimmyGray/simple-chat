import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ModelInfo, ModelId } from '../types';

export interface ModelContextValue {
  models: ModelInfo[];
  selectedModel: ModelId;
  changeModel: (model: ModelId) => void;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ModelContextValue;
}) {
  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return ctx;
}
