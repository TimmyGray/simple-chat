import { useEffect, useRef } from 'react';

const DEFAULT_THROTTLE_MS = 30_000;

/**
 * Revalidates data when the browser tab regains focus.
 * Throttled to avoid excessive requests (default: 30s between revalidations).
 */
export function useFocusRevalidation(
  revalidate: () => void,
  throttleMs = DEFAULT_THROTTLE_MS,
): void {
  const lastRef = useRef(0);

  useEffect(() => {
    const handler = () => {
      if (document.hidden) return;
      const now = Date.now();
      if (now - lastRef.current < throttleMs) return;
      lastRef.current = now;
      revalidate();
    };

    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);

    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, [revalidate, throttleMs]);
}
