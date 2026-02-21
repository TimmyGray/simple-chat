# Quality Metrics Dashboard

> Last updated: 2026-02-21 (sweep #4)

## Test Summary

| Area | Test Files | Tests | Pass Rate |
|------|-----------|-------|-----------|
| Backend | 12 | 95 | 100% |
| Frontend | 7 | 37 | 100% |
| **Total** | **19** | **132** | **100%** |

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
- Frontend: 1.4 MB (dist/)

## Tech Debt
- Critical: 0 todo, 4 done (JWT authentication completed)
- High: 0 todo, 7 done — all high-priority items completed
- Medium: 25 todo, 6 done (B-M5, B-M6, B-M7 completed since last sweep)
- Low: 12 todo, 1 done
- Features: 9 todo, 1 done
- Total tracked: 65 (see `docs/exec-plans/tech-debt-tracker.md`)

## New Findings (Sweep #4)
- Backend tests: 90 -> 95 (+5 from idempotency/pool-options specs, PRs #26-#27)
- Total tests now 132 (target: 100+ sustained)
- B-M5, B-M6, B-M7 completed since last sweep — medium done count: 3 -> 6
- chat.service.ts grew from 337 -> 354 lines (still tracked as B-M10)
- 5 frontend functions exceed 50-line limit (React components/hooks, tracked as F-L2)
- No new lint, type, or build errors
- No console.log/warn/error found in source (clean)
- No TODO/FIXME/HACK comments in source (clean)
- No dangerouslySetInnerHTML usage (clean)
- No hardcoded secrets found in source files
- i18n: all 4 locales in sync (44 keys each), no hardcoded user-facing strings detected
- All cross-module imports follow approved patterns (chat→auth for guards/decorators)
- All URLs/ports are in config files or .env defaults (not hardcoded in business logic)
- No new auto-fixable violations found (codebase is clean)
- Existing tracked violations confirmed still present:
  - chat.service.ts at 354 lines (tracked as B-M10)
  - window.alert() in FileAttachment.tsx (tracked as F-M21)
  - Hardcoded rgba/gradient colors: ~27 occurrences across 6 files (tracked as F-M13)
  - Hardcoded "Error:" prefix in useMessages.ts (tracked as F-M23)
  - `any` types in test files only (12 occurrences, acceptable per conventions)

## Targets
- Test count: 100+ (achieved — currently 132)
- Coverage: 80%+ (currently 60%/50% thresholds)
- Lint errors: 0 (achieved)
- Type errors: 0 (achieved)
- Critical tech debt: 0 (achieved)
- High tech debt: 0 (achieved)
