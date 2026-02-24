import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMessages } from '../hooks/useMessages';
import * as api from '../api/client';
import { asConversationId } from '../types';

vi.mock('../api/client');

const CONV_ID = asConversationId('conv-1');

describe('useMessages — additional error scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- CORS errors ----

  it('shows CORS message for CORS-like fetch error', async () => {
    vi.mocked(api.getMessages).mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.fetchMessages(CONV_ID);
    });

    expect(result.current.error).toBe(
      'Cannot reach the server. Check that the backend is running and CORS is configured correctly.',
    );
  });

  it('shows CORS message for Axios ERR_NETWORK on sendMessage', async () => {
    const axiosNetworkError = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    vi.mocked(api.sendMessageStream).mockRejectedValue(axiosNetworkError);

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    expect(result.current.error).toBe(
      'Cannot reach the server. Check that the backend is running and CORS is configured correctly.',
    );
  });

  // ---- sendMessage catch — non-Error thrown values ----

  it('uses fallback when catch receives a non-Error value', async () => {
    vi.mocked(api.sendMessageStream).mockRejectedValue('string error');

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    expect(result.current.error).toBe('Streaming failed');
  });

  // ---- sendMessage catch — does not set error when stream completed ----

  it('does not set error state when stream completed before catch', async () => {
    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, onChunk, onDone) => {
        onChunk?.('response');
        onDone?.();
        // Throw after completion
        throw new Error('Cleanup error');
      },
    );

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    // completed flag was true, so error is not set
    expect(result.current.error).toBeNull();
    // But the assistant message from onDone is present
    const assistant = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistant?.content).toBe('response');
  });

  // ---- onError callback creates assistant bubble ----

  it('adds server-side error as assistant message bubble', async () => {
    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, _onChunk, _onDone, onError) => {
        onError?.('Model overloaded, please try again');
      },
    );

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    const errorBubble = result.current.messages.find(
      (m) => m.role === 'assistant' && m.content.includes('Model overloaded'),
    );
    expect(errorBubble).toBeDefined();
  });

  // ---- onError with SSE error code ----

  it('uses raw message as fallback when i18n key is not found for SSE code', async () => {
    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, _onChunk, _onDone, onError) => {
        onError?.('The AI model failed to generate a response.', 'LLM_FAILURE');
      },
    );

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    // In test env, t() returns the key itself, so fallback uses raw message
    const errorBubble = result.current.messages.find(
      (m) => m.role === 'assistant' && m.content.includes('The AI model failed'),
    );
    expect(errorBubble).toBeDefined();
  });

  it('uses raw message when no SSE error code is provided', async () => {
    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, _onChunk, _onDone, onError) => {
        onError?.('Unknown server error');
      },
    );

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    const errorBubble = result.current.messages.find(
      (m) => m.role === 'assistant' && m.content.includes('Unknown server error'),
    );
    expect(errorBubble).toBeDefined();
  });

  // ---- clear during streaming ----

  it('clears error state along with messages', async () => {
    vi.mocked(api.getMessages).mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.fetchMessages(CONV_ID);
    });
    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clear();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.messages).toEqual([]);
  });

  // ---- multiple rapid sends ----

  it('handles sequential send errors independently', async () => {
    vi.mocked(api.sendMessageStream)
      .mockRejectedValueOnce(new Error('First fail'))
      .mockImplementationOnce(async (_convId, _content, _model, _attachments, onChunk, onDone) => {
        onChunk?.('Success');
        onDone?.();
      });

    const { result } = renderHook(() => useMessages());

    // First send — fails
    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'First');
    });
    expect(result.current.error).toBe('First fail');

    // Second send — succeeds, error cleared
    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Second');
    });
    expect(result.current.error).toBeNull();
    // Should have messages from both attempts: user1, user2, assistant2
    expect(result.current.messages).toHaveLength(3);
  });
});
