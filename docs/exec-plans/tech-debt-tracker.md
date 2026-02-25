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
| B-M8 | Fix ESLint errors in test files (32 errors) | backend | 1d | wont-fix | Lint passes clean. `any` allowed in tests per CONVENTIONS.md. |
| B-M10 | Split chat.service.ts (390 lines, exceeds 300-line limit) | backend | 1d | done | PR #30 merged. Extracted FileExtractionService (297+102 lines). |
| B-M9 | Add coverage tool, target 80%+ | backend | 0.5d | done | @vitest/coverage-v8 configured, thresholds: 60%/50% |
| F-M1 | Add list virtualization (react-window) | frontend | 1d | done | PR #31 merged. react-virtuoso (better for variable-height chat). |
| F-M2 | Throttle scroll-to-bottom during streaming | frontend | 0.25d | done | PR #32 merged. 150ms ref-based throttle. |
| F-M3 | Replace 9-prop drill with React Context | frontend | 1d | done | PR #33 merged. ChatAppContext replaces 13 pass-through props on Layout. |
| F-M4 | Add cache invalidation / SWR pattern | frontend | 0.5d | done | PR #34 merged. Focus revalidation + dedup + stale data preservation. |
| F-M5 | Add offline/connectivity detection | frontend | 0.5d | done | PR #35 merged. useOnlineStatus hook, offline Snackbar, ChatInput disabled. |
| F-M6 | Add ARIA labels to IconButtons | frontend | 0.25d | done | PR #36 merged. aria-label on all 5 IconButtons + sidebar.openMenu i18n key. |
| F-M7 | Use semantic HTML in message list | frontend | 0.25d | done | PR #37 merged. `<main>`, `<article>`, `<nav>` via MUI component prop. |
| F-M8 | Add focus management after message send | frontend | 0.25d | done | PR #39 merged. inputRef + useEffect auto-focus on send and streaming end. |
| F-M9 | Lazy-load react-markdown + react-syntax-highlighter | frontend | 0.5d | done | PR #40 merged. React.lazy + Suspense, separate 796KB chunk. |
| F-M10 | Prevent full page re-render on model change | frontend | 0.5d | done | PR #42. Split ModelContext from ChatAppContext. |
| F-M11 | Strengthen TypeScript interfaces (branded types) | frontend | 0.5d | done | PR #45. Brand<T,B> utility + ConversationId/MessageId/ModelId across 16 files. |
| F-M12 | Add type guards for caught errors | frontend | 0.25d | done | PR #44 merged. `hasResponseStatus` + `isAbortError` type guards. |
| F-M13 | Use theme palette tokens instead of hardcoded gradients | frontend | 0.25d | done | PR #42. All rgba/gradients migrated to theme tokens. |
| F-M14 | Add CORS error handling interceptor | frontend | 0.25d | done | PR #46 merged. isCorsLikeError type guard + i18n errors.corsOrNetwork in all hooks. |
| F-M15 | Add stricter ESLint rules (no-floating-promises) | frontend | 0.25d | done | PR #49 merged. projectService + no-floating-promises rule, 6 violations fixed with void operator. |
| F-M16 | Create frontend .env.example | frontend | 0.1d | done | PR #52 merged. VITE_API_URL documented. |
| F-M17 | Configure Vite code splitting (manualChunks) | frontend | 0.5d | done | PR #42. vendor-mui + vendor-i18n chunks, index 671→312KB. |
| F-M18 | Add hook tests (useMessages streaming) | frontend | 1d | done | PR #53 merged. 17 tests: fetch, send, streaming, stop, clear. |
| F-M19 | Add error scenario tests | frontend | 1d | done | PR #55 merged. 42 tests across 4 hooks: useConversations, useModels, useAuth, useMessages. |
| F-M20 | Add accessibility tests (axe-core) | frontend | 1d | done | PR #56 merged. vitest-axe, 15 tests, 3 violations fixed. |
| F-M21 | Replace window.alert() with Snackbar in FileAttachment | frontend | 0.25d | done | PR #57 merged. onError callback + Snackbar in ChatInput. |
| F-M22 | Add aria-live to TypingIndicator | frontend | 0.1d | done | PR #59 merged. role="status" + aria-live="polite" + visually hidden i18n label. |
| F-M23 | Localize "Error:" prefix in useMessages error display | frontend | 0.1d | done | Fixed in retrospective #2: uses t('errors.streamErrorPrefix') |
| B-M11 | Update /develop-feature skill to use git worktree isolation for parallel execution | infra | 0.25d | done | PR #69 merged. Phase 1.5 uses EnterWorktree for isolated execution. |

