import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../hooks/useAuth';
import * as api from '../api/client';

vi.mock('../api/client');

const mockUser = {
  _id: 'user-1',
  email: 'test@example.com',
  totalTokensUsed: 100,
  totalPromptTokens: 50,
  totalCompletionTokens: 50,
};

describe('useAuth — error scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no stored token (loading starts as false)
    vi.mocked(api.getStoredToken).mockReturnValue(null);
  });

  // ---- login errors ----

  it('sets specific message for 401 on login', async () => {
    const err401 = { response: { status: 401 } };
    vi.mocked(api.login).mockRejectedValue(err401);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('bad@example.com', 'wrong');
    });

    expect(result.current.error).toBe('Invalid email or password');
  });

  it('sets CORS message for CORS-like error on login', async () => {
    vi.mocked(api.login).mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.error).toBe(
      'Cannot reach the server. Check that the backend is running and CORS is configured correctly.',
    );
  });

  it('sets generic login failed message for unknown errors', async () => {
    vi.mocked(api.login).mockRejectedValue(new Error('Something unexpected'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.error).toBe('Sign in failed');
  });

  it('clears error on subsequent login attempt', async () => {
    vi.mocked(api.login)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ accessToken: 'token' });
    vi.mocked(api.getProfile).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'wrong');
    });
    expect(result.current.error).toBeTruthy();

    await act(async () => {
      await result.current.login('test@example.com', 'right');
    });
    // Error cleared at start of login
    expect(result.current.error).toBeNull();
  });

  it('clears token and sets error when profile fetch fails after login', async () => {
    vi.mocked(api.login).mockResolvedValue({ accessToken: 'valid-token' });
    vi.mocked(api.getProfile).mockRejectedValue(new Error('Profile unavailable'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(api.clearStoredToken).toHaveBeenCalled();
    expect(result.current.error).toBe('Sign in failed');
    expect(result.current.user).toBeNull();
  });

  // ---- register errors ----

  it('sets specific message for 409 on register', async () => {
    const err409 = { response: { status: 409 } };
    vi.mocked(api.register).mockRejectedValue(err409);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('taken@example.com', 'password123');
    });

    expect(result.current.error).toBe('This email is already registered');
  });

  it('sets CORS message for CORS-like error on register', async () => {
    vi.mocked(api.register).mockRejectedValue(new TypeError('Load failed'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('test@example.com', 'password');
    });

    expect(result.current.error).toBe(
      'Cannot reach the server. Check that the backend is running and CORS is configured correctly.',
    );
  });

  it('sets generic register failed message for unknown errors', async () => {
    vi.mocked(api.register).mockRejectedValue(new Error('Unknown'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('test@example.com', 'password');
    });

    expect(result.current.error).toBe('Sign up failed');
  });

  it('clears token and sets error when profile fetch fails after register', async () => {
    vi.mocked(api.register).mockResolvedValue({ accessToken: 'valid-token' });
    vi.mocked(api.getProfile).mockRejectedValue(new Error('Profile unavailable'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('test@example.com', 'password');
    });

    expect(api.clearStoredToken).toHaveBeenCalled();
    expect(result.current.error).toBe('Sign up failed');
    expect(result.current.user).toBeNull();
  });

  // ---- refreshUser ----

  it('silently ignores refreshUser failure', async () => {
    vi.mocked(api.getProfile).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.refreshUser();
    });

    // No error set, no user change
    expect(result.current.error).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('refreshUser updates user on success', async () => {
    vi.mocked(api.getProfile).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toEqual(mockUser);
  });

  // ---- initial profile load with stored token ----

  it('clears token on initial profile fetch failure', async () => {
    vi.mocked(api.getStoredToken).mockReturnValue('expired-token');
    vi.mocked(api.getProfile).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuth());

    // loading starts true because getStoredToken returns a token
    expect(result.current.loading).toBe(true);

    // Flush the useEffect that fetches profile
    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(api.clearStoredToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('sets user on successful initial profile load', async () => {
    vi.mocked(api.getStoredToken).mockReturnValue('valid-token');
    vi.mocked(api.getProfile).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
  });

  // ---- clearError ----

  it('clears error via clearError callback', async () => {
    vi.mocked(api.login).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'wrong');
    });
    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  // ---- logout ----

  it('clears user and token on logout', async () => {
    // Set up initial logged-in state via login flow
    vi.mocked(api.login).mockResolvedValue({ accessToken: 'token' });
    vi.mocked(api.getProfile).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);

    act(() => {
      result.current.logout();
    });

    expect(api.clearStoredToken).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
