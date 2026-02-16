import axios from 'axios';
import type { Conversation, Message, ModelInfo, Attachment } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
});

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get('/conversations');
  return data;
}

export async function createConversation(
  body?: { title?: string; model?: string },
): Promise<Conversation> {
  const { data } = await api.post('/conversations', body || {});
  return data;
}

export async function updateConversation(
  id: string,
  body: { title?: string; model?: string },
): Promise<Conversation> {
  const { data } = await api.patch(`/conversations/${id}`, body);
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  await api.delete(`/conversations/${id}`);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return data;
}

const STREAM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function sendMessageStream(
  conversationId: string,
  content: string,
  model?: string,
  attachments?: Attachment[],
  onChunk?: (text: string) => void,
  onDone?: () => void,
  onError?: (error: string) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  // Allow external abort (e.g., stop generation button)
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => controller.abort());
  }

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  try {
    const response = await fetch(
      `${BASE_URL}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, model, attachments }),
        signal: controller.signal,
      },
    );

    if (!response.ok || !response.body) {
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
            onError?.(parsed.error);
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
    if (err instanceof DOMException && err.name === 'AbortError') {
      onError?.(abortSignal?.aborted ? 'Generation stopped' : 'Stream timeout');
    } else {
      onError?.(err instanceof Error ? err.message : 'Stream failed');
    }
  } finally {
    clearTimeout(timeout);
    reader?.cancel().catch(() => {});
  }
}

export async function uploadFiles(files: File[]): Promise<Attachment[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getModels(): Promise<ModelInfo[]> {
  const { data } = await api.get('/models');
  return data;
}
