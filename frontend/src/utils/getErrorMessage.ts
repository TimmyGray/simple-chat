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
