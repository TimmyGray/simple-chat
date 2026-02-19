import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';
import * as api from '../api/client';

export function useAuth() {
  const { t } = useTranslation();
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  const hasToken = !!api.getStoredToken();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasToken) return;

    let cancelled = false;
    api
      .getProfile()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        if (!cancelled) api.clearStoredToken();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { accessToken } = await api.login(email, password);
      api.setStoredToken(accessToken);
      const profile = await api.getProfile();
      setUser(profile);
    } catch (err) {
      if (err instanceof Error && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 401) {
          setError(tRef.current('auth.invalidCredentials'));
          throw err;
        }
      }
      setError(tRef.current('auth.loginFailed'));
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { accessToken } = await api.register(email, password);
      api.setStoredToken(accessToken);
      const profile = await api.getProfile();
      setUser(profile);
    } catch (err) {
      if (err instanceof Error && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 409) {
          setError(tRef.current('auth.emailTaken'));
          throw err;
        }
      }
      setError(tRef.current('auth.registerFailed'));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    api.clearStoredToken();
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { user, loading, error, clearError, login, register, logout };
}
