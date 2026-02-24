import 'vitest';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- extends vitest-axe matcher
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T;
  }
}
