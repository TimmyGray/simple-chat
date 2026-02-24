import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ThemeMode } from '../hooks/useThemeMode';

export interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ThemeModeContextValue;
}) {
  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook is standard for context files
export function useThemeModeContext(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error(
      'useThemeModeContext must be used within a ThemeModeProvider',
    );
  }
  return ctx;
}
