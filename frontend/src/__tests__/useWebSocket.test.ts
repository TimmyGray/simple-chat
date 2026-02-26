import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWebSocket } from '../hooks/useWebSocket';
import { asConversationId } from '../types';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
  io: {
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  },
};

vi.mock('../api/socket', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/socket')>();
  return {
    ...actual,
    createSocket: vi.fn(() => mockSocket),
  };
});

vi.mock('../api/client', () => ({
  getStoredToken: vi.fn(() => 'test-token'),
  BASE_URL: 'http://localhost:3001/api',
}));

const CONV_ID = asConversationId('conv-123');

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.on.mockReset();
    mockSocket.emit.mockReset();
    mockSocket.connect.mockReset();
    mockSocket.disconnect.mockReset();
    mockSocket.removeAllListeners.mockReset();
    mockSocket.io.on.mockReset();
    mockSocket.io.removeAllListeners.mockReset();
  });

  it('starts disconnected when not authenticated', () => {
    const { result } = renderHook(() => useWebSocket(false));

    expect(result.current.connectionStatus).toBe('disconnected');
    expect(result.current.socket).toBeNull();
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('connects socket when authenticated', () => {
    renderHook(() => useWebSocket(true));

    expect(mockSocket.connect).toHaveBeenCalledOnce();
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
  });

  it('updates status to connected on connect event', () => {
    const { result } = renderHook(() => useWebSocket(true));

    const connectHandler = mockSocket.on.mock.calls.find(
      (args) => args[0] === 'connect',
    )?.[1];

    act(() => {
      connectHandler?.();
    });

    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.socket).toBe(mockSocket);
  });

  it('updates status to disconnected on disconnect event', () => {
    const { result } = renderHook(() => useWebSocket(true));

    // First connect
    const connectHandler = mockSocket.on.mock.calls.find(
      (args) => args[0] === 'connect',
    )?.[1];
    act(() => {
      connectHandler?.();
    });

    // Then disconnect
    const disconnectHandler = mockSocket.on.mock.calls.find(
      (args) => args[0] === 'disconnect',
    )?.[1];
    act(() => {
      disconnectHandler?.();
    });

    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('updates status to disconnected on connect_error', () => {
    const { result } = renderHook(() => useWebSocket(true));

    const errorHandler = mockSocket.on.mock.calls.find(
      (args) => args[0] === 'connect_error',
    )?.[1];

    act(() => {
      errorHandler?.();
    });

    expect(result.current.connectionStatus).toBe('disconnected');
  });

  it('increments reconnectCount on reconnect', () => {
    const { result } = renderHook(() => useWebSocket(true));

    expect(result.current.reconnectCount).toBe(0);

    const reconnectHandler = mockSocket.io.on.mock.calls.find(
      (args) => args[0] === 'reconnect',
    )?.[1];

    act(() => {
      reconnectHandler?.();
    });

    expect(result.current.reconnectCount).toBe(1);
    expect(result.current.connectionStatus).toBe('connected');
  });

  it('disconnects when authentication changes to false', () => {
    const { rerender } = renderHook(
      ({ auth }: { auth: boolean }) => useWebSocket(auth),
      { initialProps: { auth: true } },
    );

    rerender({ auth: false });

    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('emits join conversation event', () => {
    const { result } = renderHook(() => useWebSocket(true));

    act(() => {
      result.current.joinConversation(CONV_ID);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'conversation:join',
      { conversationId: CONV_ID },
    );
  });

  it('emits leave conversation event', () => {
    const { result } = renderHook(() => useWebSocket(true));

    act(() => {
      result.current.leaveConversation(CONV_ID);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'conversation:leave',
      { conversationId: CONV_ID },
    );
  });

  it('emits typing start event', () => {
    const { result } = renderHook(() => useWebSocket(true));

    act(() => {
      result.current.emitTypingStart(CONV_ID);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'typing:start',
      { conversationId: CONV_ID },
    );
  });

  it('emits typing stop event', () => {
    const { result } = renderHook(() => useWebSocket(true));

    act(() => {
      result.current.emitTypingStop(CONV_ID);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'typing:stop',
      { conversationId: CONV_ID },
    );
  });

  it('cleans up socket on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket(true));

    unmount();

    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});

describe('socket.ts utilities', () => {
  it('toFrontendMessage converts WS payload to frontend Message', async () => {
    const { toFrontendMessage } = await import('../api/socket');

    const payload = {
      conversationId: 'conv-abc',
      message: {
        _id: 'msg-123',
        conversationId: 'conv-abc',
        role: 'assistant' as const,
        content: 'Hello world',
        model: 'gpt-4',
        attachments: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    };

    const result = toFrontendMessage(payload);

    expect(result.conversationId).toBe('conv-abc');
    expect(result.message._id).toBe('msg-123');
    expect(result.message.role).toBe('assistant');
    expect(result.message.content).toBe('Hello world');
    expect(result.message.model).toBe('gpt-4');
  });

  it('toDeletedIds converts WS deleted payload to typed IDs', async () => {
    const { toDeletedIds } = await import('../api/socket');

    const payload = {
      conversationId: 'conv-abc',
      messageId: 'msg-456',
    };

    const result = toDeletedIds(payload);

    expect(result.conversationId).toBe('conv-abc');
    expect(result.messageId).toBe('msg-456');
  });
});
