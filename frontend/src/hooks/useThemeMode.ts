import { useState, useEffect, useCallback } from 'react';
import type { PaletteMode } from '@mui/material';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme-mode';

function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'dark';
}

export interface UseThemeModeReturn {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: PaletteMode;
}

export function useThemeMode(): UseThemeModeReturn {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPreference);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const resolvedMode: PaletteMode =
    mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode;

  return { mode, setMode, resolvedMode };
}
