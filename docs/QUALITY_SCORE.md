# Quality Metrics Dashboard

> Last updated: 2026-02-21 (sweep #2)

## Test Summary

| Area | Test Files | Tests | Pass Rate |
|------|-----------|-------|-----------|
| Backend | 11 | 84 | 100% |
| Frontend | 7 | 33 | 100% |
| **Total** | **18** | **117** | **100%** |

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
- High: 2 todo (F-H5, F-H6) — B-H5, B-H6, B-H7, F-H3 completed since audit #2
- Medium: 24 (unchanged)
- Low: 11 (F-L3 completed in prior sweep)
- Features: 9 todo, 1 done
- Total tracked: 64 (see `docs/exec-plans/tech-debt-tracker.md`)

## New Findings (Sweep #2)
- Backend test count jumped from 75 → 84 (+9 tests from chat.service.spec additions)
- Total tests now 117 (target: 100+ achieved!)
- 4 high-priority items completed since last audit: B-H5, B-H6, B-H7, F-H3
- Removed redundant localhost fallback in chat.service.ts (config already provides default)
- No new lint, type, or build errors
- i18n: all 4 locale files (en, ru, zh, es) have identical key structure — no gaps
- No new cross-module import violations or architecture regressions
- `any` types: only in test files (allowed per conventions)
- Hardcoded rgba/gradient colors: 16 occurrences across 5 files (tracked as F-M13)

## Targets
- Test count: 100+ (achieved — currently 117)
- Coverage: 80%+ (currently 60%/50% thresholds)
- Lint errors: 0 (achieved)
- Type errors: 0 (achieved)
- Critical tech debt: 0 (achieved)
