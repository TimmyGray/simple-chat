# Quality Metrics Dashboard

> Last updated: 2026-02-19 (audit #2)

## Test Summary

| Area | Test Files | Tests | Pass Rate |
|------|-----------|-------|-----------|
| Backend | 11 | 75 | 100% |
| Frontend | 7 | 33 | 100% |
| **Total** | **18** | **108** | **100%** |

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
| Backend | ~25 | 12 (5 patch, 4 minor, 3 major) | 40 (11 moderate, 29 high — all in jest/babel transitive deps) |
| Frontend | ~20 | 7 (2 patch, 2 minor, 3 major) | 11 (1 moderate, 10 high — all in eslint/minimatch transitive deps) |

## Bundle Size
- Backend: 1.1 MB (dist/)
- Frontend: 1.4 MB (dist/)

## Tech Debt
- Critical: 0 (JWT authentication completed)
- High: 5 (unchanged — B-H5, B-H6, B-H7, F-H3, F-H5, F-H6)
- Medium: 24 (unchanged)
- Low: 11 (F-L3 completed in sweep)
- Features: 9 todo, 1 done
- Total tracked: 64 (see `docs/exec-plans/tech-debt-tracker.md`)

## New Findings (Audit #2)
- Backend test count jumped from 58 → 75 (+17 tests, new spec files for schemas, arch, middleware)
- Backend test file count jumped from 9 → 11 (+2 new spec files)
- Total tests now 108 (target: 100+ achieved!)
- No new lint or type errors
- `npm audit` vulnerabilities are all in dev-only transitive dependencies (jest, eslint) — no production risk
- Outdated deps are mostly patch/minor; major bumps (eslint 10, @types/node 25, globals 17) require migration
- Frontend: 2 `window.alert()` usages should migrate to Snackbar (tracked as F-M21)
- Frontend: 5 minor accessibility gaps (tracked as F-M6, existing)

## Targets
- Test count: 100+ (achieved — currently 108)
- Coverage: 80%+ (currently 60%/50% thresholds)
- Lint errors: 0 (achieved)
- Type errors: 0 (achieved)
- Critical tech debt: 0 (achieved)
