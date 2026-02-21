# Quality Metrics Dashboard

> Last updated: 2026-02-21 (sweep post-audit #3)

## Test Summary

| Area | Test Files | Tests | Pass Rate |
|------|-----------|-------|-----------|
| Backend | 12 | 90 | 100% |
| Frontend | 7 | 37 | 100% |
| **Total** | **19** | **127** | **100%** |

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
- Medium: 28 todo, 3 done (B-M1 response DTOs done since audit #3)
- Low: 12 todo, 1 done
- Features: 9 todo, 1 done
- Total tracked: 65 (see `docs/exec-plans/tech-debt-tracker.md`)

## New Findings (Sweep post-audit #3)
- Backend tests jumped from 84 → 90 (+6 from transform-response interceptor tests, PR #23)
- Backend test files: 11 → 12 (new interceptor spec)
- Total tests now 127 (target: 100+ sustained)
- B-M1 (response DTOs) completed since audit #3 — medium done count: 2 → 3
- No new lint, type, or build errors
- No console.log/warn/error found in source (clean)
- No TODO/FIXME/HACK comments in source (clean)
- No dangerouslySetInnerHTML usage (clean)
- No hardcoded secrets found in source files
- i18n: all 4 locales in sync (44 keys each), no hardcoded user-facing strings detected
- All cross-module imports follow approved patterns (chat→auth for guards/decorators)
- All URLs/ports are in config files or .env defaults (not hardcoded in business logic)
- Existing tracked violations confirmed still present:
  - chat.service.ts at 337 lines (tracked as B-M10)
  - window.alert() in FileAttachment.tsx (tracked as F-M21)
  - Hardcoded rgba/gradient colors: ~27 occurrences across 6 files (tracked as F-M13)
  - Hardcoded "Error:" prefix in useMessages.ts (tracked as F-M23)
  - `any` types in test files only (12 occurrences, acceptable per conventions)

## Targets
- Test count: 100+ (achieved — currently 127)
- Coverage: 80%+ (currently 60%/50% thresholds)
- Lint errors: 0 (achieved)
- Type errors: 0 (achieved)
- Critical tech debt: 0 (achieved)
- High tech debt: 0 (achieved)
