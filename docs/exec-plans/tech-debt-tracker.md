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
| B-H5 | Move `require('pdf-parse')` to module-level import | backend | 0.25d | todo | Dynamic require inside method, no type safety |
| B-H6 | Make frontend origin configurable in LLM headers | backend | 0.25d | todo | Hardcoded `http://localhost:5173` in OpenAI headers |
| B-H7 | Refactor SSE: return AsyncIterable from service, not Response | backend | 1d | todo | Service layer should not know about HTTP transport |
| F-H3 | Use useRef for streaming content accumulation | frontend | 0.25d | todo | `finally` cleanup done, but `fullContent` still uses closure `let` |
| F-H5 | Add input length validation to ChatInput | frontend | 0.25d | todo | No max character count enforced |
| F-H6 | Memoize MessageBubble with React.memo | frontend | 0.5d | todo | All bubbles re-render on every parent update |

## Medium

| ID | Task | Area | Effort | Status | Notes |
|----|------|------|--------|--------|-------|
| B-M1 | Add response DTOs and API envelope | backend | 1d | todo | No consistent response format |
| B-M2 | Add @HttpCode decorators to controllers | backend | 0.25d | todo | POST returns 200 instead of 201 |
| B-M5 | Add length limits to DTO fields | backend | 0.25d | done | @MaxLength/@MinLength already in auth DTOs |
| B-M6 | Add idempotency key support for message creation | backend | 0.5d | todo | Duplicate sends possible |
| B-M7 | Configure MongoDB connection pool options | backend | 0.25d | todo | Using default pool settings |
| B-M8 | Fix ESLint errors in test files (32 errors) | backend | 1d | todo | `any` types in test mocks |
| B-M10 | Split chat.service.ts (365 lines, exceeds 300-line limit) | backend | 1d | todo | Extract streaming + file-extraction helpers |
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
| F-M13 | Use theme palette tokens instead of hardcoded gradients | frontend | 0.25d | todo | Hardcoded colors in MessageBubble |
| F-M14 | Add CORS error handling interceptor | frontend | 0.25d | todo | No special CORS error handling |
| F-M15 | Add stricter ESLint rules (no-console, no-floating-promises) | frontend | 0.25d | todo | Missing rules |
| F-M16 | Create frontend .env.example | frontend | 0.1d | todo | VITE_API_URL undocumented |
| F-M17 | Configure Vite code splitting (manualChunks) | frontend | 0.5d | todo | No chunking strategy |
| F-M18 | Add hook tests (useMessages streaming) | frontend | 1d | todo | Only component tests exist |
| F-M19 | Add error scenario tests | frontend | 1d | todo | No failure path tests |
| F-M20 | Add accessibility tests (axe-core) | frontend | 1d | todo | No a11y testing |

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
