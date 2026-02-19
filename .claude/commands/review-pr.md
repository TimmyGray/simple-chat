# PR Self-Review (Multi-Agent)

Review the current branch's changes against project standards using parallel specialized review agents.

> Inspired by: "We've pushed almost all review effort towards agent-to-agent... effectively a Ralph Wiggum Loop." — OpenAI Harness Engineering

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

### 2. Parallel Specialized Reviews

Launch these reviews as parallel Task agents (using `code-review-advisor` subagent type). Each agent reviews the diff from a different perspective:

**Agent A: Security Review**
- Read `docs/SECURITY.md` for context
- Check: no secrets/API keys, input validation, path traversal, XSS, error leakage
- Severity: critical or warning only

**Agent B: Code Quality Review**
- Read `docs/design-docs/core-beliefs.md` and `docs/CONVENTIONS.md` for context
- Check: no unused imports, no `any` types, error handling, no hardcoded values
- Check: no cross-module imports, file size limits, function size limits
- Check: `console.log` usage (should use Pino logger in backend)
- Severity: critical, warning, or suggestion

**Agent C: i18n & Pattern Review**
- Read `docs/FRONTEND.md` and `docs/DESIGN.md` for context
- Check: all user-facing strings use `t()`, keys in all 4 locale files
- Check: MUI components used (not raw HTML), theme tokens (not hardcoded colors)
- Check: DTOs for request validation (backend), proper hook patterns (frontend)
- Severity: critical or warning

**Agent D: Test Coverage Review**
- Read `docs/RELIABILITY.md` for context
- Check: new functionality has tests, edge cases covered, tests deterministic
- Check: architecture test still passes conceptually (no new cross-module imports)
- Check: no test files with timing dependencies or flaky patterns
- Severity: warning or suggestion

### 3. Aggregate Results

Collect all findings from the 4 agents. Deduplicate overlapping issues.

For each issue, report:
- File and line number
- Review agent (Security / Quality / i18n / Testing)
- Severity (critical, warning, suggestion)
- Description and fix recommendation (with remediation instructions)

### 4. Verdict

Count blocking issues (severity: critical or warning):
- If 0 blocking issues: `VERDICT: APPROVE`
- If any blocking issues: `VERDICT: REQUEST_CHANGES`

End with the verdict on its own line.

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
5. Suggestions are logged for the next `/retrospective` to analyze patterns

## Review Quality Rules

- Be specific: cite exact file and line number
- Be actionable: every issue must include a concrete fix recommendation
- Remediation messages should be copy-pasteable guidance for the fixing agent
- Don't flag stylistic preferences — only flag issues that affect correctness, security, or maintainability
- When in doubt, mark as `suggestion` not `warning`
