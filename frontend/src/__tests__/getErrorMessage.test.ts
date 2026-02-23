import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  hasResponseStatus,
  isAbortError,
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
