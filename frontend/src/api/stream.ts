import type { Attachment, ConversationId, MessageId, ModelId } from '../types';
import { getStoredToken, clearStoredToken, BASE_URL } from './client';
import { getErrorMessage, isAbortError } from '../utils/getErrorMessage';

const STREAM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

async function streamFromEndpoint(
  url: string,
  body: Record<string, unknown>,
  onChunk?: (text: string) => void,
  onDone?: () => void,
  onError?: (error: string, code?: string) => void,
  abortSignal?: AbortSignal,
  headers?: Record<string, string>,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  // Allow external abort (e.g., stop generation button)
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => controller.abort());
  }

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };
    const token = getStoredToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      if (response.status === 401 && getStoredToken()) {
        clearStoredToken();
        window.location.reload();
        return;
      }
      onError?.(`HTTP error: ${response.status}`);
      return;
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);

        if (payload === '[DONE]') {
          onDone?.();
          return;
        }

        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            onError?.(parsed.error, parsed.code);
            return;
          }
          if (parsed.content) {
            onChunk?.(parsed.content);
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    onDone?.();
  } catch (err) {
    if (isAbortError(err)) {
      onError?.(abortSignal?.aborted ? 'Generation stopped' : 'Stream timeout');
    } else {
      onError?.(getErrorMessage(err, 'Stream failed'));
    }
  } finally {
    clearTimeout(timeout);
    reader?.cancel().catch(() => {});
  }
}

export async function sendMessageStream(
  conversationId: ConversationId,
  content: string,
  model?: ModelId,
  attachments?: Attachment[],
  onChunk?: (text: string) => void,
  onDone?: () => void,
  onError?: (error: string, code?: string) => void,
  abortSignal?: AbortSignal,
  idempotencyKey?: string,
): Promise<void> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  return streamFromEndpoint(
    `${BASE_URL}/conversations/${conversationId}/messages`,
    { content, model, attachments },
    onChunk,
    onDone,
    onError,
    abortSignal,
    headers,
  );
}

export async function editMessageStream(
  conversationId: ConversationId,
  messageId: MessageId,
  content: string,
  onChunk?: (text: string) => void,
  onDone?: () => void,
  onError?: (error: string, code?: string) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  return streamFromEndpoint(
    `${BASE_URL}/conversations/${conversationId}/messages/${messageId}/edit`,
    { content },
    onChunk,
    onDone,
    onError,
    abortSignal,
  );
}

export async function regenerateMessageStream(
  conversationId: ConversationId,
  messageId: MessageId,
  onChunk?: (text: string) => void,
  onDone?: () => void,
  onError?: (error: string, code?: string) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  return streamFromEndpoint(
    `${BASE_URL}/conversations/${conversationId}/messages/${messageId}/regenerate`,
    {},
    onChunk,
    onDone,
    onError,
    abortSignal,
  );
}