## Low

| ID | Task | Area | Effort | Status | Notes |
|----|------|------|--------|--------|-------|
| B-L1 | Use PartialType for duplicate DTOs | backend | 0.1d | done | PR #60 merged. PartialType for conversation DTOs, BaseAuthDto for auth DTOs. |
| B-L2 | Replace synchronous mkdirSync with async | backend | 0.1d | done | PR #61 merged. async mkdir from fs/promises. |
| B-L3 | Load model list from config or OpenRouter API | backend | 0.5d | done | PR #62 merged. Dynamic fetch from OpenRouter, hourly refresh, fallback defaults. |
| B-L4 | Add uploads/ to .gitignore | backend | 0.1d | done | Already present in root .gitignore as `/uploads` |
| B-L5 | Enable strict: true in backend tsconfig | backend | 0.5d | done | PR #68 merged. Replaces individual flags with `strict: true`. |
| B-L6 | Standardize SSE error format | backend | 0.25d | done | PR #67 merged. Typed SSE_ERROR_CODE + i18n fallback. |
| B-L7 | Document CORS configuration | backend | 0.1d | done | Documented in ARCHITECTURE.md env vars table and SECURITY.md |
| B-L8 | Refactor extractFileContent (61 lines, exceeds 50-line limit) | backend | 0.25d | done | PR #70 merged. Extracted resolveUploadPath, isTextFile, isPdfFile, readPdfContent. |
| B-L9 | Create backend getErrorMessage utility for `instanceof Error` pattern | backend | 0.5d | done | PR #71 merged. getErrorMessage + getErrorStack in common/utils/, ESLint enforcement rule. |
| F-L1 | Extract magic numbers to constants/theme | frontend | 0.25d | done | PR #74 merged. 50+ constants in frontend/src/constants.ts across 11 components. |
| F-L2 | Split large component files (180+ lines) | frontend | 0.5d | done | PR #75 merged. ChatApp, stream.ts, ChatInputToolbar extracted. |
| F-L3 | Standardize error logging with utility | frontend | 0.25d | done | console.error removed in sweep |
| F-L4 | Add return type annotations to hooks | frontend | 0.25d | done | PR #76 merged. UseAuthReturn, UseConversationsReturn, UseMessagesReturn, UseModelsReturn interfaces. |
| F-L5 | Optimize tablet layout (md-lg breakpoints) | frontend | 0.5d | done | PR #78 merged. Sidebar 240px@md/280px@lg, padding xs=16/md=24/lg=32, bubble 85%/75%. |
| F-L6 | Configure and document production source maps | frontend | 0.25d | done | PR #77 merged. Hidden source maps + deployment security note. |

## Features (New)

