import { describe, it, expect } from 'vitest';
import { getErrorMessage, getErrorStack } from './get-error-message';

describe('getErrorMessage', () => {
  it('returns message from Error instances', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns message from Error subclasses', () => {
    expect(getErrorMessage(new TypeError('bad type'))).toBe('bad type');
  });

  it('stringifies non-Error values', () => {
    expect(getErrorMessage('string error')).toBe('string error');
    expect(getErrorMessage(42)).toBe('42');
    expect(getErrorMessage(null)).toBe('null');
    expect(getErrorMessage(undefined)).toBe('undefined');
  });

  it('stringifies objects', () => {
    expect(getErrorMessage({ code: 'ERR' })).toBe('[object Object]');
  });
});

describe('getErrorStack', () => {
  it('returns stack from Error instances', () => {
    const err = new Error('boom');
    expect(getErrorStack(err)).toBe(err.stack);
  });

  it('returns undefined for non-Error values', () => {
    expect(getErrorStack('string')).toBeUndefined();
    expect(getErrorStack(42)).toBeUndefined();
    expect(getErrorStack(null)).toBeUndefined();
    expect(getErrorStack(undefined)).toBeUndefined();
    expect(getErrorStack({})).toBeUndefined();
  });
});
