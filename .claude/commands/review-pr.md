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

End with a verdict: **APPROVE** or **REQUEST_CHANGES**

If APPROVE: note any non-blocking suggestions
If REQUEST_CHANGES: list the blocking issues that must be fixed
