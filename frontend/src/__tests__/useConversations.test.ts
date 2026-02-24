import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConversations } from '../hooks/useConversations';
import * as api from '../api/client';
import type { Conversation } from '../types';
import { asConversationId, asModelId } from '../types';

vi.mock('../api/client');

const CONV_ID = asConversationId('conv-1');
const MODEL_ID = asModelId('test-model');

const mockConversation: Conversation = {
  _id: CONV_ID,
  title: 'Test Chat',
  model: MODEL_ID,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('useConversations — error scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- fetchConversations errors ----

  it('sets error on initial fetch failure', async () => {
    vi.mocked(api.getConversations).mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useConversations());

    // Flush the useEffect auto-fetch
    await act(async () => {});

    expect(result.current.error).toBe('Network down');
    expect(result.current.conversations).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('uses fallback message for non-Error thrown values', async () => {
    vi.mocked(api.getConversations).mockRejectedValue('string error');

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    expect(result.current.error).toBe('Failed to fetch conversations');
  });

  it('preserves stale data on revalidation failure', async () => {
    vi.mocked(api.getConversations)
      .mockResolvedValueOnce([mockConversation])
      .mockRejectedValueOnce(new Error('Revalidation failed'));

    const { result } = renderHook(() => useConversations());

    // Wait for initial successful fetch
    await act(async () => {});

    expect(result.current.conversations).toHaveLength(1);

    // Trigger revalidation (which will fail)
    await act(async () => {
      await result.current.refresh();
    });

    // Stale data preserved, no error shown (initializedRef is true)
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('clears error via clearError callback', async () => {
    vi.mocked(api.getConversations).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  // ---- create errors ----

  it('sets error and re-throws on create failure', async () => {
    vi.mocked(api.getConversations).mockResolvedValue([]);
    vi.mocked(api.createConversation).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.create(MODEL_ID);
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(result.current.error).toBe('Server error');
  });

  it('uses fallback message for create with non-Error', async () => {
    vi.mocked(api.getConversations).mockResolvedValue([]);
    vi.mocked(api.createConversation).mockRejectedValue(42);

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    await act(async () => {
      try {
        await result.current.create();
      } catch {
        // Expected re-throw
      }
    });

    expect(result.current.error).toBe('Failed to create conversation');
  });

  // ---- update errors ----

  it('sets error and re-throws on update failure', async () => {
    vi.mocked(api.getConversations).mockResolvedValue([mockConversation]);
    vi.mocked(api.updateConversation).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.update(CONV_ID, { title: 'New Title' });
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(result.current.error).toBe('Not found');
  });

  it('does not modify conversations list on update failure', async () => {
    vi.mocked(api.getConversations).mockResolvedValue([mockConversation]);
    vi.mocked(api.updateConversation).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    await act(async () => {
      try {
        await result.current.update(CONV_ID, { title: 'New' });
      } catch {
        // Expected
      }
    });

    // Original data preserved
    expect(result.current.conversations[0].title).toBe('Test Chat');
  });

  // ---- remove errors ----

  it('sets error and re-throws on remove failure', async () => {
    vi.mocked(api.getConversations).mockResolvedValue([mockConversation]);
    vi.mocked(api.deleteConversation).mockRejectedValue(new Error('Forbidden'));

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.remove(CONV_ID);
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(result.current.error).toBe('Forbidden');
  });

  it('does not remove conversation from list on remove failure', async () => {
    vi.mocked(api.getConversations).mockResolvedValue([mockConversation]);
    vi.mocked(api.deleteConversation).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    await act(async () => {
      try {
        await result.current.remove(CONV_ID);
      } catch {
        // Expected
      }
    });

    expect(result.current.conversations).toHaveLength(1);
  });

  // ---- CORS-like errors ----

  it('shows CORS message for CORS-like fetch error', async () => {
    const corsError = new TypeError('Failed to fetch');
    vi.mocked(api.getConversations).mockRejectedValue(corsError);

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    expect(result.current.error).toBe(
      'Cannot reach the server. Check that the backend is running and CORS is configured correctly.',
    );
  });

  it('shows CORS message for Axios ERR_NETWORK on create', async () => {
    vi.mocked(api.getConversations).mockResolvedValue([]);
    const axiosNetworkError = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    vi.mocked(api.createConversation).mockRejectedValue(axiosNetworkError);

    const { result } = renderHook(() => useConversations());

    await act(async () => {});

    await act(async () => {
      try {
        await result.current.create();
      } catch {
        // Expected re-throw
      }
    });

    expect(result.current.error).toBe(
      'Cannot reach the server. Check that the backend is running and CORS is configured correctly.',
    );
  });

  // ---- concurrent fetch guard ----

  it('ignores concurrent fetch when one is already in progress', async () => {
    let resolveFirst!: (value: Conversation[]) => void;
    vi.mocked(api.getConversations).mockReturnValue(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );

    const { result } = renderHook(() => useConversations());

    // First fetch is in progress (from useEffect). Call refresh — should be ignored
    const refreshPromise = act(async () => {
      await result.current.refresh();
    });

    // Resolve the first fetch
    await act(async () => {
      resolveFirst([mockConversation]);
      await refreshPromise;
    });

    // Only one API call should have been made (the second was skipped)
    expect(api.getConversations).toHaveBeenCalledTimes(1);
  });
});
