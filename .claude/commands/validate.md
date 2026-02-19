# Validation Suite

Run all validation checks and report results.

## Checks

Run each check and record pass/fail:

1. **Backend Lint**: `npm run lint:backend`
2. **Frontend Lint**: `npm run lint:frontend`
3. **Backend Typecheck**: `npm run typecheck:backend`
4. **Frontend Typecheck**: `npm run typecheck:frontend`
5. **Backend Tests**: `npm run test:backend`
6. **Frontend Tests**: `npm run test:frontend`
7. **Backend Build**: `cd backend && npm run build`
8. **Frontend Build**: `cd frontend && npm run build`

Note: Backend lint includes `--fix` (auto-corrects fixable issues). This is intentional — validation both checks and fixes formatting.

## Output

Present results as a summary table:

| Check | Status | Details |
|-------|--------|---------|
| Backend Lint | PASS/FAIL | error count or "clean" |
| Frontend Lint | PASS/FAIL | error count or "clean" |
| Backend Typecheck | PASS/FAIL | error count or "clean" |
| Frontend Typecheck | PASS/FAIL | error count or "clean" |
| Backend Tests | PASS/FAIL | X passed, Y failed |
| Frontend Tests | PASS/FAIL | X passed, Y failed |
| Backend Build | PASS/FAIL | |
| Frontend Build | PASS/FAIL | |

If any check fails, provide the first few lines of error output for quick diagnosis.
