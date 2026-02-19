# Codebase Audit

Perform a comprehensive audit of the codebase, update metrics, and identify new improvement tasks.

## Process

### 1. Automated Checks
Run and capture results:
- `npm audit` — security vulnerabilities
- `npm outdated` (root, backend, frontend) — outdated dependencies
- `npm run lint 2>&1 | tail -20` — lint errors
- `npm run typecheck 2>&1 | tail -20` — type errors
- `npm run test 2>&1 | tail -20` — test results
- `du -sh backend/dist frontend/dist 2>/dev/null` — bundle sizes

### 2. Code Quality Scan
Read source files and scan for:
- Anti-patterns (deeply nested callbacks, large files > 300 lines, god functions > 50 lines)
- Missing error handling
- Hardcoded values that should be configurable
- Missing tests for critical paths
- Security issues (unsanitized input, exposed secrets)
- i18n gaps (hardcoded user-facing strings)
- Dead code or unused exports

### 3. Update Quality Metrics
Update `docs/QUALITY_SCORE.md` with fresh data:
- Test count and pass rate
- Lint error count
- Type error count
- Bundle sizes
- Dependency freshness
- Known vulnerability count

### 4. Update DB Schema Docs
Read the current MongoDB schema interfaces and update `docs/generated/db-schema.md`.

### 5. Update Tech Debt Tracker
Compare findings against `docs/exec-plans/tech-debt-tracker.md`:
- Mark completed items as done
- Add new items discovered during audit
- Update priorities based on current severity

### 6. Report
Create a summary with:
- Overall health assessment (healthy, needs attention, critical)
- New issues found (count by severity)
- Metrics trends (improving, stable, degrading)
- Top 3 recommended next actions

### 7. Commit & PR
If any docs were updated:
1. Create branch: `git checkout -b chore/audit-$(date +%Y%m%d)`
2. Commit changes
3. Create PR with audit report as description