| ID | Task | Area | Effort | Status | Notes |
|----|------|------|--------|--------|-------|
| FEAT-1 | User Authentication & Multi-Tenancy | fullstack | 5d | done | JWT auth + userId-scoped data via B-C1 |
| FEAT-2 | Conversation Search (Cmd+K) | fullstack | 2d | done | PR #80 merged. SearchService + SearchDialog + Cmd+K shortcut. |
| FEAT-3 | Message Editing & Regeneration | fullstack | 3d | done | PR #81 merged. Edit/regenerate endpoints, LlmStreamService extraction, frontend inline edit UI. |
| FEAT-4 | Conversation Export (Markdown/PDF/JSON) | fullstack | 2d | done | PR #83 merged. ExportService (MD/JSON/PDF), ExportMenu component, rate-limited. |
| FEAT-5 | System Prompt Templates: template library with 8-10 defaults, admin CRUD, conversation selector. Future: per-user custom templates. | fullstack | 3d | todo | Replaces basic system prompt. Admin role required for global template management. |
| FEAT-5a | Backend templates module: collection, CRUD endpoints, seed 8-10 default templates | backend | 1d | todo | Templates collection with name, content, category, isDefault fields. |
| FEAT-5b | Admin role system: isAdmin flag on user doc, AdminGuard for protected routes | backend | 0.5d | todo | Minimal RBAC — single admin boolean, not full role system. |
| FEAT-5c | Frontend template selector in conversation + active template indicator | frontend | 1d | todo | Dropdown/dialog to pick template when creating/editing conversation. Show active template chip. |
| FEAT-5d | Frontend admin panel for template CRUD management | frontend | 0.5d | todo | Admin-only page: list, create, edit, delete global templates. |
| FEAT-6 | Token Usage & Cost Tracking | fullstack | 2d | done | PR #28 merged. stream_options usage extraction, per-message + cumulative tracking. |
| FEAT-7 | Streaming Response Controls (stop/copy/retry) | frontend | 1d | done | PR #82 merged. Stop button during streaming, copy-to-clipboard on all messages, 4 new tests. |
| FEAT-8 | Dark/Light Theme Toggle | frontend | 1d | done | PR #79 merged. useThemeMode hook, ThemeModeProvider, ThemeToggle component, light/dark/system modes. |
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
| FEAT-6 | Token Usage & Cost Tracking (PR #28) | 2026-02-21 |
| F-M23 | Localize "Error:" prefix in useMessages (retrospective #2) | 2026-02-21 |
| B-M10 | Split chat.service.ts — extract FileExtractionService (PR #30) | 2026-02-21 |
| F-M1 | Add list virtualization with react-virtuoso (PR #31) | 2026-02-23 |
| F-M2 | Throttle scroll-to-bottom during streaming (PR #32) | 2026-02-23 |
| F-M3 | Replace prop drilling with ChatAppContext (PR #33) | 2026-02-23 |
| F-M4 | Add SWR focus revalidation (PR #34) | 2026-02-23 |
| F-M5 | Add offline/connectivity detection (PR #35) | 2026-02-23 |
| F-M6 | Add ARIA labels to IconButtons (PR #36) | 2026-02-23 |
| F-M7 | Use semantic HTML in message list (PR #37) | 2026-02-23 |
| F-M8 | Add focus management after message send (PR #39) | 2026-02-23 |
| F-M9 | Lazy-load react-markdown + react-syntax-highlighter (PR #40) | 2026-02-23 |
| F-M10 | Prevent full page re-render on model change (PR #42) | 2026-02-23 |
| F-M13 | Migrate rgba/gradient colors to theme tokens (PR #42) | 2026-02-23 |
| F-M17 | Configure Vite manual chunks for bundle optimization (PR #42) | 2026-02-23 |
| F-M11 | Strengthen TypeScript interfaces with branded types (PR #45) | 2026-02-23 |
| F-M12 | Add type guards for caught errors (PR #44) | 2026-02-23 |
| F-M14 | Add CORS error handling interceptor (PR #46) | 2026-02-24 |
| F-M15 | Add no-floating-promises ESLint rule (PR #49) | 2026-02-24 |
| F-M16 | Create frontend .env.example (PR #52) | 2026-02-24 |
| F-M18 | Add useMessages hook tests (PR #53) | 2026-02-24 |
| F-M19 | Add error scenario tests (PR #55) | 2026-02-24 |
| F-M20 | Add accessibility tests with axe-core (PR #56) | 2026-02-24 |
| F-M21 | Replace window.alert() with Snackbar in FileAttachment (PR #57) | 2026-02-24 |
| F-M22 | Add aria-live to TypingIndicator (PR #59) | 2026-02-24 |
| B-L4 | Add uploads/ to .gitignore (already present, discovered in audit #9) | 2026-02-24 |
| B-L7 | Document CORS configuration (in ARCHITECTURE.md + SECURITY.md) | 2026-02-24 |
| B-L1 | Use PartialType for duplicate DTOs (PR #60) | 2026-02-24 |
| B-L2 | Replace synchronous mkdirSync with async (PR #61) | 2026-02-24 |
| B-L3 | Load model list dynamically from OpenRouter (PR #62) | 2026-02-24 |
| B-L6 | Standardize SSE error format with typed codes (PR #67) | 2026-02-24 |
| B-L5 | Enable strict: true in backend tsconfig (PR #68) | 2026-02-24 |
| B-L8 | Refactor extractFileContent — extract 4 helpers (PR #70) | 2026-02-24 |
| B-L9 | Backend getErrorMessage/getErrorStack utility (PR #71) | 2026-02-24 |
| F-L1 | Extract frontend magic numbers to constants (PR #74) | 2026-02-24 |
| F-L2 | Split large frontend files into focused modules (PR #75) | 2026-02-24 |
| F-L4 | Add return type annotations to hooks (PR #76) | 2026-02-24 |
| F-L5 | Optimize tablet layout with responsive breakpoints (PR #78) | 2026-02-24 |
| F-L6 | Configure and document production source maps (PR #77) | 2026-02-24 |
| FEAT-8 | Dark/Light Theme Toggle (PR #79) | 2026-02-25 |
| FEAT-7 | Streaming Response Controls — stop/copy (PR #82) | 2026-02-25 |
| FEAT-4 | Conversation Export — Markdown/PDF/JSON (PR #83) | 2026-02-25 |
