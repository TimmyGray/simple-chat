import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMessages } from '../hooks/useMessages';
import * as api from '../api/client';
import type { Message, Attachment } from '../types';
import { asConversationId, asMessageId, asModelId } from '../types';

vi.mock('../api/client');

const CONV_ID = asConversationId('conv-1');
const MODEL_ID = asModelId('test-model');

const mockMessages: Message[] = [
  {
    _id: asMessageId('msg-1'),
    conversationId: CONV_ID,
    role: 'user',
    content: 'Hello',
    attachments: [],
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    _id: asMessageId('msg-2'),
    conversationId: CONV_ID,
    role: 'assistant',
    content: 'Hi there!',
    model: MODEL_ID,
    attachments: [],
    createdAt: '2026-01-01T00:00:01Z',
  },
];

describe('useMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Initial state ----

  it('returns correct initial state', () => {
    const { result } = renderHook(() => useMessages());

    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.streaming).toBe(false);
    expect(result.current.streamingContent).toBe('');
    expect(result.current.error).toBeNull();
  });

  // ---- fetchMessages ----

  it('fetches messages successfully', async () => {
    vi.mocked(api.getMessages).mockResolvedValue(mockMessages);

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.fetchMessages(CONV_ID);
    });

    expect(api.getMessages).toHaveBeenCalledWith(CONV_ID);
    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets loading true while fetching', async () => {
    let resolvePromise!: (value: Message[]) => void;
    vi.mocked(api.getMessages).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useMessages());

    let fetchPromise: Promise<void>;
    act(() => {
      fetchPromise = result.current.fetchMessages(CONV_ID);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise(mockMessages);
      await fetchPromise!;
    });

    expect(result.current.loading).toBe(false);
  });

  it('sets error on fetch failure', async () => {
    vi.mocked(api.getMessages).mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.fetchMessages(CONV_ID);
    });

    expect(result.current.error).toBe('Network down');
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('clears previous error on new fetch', async () => {
    vi.mocked(api.getMessages)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(mockMessages);

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.fetchMessages(CONV_ID);
    });
    expect(result.current.error).toBeTruthy();

    await act(async () => {
      await result.current.fetchMessages(CONV_ID);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.messages).toEqual(mockMessages);
  });

  // ---- sendMessage ----

  it('adds optimistic user message before streaming', async () => {
    vi.mocked(api.sendMessageStream).mockResolvedValue();

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi there');
    });

    // First message should be the optimistic user message
    const userMsg = result.current.messages[0];
    expect(userMsg).toBeDefined();
    expect(userMsg.role).toBe('user');
    expect(userMsg.content).toBe('Hi there');
    expect(userMsg.conversationId).toBe(CONV_ID);
    expect(userMsg.attachments).toEqual([]);
  });

  it('passes attachments to optimistic user message', async () => {
    vi.mocked(api.sendMessageStream).mockResolvedValue();

    const attachments: Attachment[] = [
      { fileName: 'test.pdf', fileType: 'application/pdf', filePath: '/uploads/test.pdf', fileSize: 1024 },
    ];

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Check this', MODEL_ID, attachments);
    });

    const userMsg = result.current.messages[0];
    expect(userMsg.attachments).toEqual(attachments);
  });

  it('accumulates streaming content via onChunk', async () => {
    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, onChunk, onDone) => {
        onChunk?.('Hello');
        onChunk?.(' World');
        onDone?.();
      },
    );

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    // After onDone, streaming resets
    expect(result.current.streaming).toBe(false);
    expect(result.current.streamingContent).toBe('');

    // Assistant message should have full accumulated content
    const assistantMsg = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistantMsg).toBeDefined();
    expect(assistantMsg!.content).toBe('Hello World');
  });

  it('sets streaming=true during stream and resets after', async () => {
    let resolveStream!: () => void;

    vi.mocked(api.sendMessageStream).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveStream = resolve;
        }),
    );

    const { result } = renderHook(() => useMessages());

    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage(CONV_ID, 'Hi');
    });

    expect(result.current.streaming).toBe(true);

    await act(async () => {
      resolveStream();
      await sendPromise!;
    });

    expect(result.current.streaming).toBe(false);
  });

  it('adds assistant message on stream completion', async () => {
    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, onChunk, onDone) => {
        onChunk?.('Response text');
        onDone?.();
      },
    );

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi', MODEL_ID);
    });

    expect(result.current.messages).toHaveLength(2); // user + assistant
    const assistantMsg = result.current.messages[1];
    expect(assistantMsg.role).toBe('assistant');
    expect(assistantMsg.content).toBe('Response text');
    expect(assistantMsg.model).toBe(MODEL_ID);
    expect(assistantMsg.conversationId).toBe(CONV_ID);
  });

  it('adds error message as assistant bubble on stream error callback', async () => {
    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, _onChunk, _onDone, onError) => {
        onError?.('Rate limit exceeded');
      },
    );

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    // Should have user message + error assistant message
    expect(result.current.messages).toHaveLength(2);
    const errorMsg = result.current.messages[1];
    expect(errorMsg.role).toBe('assistant');
    // i18n returns the key in test env — the content contains the error message via interpolation
    expect(errorMsg.content).toContain('Rate limit exceeded');
  });

  it('sets error state on network/catch error', async () => {
    vi.mocked(api.sendMessageStream).mockRejectedValue(new Error('Connection refused'));

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    expect(result.current.error).toBe('Connection refused');
    expect(result.current.streaming).toBe(false);
  });

  it('passes idempotency key and abort signal to sendMessageStream', async () => {
    vi.mocked(api.sendMessageStream).mockResolvedValue();

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi', MODEL_ID);
    });

    const call = vi.mocked(api.sendMessageStream).mock.calls[0];
    expect(call[0]).toBe(CONV_ID);    // conversationId
    expect(call[1]).toBe('Hi');        // content
    expect(call[2]).toBe(MODEL_ID);    // model
    expect(call[7]).toBeInstanceOf(AbortSignal); // abortSignal
    expect(typeof call[8]).toBe('string'); // idempotencyKey (UUID)
  });

  it('resets streamingContent and fullContentRef after send completes', async () => {
    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, onChunk, onDone) => {
        onChunk?.('partial');
        onDone?.();
      },
    );

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage(CONV_ID, 'Hi');
    });

    expect(result.current.streamingContent).toBe('');
    expect(result.current.streaming).toBe(false);
  });

  // ---- stopStreaming ----

  it('aborts the stream when stopStreaming is called', async () => {
    let capturedSignal!: AbortSignal;

    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, _onChunk, _onDone, _onError, signal) => {
        capturedSignal = signal!;
        // Simulate long-running stream that checks for abort
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (capturedSignal.aborted) {
              clearInterval(check);
              resolve();
            }
          }, 10);
        });
      },
    );

    const { result } = renderHook(() => useMessages());

    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage(CONV_ID, 'Hi');
    });

    expect(result.current.streaming).toBe(true);

    act(() => {
      result.current.stopStreaming();
    });

    await act(async () => {
      await sendPromise!;
    });

    expect(capturedSignal.aborted).toBe(true);
    expect(result.current.streaming).toBe(false);
  });

  // ---- clear ----

  it('resets all state when clear is called', async () => {
    vi.mocked(api.getMessages).mockResolvedValue(mockMessages);

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.fetchMessages(CONV_ID);
    });
    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.clear();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.streaming).toBe(false);
    expect(result.current.streamingContent).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('aborts active stream when clear is called', async () => {
    let capturedSignal!: AbortSignal;

    vi.mocked(api.sendMessageStream).mockImplementation(
      async (_convId, _content, _model, _attachments, _onChunk, _onDone, _onError, signal) => {
        capturedSignal = signal!;
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (capturedSignal.aborted) {
              clearInterval(check);
              resolve();
            }
          }, 10);
        });
      },
    );

    const { result } = renderHook(() => useMessages());

    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage(CONV_ID, 'Hi');
    });

    act(() => {
      result.current.clear();
    });

    await act(async () => {
      await sendPromise!;
    });

    expect(capturedSignal.aborted).toBe(true);
    expect(result.current.messages).toEqual([]);
  });
});
