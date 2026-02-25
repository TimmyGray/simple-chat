import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { describe, it, expect } from 'vitest';
import { AdminGuard } from './admin.guard';

function createMockContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('should allow access for admin users', () => {
    const ctx = createMockContext({
      _id: new ObjectId(),
      email: 'admin@example.com',
      isAdmin: true,
      totalTokensUsed: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access for non-admin users', () => {
    const ctx = createMockContext({
      _id: new ObjectId(),
      email: 'user@example.com',
      isAdmin: false,
      totalTokensUsed: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
    });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should deny access when user is undefined', () => {
    const ctx = createMockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should deny access when isAdmin is missing (legacy user)', () => {
    const ctx = createMockContext({
      _id: new ObjectId(),
      email: 'legacy@example.com',
      totalTokensUsed: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
    });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should include descriptive error message', () => {
    const ctx = createMockContext({
      _id: new ObjectId(),
      email: 'user@example.com',
      isAdmin: false,
      totalTokensUsed: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
    });

    expect(() => guard.canActivate(ctx)).toThrow('Admin access required');
  });
});
