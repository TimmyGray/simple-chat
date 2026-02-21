/**
 * Standard API success envelope. All non-SSE, non-@SkipTransform() responses
 * are wrapped in this shape by TransformResponseInterceptor.
 *
 * Error responses bypass this wrapper and use the AllExceptionsFilter format:
 * { statusCode, timestamp, path, method, correlationId, message }
 */
export interface ApiResponse<T> {
  data: T;
}
