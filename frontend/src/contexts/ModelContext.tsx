import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ModelInfo } from '../types';

export interface ModelContextValue {
  models: ModelInfo[];
  selectedModel: string;
  changeModel: (model: string) => void;
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

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook is standard for context files
export function useModel(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return ctx;
}
