export type StreamEvent =
  | { type: 'content'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string };
