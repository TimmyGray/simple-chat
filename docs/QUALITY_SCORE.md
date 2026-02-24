# Quality Metrics Dashboard

> Last updated: 2026-02-24 (sweep #11)

## Test Summary

| Area | Test Files | Tests | Pass Rate |
|------|-----------|-------|-----------|
| Backend | 13 | 128 | 100% |
| Frontend | 16 | 151 | 100% |
| **Total** | **29** | **279** | **100%** |

## Lint Status

| Area | Errors | Warnings |
|------|--------|----------|
| Backend | 0 | 0 |
| Frontend | 0 | 0 |

## Type Check Status

| Area | Errors |
|------|--------|
| Backend | 0 |
| Frontend | 0 |

## Build Status

| Area | Status |
|------|--------|
| Backend | Passing |
| Frontend | Passing |

## Coverage
- Backend: Configured (@vitest/coverage-v8, threshold: 60%)
- Frontend: Configured (@vitest/coverage-v8, threshold: 50%)

## Dependencies

| Area | Total | Outdated | Vulnerabilities |
|------|-------|----------|----------------|
| Root | 3 | 0 | 0 |
| Backend | ~25 | 14 (7 patch, 4 minor, 3 major) | 35 (5 moderate, 30 high — all in jest/babel transitive deps) |
| Frontend | ~20 | 8 (3 patch, 2 minor, 3 major) | 11 (1 moderate, 10 high — all in eslint/minimatch transitive deps) |

## Bundle Size
- Backend: 880 KB (dist/)
- Frontend: 1.4 MB (dist/) — initial load 315 KB + 299 KB vendor-mui + 63 KB vendor-i18n + 796 KB lazy markdown chunk

## Tech Debt
- Critical: 0 todo, 4 done (JWT authentication completed)
- High: 0 todo, 7 done — all high-priority items completed
- Medium: 0 todo, 30 done, 1 wont-fix — all medium items done
- Low: 8 todo, 7 done (B-L6 completed since last sweep)
- Features: 12 todo, 2 done (FEAT-5 subtasks expanded)
- Total tracked: 71 (see `docs/exec-plans/tech-debt-tracker.md`)

## Sweep #11 Findings
- All validation passing: lint 0 errors, typecheck 0 errors, 279 tests passing, build passing
- Backend tests: 125 -> 128 (+3, 13 files unchanged)
- Frontend tests: 149 -> 151 (+2, 16 files unchanged)
- Total tests: 274 -> 279 (target: 100+ sustained, comfortably exceeded)
- Completed since last sweep: B-L6 (SSE error format standardization, PR #67)
- Low tech debt: 8 todo, 7 done (B-L6 moved to done)
- No auto-fixable code violations found (codebase is clean)
- No console.log/warn/error in source (clean)
- No dangerouslySetInnerHTML (clean)
- No hardcoded secrets (clean)
- No `any` types in non-test source files (clean)
- No hardcoded user-facing strings (all use t())
- No TODO/FIXME/HACK comments in source (clean)
- i18n: all 4 locales in sync (55 leaf keys each, up from 52 — 3 new SSE error keys from B-L6)
- All cross-module imports follow approved patterns (chat->auth for guards/decorators only)
- No services importing Express types (clean — Express types only in controller, middleware, exception filter per NestJS convention)
- No direct MongoDB collection access outside DatabaseService (clean)
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- All hex/rgba/gradient colors in theme.ts only (exempt per convention)
- No window.alert() in source (clean)
- Backend `instanceof Error` pattern: 11 occurrences across 8 files (unchanged from audit #10, tracked as B-L9, needs design)
- New finding: refreshModels at 52 lines, borderline 50-line limit overrun (models.service.ts, added with B-L3 — not worth separate task at 2 lines over)
- Frontend bundle: 315 KB index + 299 KB vendor-mui + 63 KB vendor-i18n + 796 KB lazy markdown (1.4 MB total, unchanged)
- Backend bundle: 880 KB (up from 876 KB)
- Existing tracked violations confirmed still present:
  - 2 backend functions exceed 50-line limit: extractFileContent at 61 lines (tracked as B-L8), refreshModels at 52 lines (borderline, not tracked separately)
  - Frontend components/hooks exceed 50-line limit: MessageBubble (161 lines), ChatInput (243 lines), App.tsx (200 lines), AuthPage (178 lines), Sidebar (163 lines) — React components, tracked as F-L2
  - B-L9 (backend getErrorMessage utility) still todo — 11 instanceof Error occurrences across 8 backend files

## Audit #10 Findings
- Backend tests: 112 -> 125 (+13 from models.service.spec.ts, added with B-L3 dynamic model list)
- Frontend tests: 149 (16 files, unchanged)
- Total tests: 274 (target: 100+ sustained, comfortably exceeded)
- B-L3 (dynamic model list from OpenRouter) completed since last audit (PR #62)
- All validation passing: lint 0 errors/0 warnings, typecheck 0 errors, build passing
- No new lint, type, or build errors
- No console.log/warn/error found in source (clean)
- No dangerouslySetInnerHTML usage (clean)
- No hardcoded secrets found in source files
- No `any` types in non-test source files (clean)
- No TODO/FIXME/HACK comments in source (clean)
- i18n: all 4 locales in sync (52 leaf keys each, unchanged)
- All cross-module imports follow approved patterns (chat->auth for guards/decorators only)
- No services importing Express types (clean)
- No direct MongoDB collection access outside DatabaseService (clean)
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- All hex/rgba/gradient colors in theme.ts only (exempt per convention)
- No window.alert() in source (clean)
- Backend `instanceof Error` pattern: 11 occurrences across 8 files (up from 10/7 — new one in models.service.ts, tracked as B-L9)
- Frontend bundle: 314 KB index + 299 KB vendor-mui + 63 KB vendor-i18n + 796 KB lazy markdown (1.4 MB total, unchanged)
- Backend bundle: 876 KB (up from 872 KB — models service addition)
- Dependencies: 0 vulnerabilities at root; backend 35, frontend 11 (all transitive, unchanged)
- Backend outdated: 14 (7 patch, 4 minor, 3 major). Frontend outdated: 8 (3 patch, 2 minor, 3 major)
- Existing tracked violations confirmed still present:
  - 1 backend function exceeds 50-line limit: extractFileContent at 61 lines (tracked as B-L8)
  - Frontend components/hooks exceed 50-line limit: MessageBubble (161 lines), ChatInput (243 lines), App.tsx (200 lines) — React components, tracked as F-L2
  - B-L9 (backend getErrorMessage utility) still todo — 11 instanceof Error occurrences across 8 backend files (grew by 1 from models.service.ts)

## Sweep #10 Findings
- All validation passing: lint 0 errors, typecheck 0 errors, 261 tests passing, build passing
- Backend tests: 112 (13 files, unchanged)
- Frontend tests: 149 (16 files, corrected from 148 — was already 149 at sweep #9, stale count)
- Total tests: 261 (target: 100+ sustained, comfortably exceeded)
- Completed since last sweep: F-M22 (aria-live on TypingIndicator, PR #59), B-L1 (PartialType DTOs, PR #60), B-L2 (async mkdirSync, PR #61)
- Medium tech debt: 0 todo — all medium-priority items now complete
- No auto-fixable code violations found (codebase is clean)
- No console.log/warn/error in source (clean)
- No dangerouslySetInnerHTML (clean)
- No hardcoded secrets (clean)
- No `any` types in non-test source files (clean)
- No hardcoded user-facing strings (all use t())
- No TODO/FIXME/HACK comments in source (clean)
- i18n: all 4 locales in sync (52 leaf keys each, up from 51 — recount with nested key expansion)
- All cross-module imports follow approved patterns (chat->auth for guards/decorators only)
- No services importing Express types (clean)
- No direct MongoDB collection access outside DatabaseService (clean)
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- All hex/rgba/gradient colors in theme.ts only (exempt per convention)
- No window.alert() in source (clean)
- Backend `instanceof Error` pattern: 10 occurrences across 7 files (unchanged, tracked as B-L9, needs design)
- Frontend bundle: 314 KB index + 299 KB vendor-mui + 63 KB vendor-i18n + 796 KB lazy markdown (1.4 MB total, unchanged)
- Backend bundle: 872 KB (corrected from 1.1 MB reported in sweep #9)
- Existing tracked violations confirmed still present:
  - 1 backend function exceeds 50-line limit: extractFileContent at 61 lines (tracked as B-L8)
  - Frontend components/hooks exceed 50-line limit: MessageBubble (146 lines), ChatApp (122 lines), ChatInput (223 lines) — React components, tracked as F-L2
  - B-L9 (backend getErrorMessage utility) still todo — 10 instanceof Error occurrences across 7 backend files

## Sweep #9 Findings
- All validation passing: lint 0 errors, typecheck 0 errors, 260 tests passing, build passing
- Backend tests: 112 (13 files, unchanged)
- Frontend tests: 148 (16 files, unchanged since retrospective #4)
- Total tests: 260 (target: 100+ sustained, comfortably exceeded)
- No auto-fixable code violations found (codebase is clean)
- No console.log/warn/error in source (clean)
- No dangerouslySetInnerHTML (clean)
- No hardcoded secrets (clean)
- No `any` types in non-test source files (clean)
- No hardcoded user-facing strings (all use t())
- No TODO/FIXME/HACK comments in source (clean)
- i18n: all 4 locales in sync (51 keys each, up from 49 — new file error keys from F-M21)
- All cross-module imports follow approved patterns (chat->auth for guards/decorators only)
- No services importing Express types (clean — Express types only in controller, middleware, exception filter per NestJS convention)
- No direct MongoDB collection access outside DatabaseService (clean)
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- All hex/rgba/gradient colors in theme.ts only (exempt per convention)
- No window.alert() in source (F-M21 completed in PR #57 — long-standing violation now resolved)
- Backend `instanceof Error` pattern: 10 occurrences across 7 files (unchanged from sweep #8, tracked as B-L9, needs design)
- Frontend bundle: 314 KB index + 299 KB vendor-mui + 63 KB vendor-i18n + 796 KB lazy markdown (1.4 MB total, unchanged)
- Backend bundle: 1.1 MB (dist/, unchanged)
- Existing tracked violations confirmed still present:
  - 1 backend function exceeds 50-line limit: extractFileContent at 61 lines (tracked as B-L8)
  - Frontend components/hooks exceed 50-line limit: MessageBubble (146 lines), ChatApp (122 lines) — React components, tracked as F-L2
  - F-M22 (aria-live on TypingIndicator) still todo — missing role="status" aria-live="polite"
  - B-L9 (backend getErrorMessage utility) still todo — 10 instanceof Error occurrences across 7 backend files

## Audit #9 Findings
- Backend tests: 112 (13 files, unchanged). Frontend tests: 148 (16 files, unchanged since retrospective #4).
- Total tests: 260 (target: 100+ sustained, comfortably exceeded)
- F-M21 (window.alert replacement with Snackbar) completed since last audit (PR #57)
- All validation passing: lint 0 errors/0 warnings, typecheck 0 errors, build passing
- No new lint, type, or build errors
- No console.log/warn/error found in source (clean)
- No dangerouslySetInnerHTML usage (clean)
- No hardcoded secrets found in source files
- No `any` types in non-test source files (clean)
- No TODO/FIXME/HACK comments in source (clean)
- i18n: all 4 locales in sync (51 keys each, up from 49 — new file error i18n keys from F-M21)
- All cross-module imports follow approved patterns (chat->auth for guards/decorators only)
- No services importing Express types (clean)
- No direct MongoDB collection access outside DatabaseService (clean)
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- All rgba/gradient usages reference theme tokens (theme.ts exempt per convention)
- Frontend bundle: 314 KB index + 299 KB vendor-mui + 63 KB vendor-i18n + 796 KB lazy markdown (1.4 MB total, unchanged)
- Backend bundle: 1.1 MB (dist/, up from 860 KB — growth from accumulated features)
- Dependencies: 0 vulnerabilities at root; backend 35, frontend 11 (all transitive, unchanged)
- Backend outdated: 14 (7 patch, 4 minor, 3 major). Frontend outdated: 8 (3 patch, 2 minor, 3 major)
- Backend `instanceof Error` pattern: 10 occurrences across 7 files (unchanged, tracked as B-L9)
- window.alert() in FileAttachment.tsx: RESOLVED (F-M21 completed, PR #57)
- Existing tracked violations confirmed still present:
  - 1 backend function exceeds 50-line limit: extractFileContent at 61 lines (tracked as B-L8)
  - Frontend components/hooks exceed 50-line limit (React components, tracked as F-L2) — component size is expected for React
  - Frontend bundle 1.4 MB total, split via manual chunks and lazy loading (tracked as F-M17, done)
  - F-M22 (aria-live on TypingIndicator) still todo

## Retrospective #4 Findings
- PRs analyzed: 10 (PRs #48-#57), date range: 2026-02-23 to 2026-02-24
- 7 features completed since last retrospective: F-M15, F-M16, F-M18, F-M19, F-M20, F-M21, Phase 9b workflow enhancement
- All PRs well-scoped: avg 5 files changed, max 12 (PR #55 error scenario tests, 4 new test files)
- Backend tests: 112 (13 files, stable)
- Frontend tests: 75 -> 148 (+73 tests, 10 -> 16 test files — massive test coverage improvement)
- Total tests: 187 -> 260 (39% increase, target 100+ comfortably exceeded)
- Frontend test coverage is now the strongest area — hooks have comprehensive happy-path + error scenario tests
- No review comments on any PR (no external reviewer activity)
- No Phase 9b per-feature learning entries in pitfalls.md (Phase 9b was just added, no triggers yet)
- Fixed: stale eslint-disable directive in vitest-axe.d.ts (unused `@typescript-eslint/no-empty-object-type` suppression)
- Fixed: quality score test counts were stale (92/11 -> 148/16 frontend, 204/24 -> 260/29 total)
- Fixed: medium tech debt count corrected (was 4/26, actually 1/29 — F-M19, F-M20, F-M21 completed)
- Pattern identified: Backend `instanceof Error` at 10 occurrences across 7 files (tracked as B-L9, above 3+ threshold but requires design — backend uses NestJS Logger with stack traces, different semantics from frontend getErrorMessage)
- Pattern identified: `tRef` (useRef for t()) in all 4 data hooks — stable pattern, not yet worth extracting
- Pattern identified: `err as { response }` unsafe casts consolidated into getErrorMessage.ts utility — no longer spread across hooks
- No new ESLint rules promoted this cycle (backend instanceof Error needs design work first, not a simple AST selector ban)
- Existing promoted rules (no-console, hex colors, no-restricted-imports, window.alert, instanceof Error ternary, no-floating-promises) all working — zero violations in source

## Sweep #8 Findings
- All validation passing: lint 0 errors, typecheck 0 errors, build passing
- Backend tests: 112 (13 files, unchanged)
- Frontend tests: 75 -> 92 (+17 from useMessages hook tests in PR #53, test file count 10 -> 11)
- Total tests: 187 -> 204 (target: 100+ sustained, comfortably exceeded)
- Fixed: test summary in quality score was stale (75/10 -> 92/11 frontend, 187/23 -> 204/24 total)
- Fixed: medium tech debt count corrected (was 6/24, actually 4/26 — F-M16 and F-M18 completed)
- No auto-fixable code violations found (codebase is clean)
- No console.log/warn/error in source (clean)
- No dangerouslySetInnerHTML (clean)
- No hardcoded secrets (clean)
- No `any` types in non-test source files (clean)
- No hardcoded user-facing strings (all use t())
- No TODO/FIXME/HACK comments in source (clean)
- i18n: all 4 locales in sync (49 keys each)
- All cross-module imports follow approved patterns (chat->auth for guards/decorators only)
- No services importing Express types (clean)
- No direct MongoDB collection access outside DatabaseService (clean)
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- All hex/rgba/gradient colors in theme.ts only (exempt per convention)
- Backend `instanceof Error` pattern: 10 occurrences across 7 files (up from 6 in sweep #7, above 3+ threshold). Backend uses NestJS Logger with different semantics than frontend — needs design for backend-specific `getErrorMessage` utility (added as B-L9).
- Frontend bundle: 314 KB index + 295 KB vendor-mui + 63 KB vendor-i18n + 796 KB lazy markdown (1.4 MB total, unchanged)
- Backend bundle: 860 KB (unchanged)
- Existing tracked violations confirmed still present:
  - window.alert() in FileAttachment.tsx (tracked as F-M21, caught by ESLint)
  - 1 backend function exceeds 50-line limit: extractFileContent at 61 lines (tracked as B-L8)
  - Frontend components/hooks exceed 50-line limit (React components, tracked as F-L2) — component size is expected for React
  - Frontend bundle 1.4 MB total, split via manual chunks and lazy loading (tracked as F-M17, done)

## Audit #8 Findings
- Backend tests: 112 (13 files, unchanged). Frontend tests: 50 -> 75 (+25 from getErrorMessage.test.ts expansion, new test file count 10)
- Total tests now 187 (target: 100+ sustained, comfortably exceeded)
- F-M11 (branded types), F-M12 (type guards), F-M14 (CORS error handling), F-M15 (no-floating-promises) completed since last audit
- New ModelContext.tsx added to frontend/src/contexts/ (split from ChatAppContext per F-M10)
- ARCHITECTURE.md drift found and fixed: ModelContext/ModelProvider not documented in component tree or state management
- Frontend bundle: 314 KB index + 295 KB vendor-mui + 63 KB vendor-i18n + 796 KB lazy markdown (1.4 MB total, unchanged)
- Backend bundle: 860 KB (unchanged)
- No new lint, type, or build errors
- No console.log/warn/error found in source (clean)
- No dangerouslySetInnerHTML usage (clean)
- No hardcoded secrets found in source files
- No `any` types in non-test source files (clean)
- No TODO/FIXME/HACK comments in source (clean)
- i18n: all 4 locales in sync (49 keys each, up from 48 — new CORS error key)
- All cross-module imports follow approved patterns
- No services importing Express types (clean)
- No direct MongoDB collection access outside DatabaseService (clean)
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- rgba/gradient occurrences reduced to 4 (all in theme.ts, which is exempt) — F-M13 migration complete
- Existing tracked violations confirmed still present:
  - window.alert() in FileAttachment.tsx (tracked as F-M21, caught by ESLint)
  - 1 backend function exceeds 50-line limit: extractFileContent at 61 lines (tracked as B-L8)
  - Frontend components/hooks exceed 50-line limit (React components, tracked as F-L2) — component size is expected for React
  - Frontend bundle 1.4 MB total, split via manual chunks and lazy loading (tracked as F-M17, done)

## Sweep #7 Findings
- All validation passing: lint 0 errors, typecheck 0 errors, build passing
- Backend tests: 112 (13 files, unchanged)
- Frontend tests: 50 (9 files, unchanged since audit #7)
- Total tests: 162 (target: 100+ sustained, comfortably exceeded)
- Fixed: merge conflict markers in QUALITY_SCORE.md Targets section (rebase artifact)
- Fixed: tech debt medium count corrected (was 13/17, actually 10/20 — F-M10, F-M13, F-M17 done in PR #42)
- Fixed: backend bundle size corrected (was 1.1 MB, actually 860 KB)
- Fixed: frontend bundle breakdown updated (312 KB index + 295 KB vendor-mui + 63 KB vendor-i18n + 796 KB lazy markdown)
- No auto-fixable code violations found (codebase is clean)
- No console.log/warn/error in source (clean)
- No dangerouslySetInnerHTML (clean)
- No hardcoded secrets (clean)
- No `any` types in non-test source files (clean)
- No hardcoded user-facing strings (all use t())
- i18n: all 4 locales in sync (48 keys each)
- All cross-module imports follow approved patterns
- No services importing Express types (clean)
- No direct MongoDB collection access outside DatabaseService (clean)
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- Backend has 6 `instanceof Error ? err.message` patterns — no backend getErrorMessage utility exists yet (below 3+ threshold for promotion; backend uses NestJS Logger context which differs from frontend pattern)
- Frontend useAuth.ts has 2 `instanceof Error && 'response' in err` patterns — different from message extraction pattern, used for status code inspection (tracked in retro #3, below threshold)
- New finding: backend extractFileContent (61 lines) exceeds 50-line function limit (added as B-L8)
- Existing tracked violations confirmed still present:
  - window.alert() in FileAttachment.tsx (tracked as F-M21, caught by ESLint)
  - 1 backend function exceeds 50-line limit: extractFileContent at 61 lines (new, tracked as B-L8)
  - 16 frontend functions/components exceed 50-line limit (React components/hooks, tracked as F-L2) — component size is expected for React
  - Frontend bundle 1.4 MB total, split via manual chunks and lazy loading (tracked as F-M17, now done)

## Audit #7 Findings
- Backend tests: 112, unchanged. Frontend tests: 48 -> 50 (+2 from ChatInput focus tests)
- Total tests now 162 (target: 100+ sustained, comfortably exceeded)
- F-M5 (offline detection), F-M6 (ARIA labels), F-M7 (semantic HTML), F-M8 (focus management), F-M9 (lazy markdown) completed since last audit
- Backend bundle grew from 860 KB to 1.1 MB (backend/dist)
- Frontend initial bundle reduced from 1.47 MB to 671 KB + 796 KB lazy chunk (F-M9)
- New `useOnlineStatus` hook added, was missing from ARCHITECTURE.md hooks table (fixed)
- `MarkdownRenderer` lazy-loaded component not documented in ARCHITECTURE.md (fixed)
- ARCHITECTURE.md drift fixed: added auth/ and types/ to backend file tree
- Medium tech debt count was incorrect in quality score (showed 11/19, actually 13/17) — corrected
- No new lint, type, or build errors
- No console.log/warn/error found in source (clean)
- No dangerouslySetInnerHTML usage (clean)
- No hardcoded secrets found in source files
- No `any` types in non-test source files (clean)
- i18n: all 4 locales in sync (48 keys each)
- All cross-module imports follow approved patterns
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- Existing tracked violations confirmed still present:
  - window.alert() in FileAttachment.tsx (tracked as F-M21, caught by ESLint)
  - Hardcoded rgba/gradient colors: 22 occurrences across 7 files (tracked as F-M13, unchanged)
  - 7 frontend functions exceed 50-line limit (tracked as F-L2, up from 5 — sendMessageStream and createTheme now counted)
  - Frontend bundle 1.4 MB total, split via lazy loading (tracked as F-M17)

## Retrospective #3 Findings
- PRs analyzed: 10 (PRs #30-#40), date range: 2026-02-21 to 2026-02-23
- 10 features completed since last retrospective: B-M10, F-M1 through F-M9
- All PRs well-scoped: avg 4 files changed, max 12 (PR #35 offline detection)
- Frontend tests: 48 -> 50 (2 new focus tests in ChatInput.test.tsx)
- Frontend initial bundle: 1.47 MB -> 671 KB (54% reduction via lazy-loaded markdown)
- New ESLint rule promoted:
  - `instanceof Error` ternary pattern banned via `no-restricted-syntax` AST selector
  - Canonical replacement: `getErrorMessage(err, fallback)` from `utils/getErrorMessage.ts`
  - Exemption added for the utility file itself (same pattern as theme.ts hex color exemption)
- Refactored 8 occurrences of `err instanceof Error ? err.message : fallback` to use `getErrorMessage()`
- New `utils/` directory added to frontend (getErrorMessage.ts)
- ARCHITECTURE.md drift fixed: added utils/ directory
- Convention rule #8 added: no inline instanceof Error checks
- Existing tracked violations confirmed still present:
  - window.alert() in FileAttachment.tsx (tracked as F-M21, caught by ESLint)
  - Hardcoded rgba/gradient colors: 15 rgba + 7 gradient = 22 occurrences (tracked as F-M13)
  - 5 frontend functions exceed 50-line limit (tracked as F-L2)
  - Frontend bundle still split between 671KB main + 796KB markdown chunk (tracked as F-M17)
  - Unsafe `err as { response?: { status?: number } }` in useAuth.ts (2 occurrences, below 3+ threshold)

## Sweep #6 Findings
- All validation passing: lint 0 errors, typecheck 0 errors, build passing
- Backend tests: 112 (13 files, unchanged)
- Frontend tests: 48 (9 files, unchanged since audit #6)
- Total tests: 160 (target: 100+ sustained, comfortably exceeded)
- No auto-fixable violations found (codebase is clean)
- No console.log/warn/error in source (clean)
- No dangerouslySetInnerHTML (clean)
- No hardcoded secrets (clean)
- No `any` types in non-test source files (clean)
- No hardcoded user-facing strings (all use t())
- i18n: all 4 locales in sync (46 keys each)
- All cross-module imports follow approved patterns
- No services importing Express types (clean)
- No direct MongoDB collection access outside DatabaseService (clean)
- No files exceed 300-line limit (chat.service.ts at 297, under limit)
- Fixed: Medium tech debt count corrected (was 17/13, actually 18/12)
- Fixed: Backend bundle size corrected (was 1.1 MB, actually 860 KB)
- Existing tracked violations confirmed still present:
  - window.alert() in FileAttachment.tsx (tracked as F-M21, caught by ESLint)
  - Hardcoded rgba/gradient colors: 20 occurrences across 6 files (tracked as F-M13, down from ~22)
  - 5 frontend functions exceed 50-line limit (tracked as F-L2, down from 7)
  - Frontend bundle 1.4 MB, still needs code splitting (tracked as F-M17)

## Audit #6 Findings
- Backend tests: 112, unchanged. Frontend tests: 42 -> 48 (+6 from useFocusRevalidation.test.ts)
- Total tests now 160 (target: 100+ sustained, comfortably exceeded)
- F-M2 (scroll throttle), F-M3 (ChatAppContext), F-M4 (SWR focus revalidation) completed since last audit
- New `contexts/` directory added to frontend (ChatAppContext.tsx)
- New `useFocusRevalidation` hook added, used by useConversations and useModels
- ARCHITECTURE.md drift fixed: added contexts/ dir, FileExtractionService, useFocusRevalidation hook
- No new lint, type, or build errors
- No console.log/warn/error found in source (clean)
- No dangerouslySetInnerHTML usage (clean)
- No hardcoded secrets found in source files
- No `any` types in non-test source files (clean)
- i18n: all 4 locales in sync (46 keys each)
- All cross-module imports follow approved patterns
- Existing tracked violations confirmed still present:
  - window.alert() in FileAttachment.tsx (tracked as F-M21, caught by ESLint)
  - Hardcoded rgba/gradient colors: ~22 occurrences across 7 files (tracked as F-M13)
  - 7 frontend functions exceed 50-line limit (tracked as F-L2)
  - Frontend bundle 1.4 MB, still needs code splitting (tracked as F-M17)

## Sweep #5 Findings
- All validation passing: lint 0 errors, typecheck 0 errors, build passing
- Backend tests: 100 -> 112 (+12 from file-extraction.service.spec, new test file)
- Frontend tests: 37 -> 42 (+5 from MessageList.test.tsx updates)
- Total tests: 137 -> 154 (target: 100+ sustained, comfortably exceeded)
- B-M10 completed: chat.service.ts split, now 297 lines (under 300-line limit)
- F-M1 completed: list virtualization with react-virtuoso (PR #31)
- No auto-fixable violations found this sweep (codebase is clean)
- No console.log/warn/error in source (clean)
- No dangerouslySetInnerHTML (clean)
- No hardcoded secrets (clean)
- No `any` types in non-test source files (clean)
- No hardcoded user-facing strings (all use t())
- i18n: all 4 locales in sync (46 keys each)
- All cross-module imports follow approved patterns
- Existing tracked violations confirmed still present:
  - window.alert() in FileAttachment.tsx (tracked as F-M21, caught by ESLint)
  - Hardcoded rgba/gradient colors: ~27 occurrences across 6 files (tracked as F-M13)
  - 7 frontend functions exceed 50-line limit (tracked as F-L2)
  - Frontend bundle 1.4 MB, still needs code splitting (tracked as F-M17)

## Audit #5 Findings
- Backend tests: 95 -> 100 (+5 from token usage/controller specs, PR #28)
- Total tests now 137 (target: 100+ sustained)
- FEAT-6 (Token Usage & Cost Tracking) completed since last audit
- chat.service.ts grew from 354 -> 390 lines (still tracked as B-M10, increasingly urgent)
- No new lint, type, or build errors
- No console.log/warn/error found in source (clean)
- No TODO/FIXME/HACK comments in source (clean)
- No dangerouslySetInnerHTML usage (clean)
- No hardcoded secrets found in source files
- No `any` types in non-test source files (clean)
- i18n: all 4 locales in sync (47 keys each)
- All cross-module imports follow approved patterns (chat->auth for guards/decorators)
- All URLs/ports are in config files or .env defaults (not hardcoded in business logic)
- ARCHITECTURE.md drift found and fixed: messages collection missing token usage fields, users collection table absent

## Retrospective #2 Findings
- FEAT-6 (Token Usage & Cost Tracking) completed (PR #28)
- F-M23 (hardcoded "Error:" prefix) fixed — now uses i18n key `errors.streamErrorPrefix`
- chat.service.ts grew from 354 -> 390 lines (tracked as B-M10, increasingly urgent)
- New ESLint rules promoted:
  - `window.alert()` ban via `no-restricted-syntax` AST selector (existing usages have eslint-disable with F-M21 task ID)
  - `no-restricted-globals` for bare `alert()` calls
- Conventions updated: rules 6 (no window.alert) and 7 (no hardcoded user-facing strings) added
- Existing tracked violations confirmed still present:
  - chat.service.ts at 390 lines (tracked as B-M10)
  - window.alert() in FileAttachment.tsx (tracked as F-M21, now caught by ESLint)
  - Hardcoded rgba/gradient colors: ~27 occurrences across 6 files (tracked as F-M13)
  - `any` types in test files only (acceptable per conventions)

## Previous Findings (Sweep #4)
- B-M5, B-M6, B-M7 completed since last sweep -- medium done count: 3 -> 6
- 5 frontend functions exceed 50-line limit (React components/hooks, tracked as F-L2)

## Targets
- Test count: 100+ (achieved — currently 279)
- Coverage: 80%+ (currently 60%/50% thresholds)
- Lint errors: 0 (achieved)
- Type errors: 0 (achieved)
- Critical tech debt: 0 (achieved)
- High tech debt: 0 (achieved)
- Medium tech debt: 0 (achieved — all medium items complete)
