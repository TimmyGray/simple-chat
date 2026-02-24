/**
 * Extract the message from an unknown caught error.
 *
 * Replaces inline `err instanceof Error ? err.message : ...` patterns
 * throughout the backend for consistency and type safety.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Extract the stack trace from an unknown caught error.
 *
 * NestJS Logger accepts `(message, trace?)` — use this for the trace arg.
 */
export function getErrorStack(err: unknown): string | undefined {
  return err instanceof Error ? err.stack : undefined;
}
