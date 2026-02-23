# Quality Metrics Dashboard

> Last updated: 2026-02-23 (audit #7)

## Test Summary

| Area | Test Files | Tests | Pass Rate |
|------|-----------|-------|-----------|
| Backend | 13 | 112 | 100% |
| Frontend | 9 | 50 | 100% |
| **Total** | **22** | **162** | **100%** |

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
| Backend | ~25 | 12 (5 patch, 4 minor, 3 major) | 35 (5 moderate, 30 high — all in jest/babel transitive deps) |
| Frontend | ~20 | 8 (3 patch, 2 minor, 3 major) | 11 (1 moderate, 10 high — all in eslint/minimatch transitive deps) |

## Bundle Size
- Backend: 1.1 MB (dist/)
- Frontend: 1.4 MB (dist/) — initial load 671 KB + 796 KB lazy markdown chunk

## Tech Debt
- Critical: 0 todo, 4 done (JWT authentication completed)
- High: 0 todo, 7 done — all high-priority items completed
- Medium: 13 todo, 17 done, 1 wont-fix (F-M5 through F-M9 completed since last audit)
- Low: 12 todo, 1 done
- Features: 8 todo, 2 done (FEAT-6 completed)
- Total tracked: 65 (see `docs/exec-plans/tech-debt-tracker.md`)

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
<<<<<<< HEAD
- Test count: 100+ (achieved -- currently 162)
=======
- Test count: 100+ (achieved — currently 162)
>>>>>>> a977789 (chore: retrospective #3 — promote error handling pattern to ESLint rule)
- Coverage: 80%+ (currently 60%/50% thresholds)
- Lint errors: 0 (achieved)
- Type errors: 0 (achieved)
- Critical tech debt: 0 (achieved)
- High tech debt: 0 (achieved)
