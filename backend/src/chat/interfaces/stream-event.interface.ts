import type { TokenUsage } from '../../types/documents';

export type StreamEvent =
  | { type: 'content'; content: string }
  | { type: 'done'; usage?: TokenUsage }
  | { type: 'error'; message: string };
