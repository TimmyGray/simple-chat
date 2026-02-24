import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';
import * as api from '../api/client';
import { hasResponseStatus, isCorsLikeError } from '../utils/getErrorMessage';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { t } = useTranslation();
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!api.getStoredToken());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;

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
  }, [loading]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { accessToken } = await api.login(email, password);
      api.setStoredToken(accessToken);
      try {
        const profile = await api.getProfile();
        setUser(profile);
      } catch {
        api.clearStoredToken();
        setError(tRef.current('auth.loginFailed'));
      }
    } catch (err) {
      if (hasResponseStatus(err) && err.response.status === 401) {
        setError(tRef.current('auth.invalidCredentials'));
        return;
      }
      if (isCorsLikeError(err)) {
        setError(tRef.current('errors.corsOrNetwork'));
        return;
      }
      setError(tRef.current('auth.loginFailed'));
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { accessToken } = await api.register(email, password);
      api.setStoredToken(accessToken);
      try {
        const profile = await api.getProfile();
        setUser(profile);
      } catch {
        api.clearStoredToken();
        setError(tRef.current('auth.registerFailed'));
      }
    } catch (err) {
      if (hasResponseStatus(err) && err.response.status === 409) {
        setError(tRef.current('auth.emailTaken'));
        return;
      }
      if (isCorsLikeError(err)) {
        setError(tRef.current('errors.corsOrNetwork'));
        return;
      }
      setError(tRef.current('auth.registerFailed'));
    }
  }, []);

  const logout = useCallback(() => {
    api.clearStoredToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      // Silently ignore refresh failures — user stays with stale data
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { user, loading, error, clearError, login, register, logout, refreshUser };
}
