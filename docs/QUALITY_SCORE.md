# Quality Metrics Dashboard

> Last updated: 2026-02-21 (retrospective #2)

## Test Summary

| Area | Test Files | Tests | Pass Rate |
|------|-----------|-------|-----------|
| Backend | 12 | 100 | 100% |
| Frontend | 7 | 37 | 100% |
| **Total** | **19** | **137** | **100%** |

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
- Medium: 24 todo, 7 done (F-M23 fixed in retrospective #2)
- Low: 12 todo, 1 done
- Features: 8 todo, 2 done (FEAT-6 completed)
- Total tracked: 65 (see `docs/exec-plans/tech-debt-tracker.md`)

## Retrospective #2 Findings
- Backend tests: 95 -> 100 (+5 from FEAT-6 token usage specs)
- Total tests now 137 (target: 100+ sustained)
- FEAT-6 (Token Usage & Cost Tracking) completed (PR #28)
- F-M23 (hardcoded "Error:" prefix) fixed — now uses i18n key `errors.streamErrorPrefix`
- chat.service.ts grew from 354 -> 390 lines (tracked as B-M10, increasingly urgent)
- i18n: all 4 locales in sync (47 keys each, +1 streamErrorPrefix)
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
- Test count: 100+ (achieved — currently 137)
- Coverage: 80%+ (currently 60%/50% thresholds)
- Lint errors: 0 (achieved)
- Type errors: 0 (achieved)
- Critical tech debt: 0 (achieved)
- High tech debt: 0 (achieved)
