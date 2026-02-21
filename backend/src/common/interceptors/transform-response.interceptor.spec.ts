import { describe, it, expect, vi } from 'vitest';
import { of, lastValueFrom } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor';

function createInterceptor(skipValue?: boolean) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(skipValue ?? false),
  } as any;
  return {
    interceptor: new TransformResponseInterceptor(reflector),
    reflector,
  };
}

const mockContext = {
  getHandler: vi.fn(),
  getClass: vi.fn(),
} as any;

describe('TransformResponseInterceptor', () => {
  it('should wrap an object response in { data: ... }', async () => {
    const { interceptor } = createInterceptor();
    const body = { accessToken: 'jwt-token-123' };
    const handler = { handle: () => of(body) } as any;

    const result$ = interceptor.intercept(mockContext, handler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual({ data: { accessToken: 'jwt-token-123' } });
  });

  it('should wrap an array response in { data: [...] }', async () => {
    const { interceptor } = createInterceptor();
    const body = [
      { _id: '1', title: 'Chat 1' },
      { _id: '2', title: 'Chat 2' },
    ];
    const handler = { handle: () => of(body) } as any;

    const result$ = interceptor.intercept(mockContext, handler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual({ data: body });
  });

  it('should wrap null response in { data: null }', async () => {
    const { interceptor } = createInterceptor();
    const handler = { handle: () => of(null) } as any;

    const result$ = interceptor.intercept(mockContext, handler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual({ data: null });
  });

  it('should wrap undefined response in { data: undefined }', async () => {
    const { interceptor } = createInterceptor();
    const handler = { handle: () => of(undefined) } as any;

    const result$ = interceptor.intercept(mockContext, handler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual({ data: undefined });
  });

  it('should skip wrapping when @SkipTransform() is applied', async () => {
    const { interceptor } = createInterceptor(true);
    const body = { status: 'ok', info: { mongodb: { status: 'up' } } };
    const handler = { handle: () => of(body) } as any;

    const result$ = interceptor.intercept(mockContext, handler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual(body);
  });

  it('should use Reflector to check handler and class metadata', async () => {
    const { interceptor, reflector } = createInterceptor();
    const handler = { handle: () => of('ok') } as any;

    await lastValueFrom(interceptor.intercept(mockContext, handler));

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('skipTransform', [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });
});
