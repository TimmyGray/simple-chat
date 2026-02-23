# Quality Metrics Dashboard

> Last updated: 2026-02-23 (audit #6)

## Test Summary

| Area | Test Files | Tests | Pass Rate |
|------|-----------|-------|-----------|
| Backend | 13 | 112 | 100% |
| Frontend | 9 | 48 | 100% |
| **Total** | **22** | **160** | **100%** |

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
- Backend: 860 KB (dist/)
- Frontend: 1.4 MB (dist/)

## Tech Debt
- Critical: 0 todo, 4 done (JWT authentication completed)
- High: 0 todo, 7 done — all high-priority items completed
- Medium: 18 todo, 12 done, 1 wont-fix (F-M2, F-M3, F-M4 completed since last sweep)
- Low: 12 todo, 1 done
- Features: 8 todo, 2 done (FEAT-6 completed)
- Total tracked: 65 (see `docs/exec-plans/tech-debt-tracker.md`)

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
- Test count: 100+ (achieved — currently 160)
- Coverage: 80%+ (currently 60%/50% thresholds)
- Lint errors: 0 (achieved)
- Type errors: 0 (achieved)
- Critical tech debt: 0 (achieved)
- High tech debt: 0 (achieved)
