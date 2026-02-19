# Security

## Current Security Model

### Authentication
**No authentication is implemented yet.** All API endpoints are publicly accessible. This is the most critical security gap in the application.

### Rate Limiting
- **ThrottlerModule** applied globally via NestJS
- Default: 60 requests per minute per IP
- Streaming endpoints (`POST /conversations/:id/messages`): 10 requests per minute
- Upload endpoint (`POST /upload`): 20 requests per minute

### Input Validation
- All incoming DTOs validated with `class-validator` decorators
- Global `ValidationPipe` configured with `whitelist: true` (strips unknown properties) and `transform: true`
- MongoDB ObjectId parameters validated before database queries

### File Upload Security
- Multer middleware with MIME type whitelist (text, PDF, common document formats)
- Maximum 5 files per request
- 10MB size limit per file
- Hourly cron job cleans up files exceeding configurable TTL

### Path Traversal Protection
- Uploaded file paths are reconstructed server-side using `path.basename()`
- Bounds check ensures resolved paths stay within the uploads directory
- Original filenames from clients are never used directly in filesystem operations

### XSS Protection
- LLM markdown output rendered with `react-markdown`
- `rehype-sanitize` plugin strips dangerous HTML from rendered content
- No `dangerouslySetInnerHTML` usage in the frontend

### CORS
- Configurable origin via `CORS_ORIGIN` environment variable
- Defaults to frontend dev server origin in development

### API Key Management
- OpenRouter API key stored in `backend/.env` (gitignored)
- Joi schema validates presence of required env vars at startup -- app fails fast if missing

---

## Threat Model

| # | Threat | Severity | Status | Mitigation |
|---|--------|----------|--------|------------|
| 1 | Unauthorized API access (no auth) | **Critical** | Open | Planned: JWT authentication with NestJS Guards |
| 2 | LLM prompt injection | Medium | Open | Planned: input sanitization layer |
| 3 | File upload abuse | Mitigated | Closed | Size limits, MIME whitelist, TTL cleanup cron |
| 4 | SSE resource exhaustion | Mitigated | Closed | 5-min stream timeout, client disconnect detection |
| 5 | MongoDB injection | Low | Closed | Native driver with parameterized queries, ObjectId validation |
| 6 | XSS via LLM output | Mitigated | Closed | rehype-sanitize on all markdown rendering |
| 7 | API key exposure | Mitigated | Closed | .env gitignored, Joi startup validation |
| 8 | Path traversal via uploads | Mitigated | Closed | basename-only reconstruction, bounds checking |

---

## Security Checklist (Code Reviews)

- [ ] No hardcoded secrets or API keys in source files
- [ ] All request input validated via class-validator DTOs
- [ ] File paths reconstructed server-side (never trust client-provided paths)
- [ ] User-facing content sanitized before rendering
- [ ] Rate limits appropriate for the endpoint type
- [ ] Error responses do not leak stack traces or internal details
- [ ] Correlation IDs present in logs for tracing
- [ ] New dependencies audited for known vulnerabilities

---

## Auth Requirements (TODO)

These are the planned authentication and authorization features:

1. **JWT-based authentication** -- access tokens issued on login, validated via NestJS Guards on all protected routes
2. **User-scoped conversations** -- each conversation belongs to a user; queries filtered by `userId`
3. **Refresh token rotation** -- short-lived access tokens (15 min), long-lived refresh tokens with single-use rotation
4. **Role-based access control** -- at minimum `user` and `admin` roles, enforced via custom decorators/guards
