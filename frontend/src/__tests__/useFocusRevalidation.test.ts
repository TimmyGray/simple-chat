import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFocusRevalidation } from '../hooks/useFocusRevalidation';

describe('useFocusRevalidation', () => {
  let revalidate: ReturnType<typeof vi.fn<() => void>>;
  let hiddenGetter: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    revalidate = vi.fn<() => void>();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    hiddenGetter = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    hiddenGetter.mockRestore();
  });

  it('calls revalidate on window focus when document is visible', () => {
    renderHook(() => useFocusRevalidation(revalidate));

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('calls revalidate on visibilitychange when transitioning to visible', () => {
    renderHook(() => useFocusRevalidation(revalidate));

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it('does NOT call revalidate when document is hidden', () => {
    hiddenGetter.mockReturnValue(true);
    renderHook(() => useFocusRevalidation(revalidate));

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(revalidate).not.toHaveBeenCalled();
  });

  it('throttles calls within the throttle window', () => {
    renderHook(() => useFocusRevalidation(revalidate, 30_000));

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(revalidate).toHaveBeenCalledTimes(1);

    // Advance 10s — still within throttle window
    act(() => {
      vi.advanceTimersByTime(10_000);
      window.dispatchEvent(new Event('focus'));
    });
    expect(revalidate).toHaveBeenCalledTimes(1);

    // Advance past throttle window (total 31s)
    act(() => {
      vi.advanceTimersByTime(21_000);
      window.dispatchEvent(new Event('focus'));
    });
    expect(revalidate).toHaveBeenCalledTimes(2);
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useFocusRevalidation(revalidate));
    unmount();

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(revalidate).not.toHaveBeenCalled();
  });

  it('respects custom throttleMs parameter', () => {
    renderHook(() => useFocusRevalidation(revalidate, 5_000));

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(revalidate).toHaveBeenCalledTimes(1);

    // 5s later — should allow another call
    act(() => {
      vi.advanceTimersByTime(5_000);
      window.dispatchEvent(new Event('focus'));
    });
    expect(revalidate).toHaveBeenCalledTimes(2);
  });
});
