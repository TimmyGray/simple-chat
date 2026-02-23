import { describe, it, expect, afterEach } from 'vitest';
import {
  getErrorMessage,
  hasResponseStatus,
  isAbortError,
  isCorsLikeError,
} from '../utils/getErrorMessage';

describe('getErrorMessage', () => {
  it('returns err.message for Error instances', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('returns fallback for non-Error values', () => {
    expect(getErrorMessage('string', 'fallback')).toBe('fallback');
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage(42, 'fallback')).toBe('fallback');
  });

  it('returns corsMessage for CORS-like errors when provided', () => {
    const axiosNetworkErr = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    expect(getErrorMessage(axiosNetworkErr, 'fallback', 'CORS error')).toBe('CORS error');
  });

  it('ignores corsMessage when error is not CORS-like', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback', 'CORS error')).toBe('boom');
  });

  it('ignores corsMessage when not provided', () => {
    const axiosNetworkErr = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    expect(getErrorMessage(axiosNetworkErr, 'fallback')).toBe('Network Error');
  });
});

describe('hasResponseStatus', () => {
  it('returns true for Axios-shaped errors', () => {
    const err = { response: { status: 401 } };
    expect(hasResponseStatus(err)).toBe(true);
    if (hasResponseStatus(err)) {
      expect(err.response.status).toBe(401);
    }
  });

  it('returns false for null', () => {
    expect(hasResponseStatus(null)).toBe(false);
  });

  it('returns false for plain Error', () => {
    expect(hasResponseStatus(new Error())).toBe(false);
  });

  it('returns false when response is null', () => {
    expect(hasResponseStatus({ response: null })).toBe(false);
  });

  it('returns false when status is a string', () => {
    expect(hasResponseStatus({ response: { status: '401' } })).toBe(false);
  });

  it('returns false when response is missing', () => {
    expect(hasResponseStatus({ message: 'oops' })).toBe(false);
  });
});

describe('isCorsLikeError', () => {
  it('returns true for Axios ERR_NETWORK errors when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const err = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    expect(isCorsLikeError(err)).toBe(true);
  });

  it('returns true for fetch TypeError when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    expect(isCorsLikeError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('returns false for Axios ERR_NETWORK when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const err = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    expect(isCorsLikeError(err)).toBe(false);
  });

  it('returns false for fetch TypeError when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(isCorsLikeError(new TypeError('Failed to fetch'))).toBe(false);
  });

  it('returns false for regular Error when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    expect(isCorsLikeError(new Error('Something broke'))).toBe(false);
  });

  it('returns false for null/undefined', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    expect(isCorsLikeError(null)).toBe(false);
    expect(isCorsLikeError(undefined)).toBe(false);
  });

  it('returns false for non-ERR_NETWORK Axios codes', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const err = Object.assign(new Error('timeout'), { code: 'ECONNABORTED' });
    expect(isCorsLikeError(err)).toBe(false);
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });
});

describe('isAbortError', () => {
  it('returns true for AbortError DOMException', () => {
    expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
  });

  it('returns false for other DOMException names', () => {
    expect(isAbortError(new DOMException('bad', 'NotFoundError'))).toBe(false);
  });

  it('returns false for plain Error', () => {
    expect(isAbortError(new Error('abort'))).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError(undefined)).toBe(false);
  });
});
