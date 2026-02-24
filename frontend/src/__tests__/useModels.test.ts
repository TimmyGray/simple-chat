import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useModels } from '../hooks/useModels';
import * as api from '../api/client';
import type { ModelInfo } from '../types';
import { asModelId } from '../types';

vi.mock('../api/client');

const mockModels: ModelInfo[] = [
  {
    id: asModelId('gpt-4'),
    name: 'GPT-4',
    description: 'Powerful model',
    free: false,
    contextLength: 8192,
    supportsVision: true,
  },
  {
    id: asModelId('llama-3'),
    name: 'Llama 3',
    description: 'Open model',
    free: true,
    contextLength: 4096,
    supportsVision: false,
  },
];

describe('useModels — error scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets error on initial fetch failure', async () => {
    vi.mocked(api.getModels).mockRejectedValue(new Error('Service unavailable'));

    const { result } = renderHook(() => useModels());

    await act(async () => {});

    expect(result.current.error).toBe('Service unavailable');
    expect(result.current.models).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('uses fallback message for non-Error thrown values', async () => {
    vi.mocked(api.getModels).mockRejectedValue(undefined);

    const { result } = renderHook(() => useModels());

    await act(async () => {});

    expect(result.current.error).toBe('Failed to fetch models');
  });

  it('shows CORS message for CORS-like errors', async () => {
    vi.mocked(api.getModels).mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useModels());

    await act(async () => {});

    expect(result.current.error).toBe(
      'Cannot reach the server. Check that the backend is running and CORS is configured correctly.',
    );
  });

  it('loads models successfully on initial fetch', async () => {
    vi.mocked(api.getModels).mockResolvedValueOnce(mockModels);

    const { result } = renderHook(() => useModels());

    await act(async () => {});

    expect(result.current.models).toEqual(mockModels);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('clears error via clearError callback', async () => {
    vi.mocked(api.getModels).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useModels());

    await act(async () => {});

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('finishes loading even on failure', async () => {
    vi.mocked(api.getModels).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useModels());

    await act(async () => {});

    expect(result.current.loading).toBe(false);
  });
});
