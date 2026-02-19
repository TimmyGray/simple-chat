# Workflow Retrospective

Analyze recent development patterns and improve the autonomous development workflow.

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

### 3. Identify Improvements
For each pattern found, propose a concrete improvement:
- ESLint rule to catch it automatically
- CI check to prevent it
- Command modification to address it
- Core belief to add/update
- Reference doc to create/update

### 4. Apply Improvements
For each approved improvement:
- Update `.claude/commands/*.md` if workflow needs adjustment
- Update `docs/design-docs/core-beliefs.md` if new principles learned
- Update CI config if new checks needed
- Update ESLint config if new rules needed

### 5. Update Learning Memory
Write key learnings to Claude Code auto-memory files:
- `patterns.md` — successful patterns to repeat
- `pitfalls.md` — mistakes to avoid

These files live in the Claude Code auto-memory directory for this project. Use the auto-memory path shown in your system prompt (it varies per developer machine).

### 6. Report
Present:
- PRs analyzed (count, date range)
- Patterns identified
- Improvements proposed
- Changes made
- Metrics comparison (before vs after)

## Cadence
Run this every 5-10 features, or when the quality metrics trend downward.
