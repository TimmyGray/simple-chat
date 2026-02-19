# Workflow Retrospective

Analyze recent development patterns, improve the autonomous development workflow, and **promote repeated review findings into mechanical enforcement**.

> Inspired by: "When documentation falls short, we promote the rule into code." — OpenAI Harness Engineering

## Process

### 1. Gather Data
- `gh pr list --state merged --limit 10` — recent merged PRs
- For each PR: `gh pr view <number>` — read description, review comments
- Read `docs/QUALITY_SCORE.md` — current metrics
- Read `docs/exec-plans/tech-debt-tracker.md` — task completion rate

### 2. Analyze Patterns
Look for:
- **Repeated review issues:** Same type of issue flagged across multiple PRs
- **Scope problems:** PRs that were too large or touched too many areas
- **Test gaps:** Features merged without adequate tests
- **Validation failures:** Common lint/type/test errors that could be prevented
- **Command effectiveness:** Are the develop-feature/validate/review steps catching issues?
- **Sweep findings:** Were the same violations found by `/sweep` repeatedly?

### 3. Identify Improvements
For each pattern found, propose a concrete improvement:
- ESLint rule to catch it automatically
- CI check to prevent it
- Command modification to address it
- Core belief to add/update
- Reference doc to create/update

### 4. Promote Findings into Code (KEY STEP)

**This is the most important step.** For any issue found 3+ times across PRs:

#### 4a. Promote to ESLint Rule
If the issue is a code pattern violation:
1. Check if an existing ESLint rule covers it (search the rule registry)
2. If yes: add/enable the rule in `backend/eslint.config.mjs` or `frontend/eslint.config.js`
3. If no existing rule: use `no-restricted-syntax` or `no-restricted-imports` with a custom message
4. **The error message MUST include remediation instructions** — it will be shown to the agent when the rule fires
5. Example:
   ```javascript
   {
     selector: 'CallExpression[callee.property.name="forEach"]',
     message: 'Prefer for...of loops over .forEach() for better readability and early return support. See docs/CONVENTIONS.md.'
   }
   ```

#### 4b. Promote to Structural Test
If the issue is an architectural violation:
1. Add a new test case to `backend/src/architecture.spec.ts`
2. Include a remediation message in the test failure output
3. The test should validate the invariant mechanically

#### 4c. Promote to CI Check
If the issue is a process violation:
1. Add a step to `.github/workflows/ci.yml`
2. Or add a check to the `/validate` command

#### 4d. Update Documentation
If the issue reveals a gap in documentation:
1. Update the relevant doc (`docs/CONVENTIONS.md`, `docs/SECURITY.md`, etc.)
2. Add a pointer from `CLAUDE.md` if the doc is new

### 5. Apply Improvements
For each approved improvement:
- Update `.claude/commands/*.md` if workflow needs adjustment
- Update `docs/design-docs/core-beliefs.md` if new principles learned
- Update ESLint configs if new rules added
- Update `backend/src/architecture.spec.ts` if new structural tests added
- Run `npm run validate` to verify changes don't break anything

### 6. Update Learning Memory
Write key learnings to Claude Code auto-memory files:
- `patterns.md` — successful patterns to repeat
- `pitfalls.md` — mistakes to avoid

These files live in the Claude Code auto-memory directory for this project. Use the auto-memory path shown in your system prompt (it varies per developer machine).

### 7. Report
Present:
- PRs analyzed (count, date range)
- Patterns identified
- **Rules promoted** (new ESLint rules, structural tests, CI checks)
- Improvements proposed
- Changes made
- Metrics comparison (before vs after)

## Promotion Tracking

Keep a running log of promoted rules in the report:

```
## Promoted Rules Log
| Date | Pattern | Promoted To | Rule/Test Name |
|------|---------|-------------|----------------|
| 2026-02-19 | console.log usage | ESLint | no-console |
| 2026-02-19 | raw HTML elements | ESLint | no-restricted-syntax |
| 2026-02-19 | cross-module imports | ESLint + arch test | no-restricted-imports + architecture.spec.ts |
```

## Cadence
Run this every 5-10 features, or when the quality metrics trend downward.
