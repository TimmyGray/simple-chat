# Validation Suite

Run all validation checks and report results.

## Checks

Run each check and record pass/fail:

1. **Backend Lint**: `cd backend && npm run lint`
2. **Frontend Lint**: `cd frontend && npm run lint`
3. **Backend Typecheck**: `cd backend && npm run typecheck`
4. **Frontend Typecheck**: `cd frontend && npm run typecheck`
5. **Backend Tests**: `cd backend && npm test`
6. **Frontend Tests**: `cd frontend && npm test`
7. **Backend Build**: `cd backend && npm run build`
8. **Frontend Build**: `cd frontend && npm run build`

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
