# Autonomous Feature Development

You are an autonomous development agent. Your job is to pick a task, implement it end-to-end, and create a PR.

## Input
$ARGUMENTS — Optional task ID from `docs/exec-plans/tech-debt-tracker.md`. If empty, pick the next unstarted highest-priority task.

## Workflow

### Phase 1: Task Selection
1. Read `docs/exec-plans/tech-debt-tracker.md`
2. If task ID provided, find that task. Otherwise, select the next task with status `todo` and highest priority (critical > high > medium > low)
3. Display the selected task and confirm understanding

### Phase 2: Context Gathering
1. Read `ARCHITECTURE.md` for system overview
2. Based on the task area:
   - Backend work → read relevant backend source files
   - Frontend work → read `docs/FRONTEND.md`, `docs/DESIGN.md`, relevant components
   - Security work → read `docs/SECURITY.md`
   - Full-stack → read all of the above
3. Read `docs/design-docs/core-beliefs.md` for engineering principles

### Phase 3: Branch & Plan
1. Create a feature branch: `git checkout -b feat/<kebab-case-task-name>`
2. For high-effort tasks (estimated > 1 day), create an exec plan in `docs/exec-plans/active/<feature>.md`
3. Plan the implementation: list files to create/modify, tests to write

### Phase 4: Implementation
1. Implement the changes following project patterns
2. Write tests for new functionality
3. Ensure i18n compliance: all user-facing strings use `t()` from react-i18next
4. Follow patterns from `docs/references/` if applicable

### Phase 5: Validation
1. Run the full validation suite:
   ```
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
2. Fix any failures and re-run until all pass
3. If stuck after 3 retry cycles, document the blocker and stop

### Phase 6: Commit & PR
1. Stage specific files (never `git add .` or `git add -A`)
2. Commit with a descriptive message
3. Push the branch: `git push -u origin feat/<branch-name>`
4. Create PR via `gh pr create` using the project's PR template format

### Phase 7: Self-Review
1. Read the diff: `git diff main...HEAD`
2. Check against `docs/SECURITY.md` security checklist
3. Check against `docs/design-docs/core-beliefs.md` principles
4. If issues found, fix them before finalizing

### Phase 8: Bookkeeping
1. Update task status in `docs/exec-plans/tech-debt-tracker.md` to `done`
2. If an exec plan was created, move it to `docs/exec-plans/completed/`
3. Commit bookkeeping changes

## Important Rules
- Never skip validation. Fix errors before creating the PR.
- Stage files explicitly — never use `git add .`
- If a task seems too large (touches > 15 files), break it into subtasks first
- If tests fail and you can't fix them after 3 attempts, stop and report the issue
- Always check that i18n strings are complete in all 4 locale files (en, ru, zh, es)
