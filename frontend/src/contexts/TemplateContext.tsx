import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Template, TemplateId } from '../types';

export interface TemplateContextValue {
  templates: Template[];
  selectedTemplateId: TemplateId | null;
  changeTemplate: (templateId: TemplateId | null) => void;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function TemplateProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TemplateContextValue;
}) {
  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook is standard for context files
export function useTemplate(): TemplateContextValue {
  const ctx = useContext(TemplateContext);
  if (!ctx) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return ctx;
}
