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

## Staged Completeness Check

When run before a commit (i.e., there are staged or unstaged changes), perform a staged-file completeness check:

1. Run `git status --short`
2. For each `??` (untracked) file:
   - Check if any staged `.ts`, `.tsx`, `.js`, or `.jsx` file imports it (search for the filename or relative path in staged files)
   - If found, report as `UNSTAGED DEPENDENCY: <file>` — this file **must** be staged before committing or CI will fail
3. For each ` M` (unstaged modified) file:
   - Check if this file was modified as part of the current work (e.g., imported by staged files)
   - If found, report as `UNSTAGED MODIFICATION: <file>`
4. If no issues found, report `Staged Completeness: PASS`

This check prevents the most common CI failure: files that exist on disk (so local `tsc` passes) but aren't committed (so CI `tsc` fails with "Cannot find module").

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
| Staged Completeness | PASS/WARN | unstaged dependency count or "clean" |

If any check fails, provide the first few lines of error output for quick diagnosis.
