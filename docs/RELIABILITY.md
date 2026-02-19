# Reliability

## Error Handling Patterns

### Backend

**Global AllExceptionsFilter** catches every unhandled exception and returns a structured JSON response:

```json
{
  "statusCode": 500,
  "timestamp": "2026-02-19T12:00:00.000Z",
  "path": "/api/conversations",
  "method": "GET",
  "correlationId": "abc-123-def",
  "message": "Internal server error"
}
```

- 5xx errors logged at `error` severity
- 4xx errors logged at `warn` severity
- Stack traces included in logs but never exposed in responses

**Correlation ID Middleware** generates or propagates `X-Correlation-ID` on every request. The ID is injected into all log entries for that request, enabling end-to-end tracing.

### Frontend

- **React ErrorBoundary** wraps the entire application with a fallback UI that displays a user-friendly error message and a retry action
- **Hook-level error state** in `useConversations`, `useMessages`, and `useModels` -- each hook tracks loading, error, and data states independently
- **Snackbar/Alert** components surface error messages to the user without breaking the UI
- **SSE streaming** uses `AbortController` with a 5-minute timeout; cleanup runs in `finally` blocks regardless of success or failure

---

## Health Checks

**Endpoint:** `GET /api/health`

Implemented with NestJS Terminus. Returns aggregate health status including database connectivity.

```json
{
  "status": "ok",
  "info": {
    "mongodb": {
      "status": "up"
    }
  }
}
```

- Returns HTTP 200 when all indicators are healthy
- Returns HTTP 503 when any indicator is degraded
- Suitable for Kubernetes liveness/readiness probes and load balancer health checks

---

## Logging

**Library:** Pino via `nestjs-pino`

| Environment | Format | Default Level |
|-------------|--------|---------------|
| Production  | JSON   | `info`        |
| Development | Pretty-print | `debug` |

- Log level configurable via `LOG_LEVEL` environment variable
- Available levels: `fatal`, `error`, `warn`, `info`, `debug`, `trace`
- Correlation ID automatically injected into every log entry within a request context
- Structured fields: `timestamp`, `level`, `correlationId`, `context` (NestJS class name), `message`

---

## Resilience Patterns

### SSE Streaming
- 5-minute maximum stream duration enforced server-side
- Client disconnect detected via response close event; LLM call aborted immediately
- Frontend uses `AbortController` to cancel in-flight streams on component unmount or user action

### Upload Cleanup
- Hourly cron job removes uploaded files older than the configured TTL
- Prevents disk exhaustion from abandoned or orphaned uploads

### Graceful Shutdown
- MongoDB client disconnects cleanly on NestJS module destroy (`onModuleDestroy`)
- In-flight requests are allowed to complete before process exit

### Fail-Fast Configuration
- Joi schema validates all required environment variables at application startup
- App refuses to start if critical config (API keys, database URI) is missing or malformed

---

## Monitoring (TODO)

Planned observability improvements:

1. **Application metrics** -- Prometheus endpoint exposing request rates, latencies, error counts, and SSE stream durations
2. **Error tracking** -- Sentry integration for capturing and alerting on unhandled exceptions in both backend and frontend
3. **APM / Request tracing** -- Distributed tracing (OpenTelemetry) to correlate requests across services and identify latency bottlenecks
