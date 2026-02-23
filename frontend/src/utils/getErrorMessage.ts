/**
 * Extract a user-friendly error message from an unknown caught error.
 *
 * Usage:
 *   catch (err) {
 *     const msg = getErrorMessage(err, t('errors.fallbackKey'));
 *   }
 *
 * Returns `err.message` when the error is an Error instance,
 * otherwise returns the provided fallback string.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Type guard for errors with an HTTP response status (e.g. AxiosError). */
export function hasResponseStatus(
  err: unknown,
): err is { response: { status: number } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response: unknown }).response === 'object' &&
    (err as { response: unknown }).response !== null &&
    'status' in ((err as { response: object }).response) &&
    typeof (err as { response: { status: unknown } }).response.status ===
      'number'
  );
}

/** Type guard for AbortError thrown by AbortController. */
export function isAbortError(err: unknown): err is DOMException {
  return err instanceof DOMException && err.name === 'AbortError';
}
