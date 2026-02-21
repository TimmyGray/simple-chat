# Tech Debt Tracker

> Machine-readable task backlog for autonomous development.
> Source: Migrated from `docs/IMPROVEMENT_PLAN.md` on 2026-02-19.

## Format

Each task has:
- **ID**: Unique identifier (B=backend, F=frontend, FEAT=feature)
- **Priority**: critical, high, medium, low
- **Status**: `todo`, `in-progress`, `done`, `wont-fix`
- **Effort**: estimated days
- **Area**: backend, frontend, fullstack, infra

---

## Critical

| ID | Task | Area | Effort | Status | Notes |
|----|------|------|--------|--------|-------|
| B-C1 | Add JWT authentication (NestJS Guards + frontend auth flow) | fullstack | 3-4d | done | All 3 phases complete. |
| B-C1a | Backend auth module: register, login, JWT, guard, users collection | backend | 1d | done | Phase 1. PR: feat/backend-auth-module |
| B-C1b | Apply JWT guards to existing endpoints + userId scoping | backend | 1d | done | Phase 2. PR #6 merged. |
| B-C1c | Frontend auth flow: login/register UI, token management, i18n | frontend | 1-2d | done | Phase 3. PR #7 merged. |

## High

| ID | Task | Area | Effort | Status | Notes |
|----|------|------|--------|--------|-------|
| B-H4 | Add MongoDB JSON schema validation on collections | backend | 1d | done | PR #11 merged. Validators on all 3 collections. |
| B-H5 | Move `require('pdf-parse')` to module-level import | backend | 0.25d | done | PR #14. Module-level import, v2 class API. |
| B-H6 | Make frontend origin configurable in LLM headers | backend | 0.25d | done | PR #16 merged. Uses CORS_ORIGIN via ConfigService. |
| B-H7 | Refactor SSE: return AsyncIterable from service, not Response | backend | 1d | done | PR #17 merged. Service returns AsyncGenerator<StreamEvent>, controller owns SSE transport. |
| F-H3 | Use useRef for streaming content accumulation | frontend | 0.25d | done | PR #18 merged. `fullContentRef` replaces closure `let`. |
| F-H5 | Add input length validation to ChatInput | frontend | 0.25d | done | PR #20 merged. 10K char limit, counter at 90%, backend @MaxLength. |
| F-H6 | Memoize MessageBubble with React.memo | frontend | 0.5d | done | PR #21 merged. React.memo + module-scope constants. |

## Medium

