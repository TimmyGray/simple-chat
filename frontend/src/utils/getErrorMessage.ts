/**
 * Detect network errors that likely indicate a CORS misconfiguration or
 * unreachable server.  Browsers intentionally hide CORS failure details,
 * so we use a heuristic: a network-level error while the browser reports
 * itself as online.
 *
 * Covers both Axios (`ERR_NETWORK`) and native `fetch` (`TypeError`).
 */
export function isCorsLikeError(err: unknown): boolean {
  const online =
    typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!online) return false;

  // Axios network error — no response, code === 'ERR_NETWORK'
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'ERR_NETWORK'
  ) {
    return true;
  }

  // Fetch TypeError — CORS blocks surface as "Failed to fetch" (Chrome),
  // "Load failed" (Safari), or "NetworkError" (Firefox).
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('load failed') ||
      msg.includes('networkerror')
    );
  }

  return false;
}

/**
 * Extract a user-friendly error message from an unknown caught error.
 *
 * Usage:
 *   catch (err) {
 *     const msg = getErrorMessage(err, t('errors.fallbackKey'));
 *   }
 *
 * When `corsMessage` is provided the function checks for CORS-like
 * network errors first and returns that message instead.
 */
export function getErrorMessage(
  err: unknown,
  fallback: string,
  corsMessage?: string,
): string {
  if (corsMessage && isCorsLikeError(err)) return corsMessage;
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
