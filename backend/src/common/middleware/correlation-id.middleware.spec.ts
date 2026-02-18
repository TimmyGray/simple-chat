import { describe, it, expect, vi } from 'vitest';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  const middleware = new CorrelationIdMiddleware();

  function createMocks(headers: Record<string, string> = {}) {
    const req = { headers: { ...headers } } as any;
    const res = { setHeader: vi.fn() } as any;
    const next = vi.fn();
    return { req, res, next };
  }

  it('should generate a UUID when no correlation ID header is present', () => {
    const { req, res, next } = createMocks();

    middleware.use(req, res, next);

    expect(req.headers['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', req.headers['x-correlation-id']);
    expect(next).toHaveBeenCalled();
  });

  it('should accept a valid UUID from the incoming header', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const { req, res, next } = createMocks({ 'x-correlation-id': validUuid });

    middleware.use(req, res, next);

    expect(req.headers['x-correlation-id']).toBe(validUuid);
    expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', validUuid);
    expect(next).toHaveBeenCalled();
  });

  it('should reject an invalid correlation ID and generate a new UUID', () => {
    const { req, res, next } = createMocks({ 'x-correlation-id': 'malicious\nheader-injection' });

    middleware.use(req, res, next);

    expect(req.headers['x-correlation-id']).not.toBe('malicious\nheader-injection');
    expect(req.headers['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(next).toHaveBeenCalled();
  });

  it('should reject overly long strings', () => {
    const longString = 'a'.repeat(200);
    const { req, res, next } = createMocks({ 'x-correlation-id': longString });

    middleware.use(req, res, next);

    expect(req.headers['x-correlation-id']).not.toBe(longString);
    expect(req.headers['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(next).toHaveBeenCalled();
  });
});