| ID | Task | Area | Effort | Status | Notes |
|----|------|------|--------|--------|-------|
| B-M1 | Add response DTOs and API envelope | backend | 1d | done | PR #23 merged. TransformResponseInterceptor wraps in { data: T }. |
| B-M2 | Add @HttpCode decorators to controllers | backend | 0.25d | done | PR #25 merged. Explicit 201 on POST, 204 on DELETE. |
| B-M5 | Add length limits to DTO fields | backend | 0.25d | done | @MaxLength/@MinLength already in auth DTOs |
| B-M6 | Add idempotency key support for message creation | backend | 0.5d | done | PR #26 merged. Sparse unique index + Idempotency-Key header. |
| B-M7 | Configure MongoDB connection pool options | backend | 0.25d | done | PR #27 merged. minPoolSize=2, maxPoolSize=10 defaults. |
| B-M8 | Fix ESLint errors in test files (32 errors) | backend | 1d | todo | `any` types in test mocks (lint passes clean — may be warnings only) |
| B-M10 | Split chat.service.ts (354 lines, exceeds 300-line limit) | backend | 1d | todo | Extract streaming + file-extraction helpers |
| B-M9 | Add coverage tool, target 80%+ | backend | 0.5d | done | @vitest/coverage-v8 configured, thresholds: 60%/50% |
| F-M1 | Add list virtualization (react-window) | frontend | 1d | todo | Long conversations cause jank |
| F-M2 | Throttle scroll-to-bottom during streaming | frontend | 0.25d | todo | Scroll fires on every chunk |
| F-M3 | Replace 9-prop drill with React Context | frontend | 1d | todo | Layout has too many props |
| F-M4 | Add cache invalidation / SWR pattern | frontend | 0.5d | todo | No background refresh |
| F-M5 | Add offline/connectivity detection | frontend | 0.5d | todo | No navigator.onLine checks |
| F-M6 | Add ARIA labels to IconButtons | frontend | 0.25d | todo | Missing accessibility labels |
| F-M7 | Use semantic HTML in message list | frontend | 0.25d | todo | Should use main, article |
| F-M8 | Add focus management after message send | frontend | 0.25d | todo | Input not refocused |
| F-M9 | Lazy-load react-markdown + react-syntax-highlighter | frontend | 0.5d | todo | Heavy libs loaded eagerly |
| F-M10 | Prevent full page re-render on model change | frontend | 0.5d | todo | Memoize or use Context |
| F-M11 | Strengthen TypeScript interfaces (branded types) | frontend | 0.5d | todo | Weak type definitions |
| F-M12 | Add type guards for caught errors | frontend | 0.25d | todo | Implicit `unknown` error handling |
| F-M13 | Use theme palette tokens instead of hardcoded gradients | frontend | 0.25d | todo | Hex colors fixed (retro #1), rgba/gradients remain |
| F-M14 | Add CORS error handling interceptor | frontend | 0.25d | todo | No special CORS error handling |
| F-M15 | Add stricter ESLint rules (no-floating-promises) | frontend | 0.25d | todo | no-console promoted in retro #1; no-floating-promises needs type-checked config |
| F-M16 | Create frontend .env.example | frontend | 0.1d | todo | VITE_API_URL undocumented |
| F-M17 | Configure Vite code splitting (manualChunks) | frontend | 0.5d | todo | No chunking strategy |
| F-M18 | Add hook tests (useMessages streaming) | frontend | 1d | todo | Only component tests exist |
| F-M19 | Add error scenario tests | frontend | 1d | todo | No failure path tests |
| F-M20 | Add accessibility tests (axe-core) | frontend | 1d | todo | No a11y testing |
| F-M21 | Replace window.alert() with Snackbar in FileAttachment | frontend | 0.25d | todo | UX anti-pattern, 2 occurrences (lines 41, 68) |
| F-M22 | Add aria-live to TypingIndicator | frontend | 0.1d | todo | Missing role="status" aria-live="polite" |
| F-M23 | Localize "Error:" prefix in useMessages error display | frontend | 0.1d | todo | Hardcoded English prefix (line 90) |

## Low

| ID | Task | Area | Effort | Status | Notes |
|----|------|------|--------|--------|-------|
| B-L1 | Use PartialType for duplicate DTOs | backend | 0.1d | todo | Create/Update DTOs duplicated |
| B-L2 | Replace synchronous mkdirSync with async | backend | 0.1d | todo | Sync call at startup |
| B-L3 | Load model list from config or OpenRouter API | backend | 0.5d | todo | Hardcoded model list |
| B-L4 | Add uploads/ to .gitignore | backend | 0.1d | todo | Missing gitignore entry |
| B-L5 | Enable strict: true in backend tsconfig | backend | 0.5d | todo | Some strict flags missing |
| B-L6 | Standardize SSE error format | backend | 0.25d | todo | Inconsistent error envelope |
| B-L7 | Document CORS configuration | backend | 0.1d | todo | Allowed origins undocumented |
| F-L1 | Extract magic numbers to constants/theme | frontend | 0.25d | todo | Hardcoded values in styles |
| F-L2 | Split large component files (180+ lines) | frontend | 0.5d | todo | Some files too large |
| F-L3 | Standardize error logging with utility | frontend | 0.25d | done | console.error removed in sweep |
| F-L4 | Add return type annotations to hooks | frontend | 0.25d | todo | Missing explicit types |
| F-L5 | Optimize tablet layout (md-lg breakpoints) | frontend | 0.5d | todo | Not tested on tablets |
| F-L6 | Configure and document production source maps | frontend | 0.25d | todo | No source map config |

## Features (New)

| ID | Task | Area | Effort | Status | Notes |
|----|------|------|--------|--------|-------|
| FEAT-1 | User Authentication & Multi-Tenancy | fullstack | 5d | done | JWT auth + userId-scoped data via B-C1 |
| FEAT-2 | Conversation Search (Cmd+K) | fullstack | 2d | todo | MongoDB text index + search UI |
| FEAT-3 | Message Editing & Regeneration | fullstack | 3d | todo | Edit sent messages, regenerate responses |
| FEAT-4 | Conversation Export (Markdown/PDF/JSON) | fullstack | 2d | todo | Data portability |
| FEAT-5 | System Prompts / Custom Instructions | fullstack | 1d | todo | Per-conversation system prompt |
| FEAT-6 | Token Usage & Cost Tracking | fullstack | 2d | todo | Parse OpenRouter response headers |
| FEAT-7 | Streaming Response Controls (stop/copy/retry) | frontend | 1d | todo | AbortController for stop exists |
| FEAT-8 | Dark/Light Theme Toggle | frontend | 1d | todo | System preference detection |
| FEAT-9 | Keyboard Shortcuts | frontend | 1d | todo | Cmd+N, Cmd+K, Escape, etc. |
| FEAT-10 | Real-Time Collaboration | fullstack | 5d | todo | WebSocket, shared conversations |

## Completed

| ID | Task | Completed |
|----|------|-----------|
| B-C2 | Rate limiting (ThrottlerModule) | 2026-02-16 |
| B-C3 | ObjectId validation (ParseObjectIdPipe) | 2026-02-16 |
| B-C4 | API key secured (.env gitignored) | 2026-02-16 |
| B-C5 | Config validation (Joi schema) | 2026-02-16 |
| B-H1 | File path traversal protection | 2026-02-16 |
| B-H2 | SSE timeout + disconnect detection | 2026-02-16 |
| B-H3 | Upload cleanup cron job | 2026-02-16 |
| B-H8 | Global exception filter | 2026-02-16 |
| B-M3 | Structured logging (Pino) | 2026-02-16 |
| B-M4 | Health check endpoint | 2026-02-16 |
| F-C1 | SSE streaming with AbortController | 2026-02-16 |
| F-C2 | Markdown sanitization (rehype-sanitize) | 2026-02-16 |
| F-C3 | Client-side file validation | 2026-02-16 |
| F-C4 | React key fixes (mostly) | 2026-02-16 |
| F-H1 | React Error Boundary | 2026-02-16 |
| F-H2 | API error states in hooks | 2026-02-16 |
| F-H4 | Temp message ID collision fix | 2026-02-16 |
| I18N | i18n support (4 languages) | 2026-02-18 |
| INFRA | CI/CD pipeline + pre-commit hooks | 2026-02-19 |
| B-C1c | Frontend auth flow (login/register UI, token management, i18n) | 2026-02-19 |
| B-C1 | JWT authentication (all phases complete) | 2026-02-19 |
| B-M5 | Add length limits to DTO fields (@MaxLength/@MinLength) | 2026-02-19 |
| B-M9 | Add coverage tool (@vitest/coverage-v8) | 2026-02-19 |
| FEAT-1 | User Authentication & Multi-Tenancy | 2026-02-19 |
| F-L3 | Remove frontend console.error (sweep) | 2026-02-19 |
| B-H4 | MongoDB JSON schema validation on collections (PR #11) | 2026-02-19 |
| B-H6 | Make frontend origin configurable in LLM headers (PR #16) | 2026-02-21 |
| B-H7 | Refactor SSE: return AsyncIterable from service (PR #17) | 2026-02-21 |
| F-H3 | Use useRef for streaming content accumulation (PR #18) | 2026-02-21 |
| F-H5 | Add input length validation to ChatInput (PR #20) | 2026-02-21 |
| F-H6 | Memoize MessageBubble with React.memo (PR #21) | 2026-02-21 |
| B-M1 | Add response DTOs and API envelope (PR #23) | 2026-02-21 |
| B-M2 | Add @HttpCode decorators to controllers (PR #25) | 2026-02-21 |
| B-M6 | Add idempotency key support for message creation (PR #26) | 2026-02-21 |
| B-M7 | Configure MongoDB connection pool options (PR #27) | 2026-02-21 |
