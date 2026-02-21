# Quality Metrics Dashboard

> Last updated: 2026-02-21 (audit #3)

## Test Summary

| Area | Test Files | Tests | Pass Rate |
|------|-----------|-------|-----------|
| Backend | 11 | 84 | 100% |
| Frontend | 7 | 37 | 100% |
| **Total** | **18** | **121** | **100%** |

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
- Critical: 0 (JWT authentication completed)
- High: 0 todo — all 7 high-priority items completed (F-H5, F-H6 done since audit #2)
- Medium: 29 todo, 2 done
- Low: 12 todo, 1 done
- Features: 9 todo, 1 done
- Total tracked: 65 (see `docs/exec-plans/tech-debt-tracker.md`)

## New Findings (Audit #3)
- Frontend test count jumped from 33 → 37 (+4 ChatInput validation tests from PR #20)
- Total tests now 121 (target: 100+ sustained)
- All high-priority items now complete: F-H5 (input validation), F-H6 (React.memo)
- Backend vulnerabilities decreased: 40 → 35 (jest/babel transitive deps)
- Frontend outdated count increased slightly: 7 → 8 (jsdom minor available)
- No new lint, type, or build errors
- No console.log/warn/error found in source (clean)
- No TODO/FIXME/HACK comments in source (clean)
- chat.service.ts at 337 lines — still exceeds 300-line limit (tracked as B-M10)
- window.alert() still used in FileAttachment.tsx (tracked as F-M21)
- Hardcoded rgba/gradient colors: ~16 occurrences across 5 files (tracked as F-M13)
- No hardcoded secrets found in source files
- i18n: ChatInput uses t() properly, no new hardcoded strings detected

## Targets
- Test count: 100+ (achieved — currently 121)
- Coverage: 80%+ (currently 60%/50% thresholds)
- Lint errors: 0 (achieved)
- Type errors: 0 (achieved)
- Critical tech debt: 0 (achieved)
- High tech debt: 0 (achieved)
