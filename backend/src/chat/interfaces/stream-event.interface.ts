import type { TokenUsage } from '../../types/documents';

/** Machine-readable SSE error codes sent alongside human-readable messages. */
export const SSE_ERROR_CODE = {
  STREAM_TIMEOUT: 'STREAM_TIMEOUT',
  LLM_FAILURE: 'LLM_FAILURE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type SseErrorCode = (typeof SSE_ERROR_CODE)[keyof typeof SSE_ERROR_CODE];

export type StreamEvent =
  | { type: 'content'; content: string }
  | { type: 'done'; usage?: TokenUsage }
  | { type: 'error'; code: SseErrorCode; message: string };
