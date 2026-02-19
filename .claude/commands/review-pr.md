# PR Self-Review

Review the current branch's changes against project standards.

## Input
$ARGUMENTS — Optional PR number. If empty, review the current branch's diff against main.

## Process

### 1. Gather Changes
If PR number provided:
- `gh pr diff $PR_NUMBER`
- `gh pr view $PR_NUMBER`

If no PR number:
- `git diff main...HEAD`
- `git log main..HEAD --oneline`

### 2. Review Criteria

Read these docs for review context:
- `docs/SECURITY.md` — security checklist
- `docs/design-docs/core-beliefs.md` — engineering principles
- `docs/RELIABILITY.md` — error handling patterns

For each changed file, check:

**Code Quality:**
- [ ] No unused imports or variables
- [ ] No `any` types (use proper typing)
- [ ] Error handling present (try/catch, error states)
- [ ] No hardcoded values that should be configurable

**Security:**
- [ ] No secrets or API keys in code
- [ ] Input validated before use
- [ ] File paths reconstructed server-side
- [ ] User content sanitized
- [ ] Error responses don't leak internals

**Testing:**
- [ ] New functionality has tests
- [ ] Edge cases covered (empty input, errors, timeouts)
- [ ] Tests are deterministic (no timing dependencies)

**i18n:**
- [ ] All user-facing strings use `t()` function
- [ ] New keys added to all 4 locale files (en, ru, zh, es)

**Patterns:**
- [ ] Follows existing code patterns in the module
- [ ] Uses MUI components (not raw HTML) for frontend
- [ ] Uses theme tokens for styling
- [ ] DTOs used for request validation (backend)

### 3. Report

For each issue found, report:
- File and line number
- Issue category (security, quality, testing, i18n, pattern)
- Severity (critical, warning, suggestion)
- Description and fix recommendation

### 4. Verdict

End with a machine-readable verdict on its own line:

- If no blocking issues: `VERDICT: APPROVE`
- If blocking issues exist: `VERDICT: REQUEST_CHANGES`

If APPROVE: note any non-blocking suggestions above the verdict line.
If REQUEST_CHANGES: list all blocking issues above the verdict line.

**Important:** The verdict line must be exactly `VERDICT: APPROVE` or `VERDICT: REQUEST_CHANGES` — this format is parsed by the autonomous pipeline (`/develop-feature`) to determine next steps.

## Fix Loop (Autonomous Pipeline)

When this review is run as part of the `/develop-feature` autonomous pipeline:

1. The calling agent reads the `VERDICT:` line to decide whether to proceed or fix
2. If `VERDICT: REQUEST_CHANGES`, the caller will:
   - Fix all blocking issues listed in the report
   - Commit and push fixes
   - Re-run CI checks
   - Re-run this review
3. Max 2 review-fix cycles — after that, remaining issues are reported to the user
4. Non-blocking suggestions (severity: suggestion) do not trigger a fix loop
