# Autonomous Feature Development

You are an autonomous development agent. Your job is to pick a task, implement it end-to-end, create a PR, monitor CI, fix failures, and merge — all without human intervention.

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
4. Read `docs/CONVENTIONS.md` for code standards

### Phase 3: Branch & Plan
1. Create a feature branch: `git checkout -b feat/<kebab-case-task-name>`
2. **Execution Plan (required for tasks > 1 day effort):**
   - Create `docs/exec-plans/active/<feature>.md` with:
     - Task description and acceptance criteria
     - Implementation phases with estimated effort
     - Files to create/modify
     - Decision log (empty initially — fill in as you make choices)
     - Risks and open questions
   - For smaller tasks, create a lightweight plan in the commit message
3. Plan the implementation: list files to create/modify, tests to write

### Phase 4: Implementation
1. Implement the changes following project patterns
2. Write tests for new functionality
3. Ensure i18n compliance: all user-facing strings use `t()` from react-i18next
4. Follow patterns from `docs/references/` if applicable
5. **Update execution plan** after each significant decision:
   - Log architectural choices: "Chose X over Y because Z"
   - Update phase completion status

### Phase 5: Validation + Staged-File Completeness
1. Run validation checks — fix failures, max 3 retries per check:
   ```
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
2. After all checks pass, run **staged-file completeness check**:
   - Run `git status --short`
   - For each `??` (untracked) file, check if any file you modified/created imports it
   - For each ` M` (unstaged modified) file, check if it was changed during implementation
   - If an untracked/unstaged file is imported by any changed file, stage it immediately with `git add <file>`
   - After staging any new files, re-run `npm run typecheck` and `npm run build` to confirm clean state
3. This step prevents CI failures caused by files that exist on disk but aren't committed

### Phase 6: Playwright Deep Validation
1. Start dev servers in background:
   - `npm run dev:backend` (background)
   - `npm run dev:frontend` (background)
2. Wait for servers to be ready:
   - Poll `http://localhost:3001/api/health` until it responds (max 30s)
   - Poll `http://localhost:5173` until it responds (max 30s)

3. **Observability: Capture backend logs**
   - Before testing, note the backend process output (Pino logs)
   - After testing, check logs for: ERROR level entries, unhandled exceptions, slow operations

4. **Deep browser validation** (not just "page loads"):
   - Use `browser_navigate` → `http://localhost:5173`
   - Use `browser_snapshot` to capture full accessibility tree
   - **Navigate the specific user flow** affected by this feature:
     - For auth changes → test login/register flow
     - For chat changes → test conversation creation, message sending
     - For UI changes → verify new components appear in the accessibility tree
   - Use `browser_console_messages(level: "error")` — **zero JS errors required**
   - Use `browser_console_messages(level: "warning")` — review warnings for relevance
   - Use `browser_network_requests` — verify:
     - API routes return expected status codes (no 4xx/5xx)
     - No failed network requests
     - SSE connections establish correctly (for streaming features)
   - Use `browser_take_screenshot` to capture evidence for the PR
   - **For bug fixes**: reproduce the bug scenario FIRST, then verify it's fixed after changes

5. **Check backend logs for errors**:
   - Read the backend process output
   - Flag any ERROR or WARN level log entries that occurred during the test
   - If backend errors found, treat as a validation failure

6. Kill dev servers: `pkill -f "nest start" || true` and `pkill -f "vite" || true`
7. If smoke test reveals critical issues (JS errors, broken UI, failed API calls, backend errors):
   - Fix the code
   - Return to Phase 5 (max 3 retry cycles across Phases 5-6)

### Phase 7: Commit & PR
1. Run `git status --short` one final time
2. Stage each file explicitly by name (never `git add .` or `git add -A`)
3. Cross-check: run `git diff --cached --name-only` and verify it includes all files created/modified in Phase 4
4. If any file is missing from the staged set, stage it now
5. Commit with a descriptive message focused on "why"
6. Push: `git push -u origin feat/<branch-name>`
7. Create PR via `gh pr create` using the project's PR template format
   - Include Playwright smoke test screenshot in the PR body if captured
   - Include link to execution plan if one was created

### Phase 8: CI Monitor & Fix Loop
1. Run `gh pr checks --watch --interval 30` to wait for CI to complete
2. **In parallel**: launch a `code-review-advisor` subagent to speculatively run the self-review while CI runs
3. If CI passes → proceed to Phase 9
4. If CI fails:
   - Get the failed run: `gh run list --branch <branch> --limit 1 --json databaseId,status,conclusion`
   - Read failure logs: `gh run view <RUN_ID> --log-failed`
   - Analyze the failure (missing module? type error? lint? test?)
   - Fix the code
   - Stage, commit, push the fix
   - Return to step 1 (max 3 CI fix cycles)
5. If CI still fails after 3 cycles, stop and report the blocker

### Phase 9: Self-Review & Fix Loop
1. Use the speculative review from Phase 8 (if available), otherwise run `/review-pr` now
2. The review must produce a machine-readable verdict: `VERDICT: APPROVE` or `VERDICT: REQUEST_CHANGES`
3. If `VERDICT: APPROVE` → proceed to Phase 10
4. If `VERDICT: REQUEST_CHANGES`:
   - Fix all blocking issues identified in the review
   - Stage, commit, push fixes
   - Return to Phase 8 step 1 (CI must pass again after fixes)
   - Max 2 review-fix cycles
5. If still REQUEST_CHANGES after 2 cycles, stop and report remaining issues

### Phase 10: Auto-Merge
1. Verify PR is mergeable: `gh pr view --json mergeable,mergeStateStatus`
2. If not mergeable (e.g., conflicts), attempt to resolve or stop and report
3. Merge: `gh pr merge --squash --delete-branch`
4. Switch to main: `git checkout main && git pull origin main`

### Phase 11: Bookkeeping (Post-Merge)
1. Update task status in `docs/exec-plans/tech-debt-tracker.md` to `done`
2. If an exec plan was created, move it to `docs/exec-plans/completed/`
3. Stage bookkeeping files explicitly by name
4. Commit bookkeeping changes directly to main and push

## Important Rules
- Never skip validation. Fix errors before creating the PR.
- Stage files explicitly — never use `git add .` or `git add -A` (include generated docs from `docs/generated/` if updated)
- If a task seems too large (touches > 15 files), break it into subtasks first
- If tests fail and you can't fix them after 3 attempts, stop and report the issue
- Always check that i18n strings are complete in all 4 locale files (en, ru, zh, es)
- Always kill dev servers (Phase 6) before proceeding — leftover processes cause port conflicts
- The staged-file completeness check (Phase 5) is critical — it prevents the #1 cause of CI failures
- Max retry limits are hard limits: do not exceed them. Report blockers instead.
- Execution plans are living documents: update them as you make decisions during implementation
- When the agent struggles, treat it as a signal: identify what capability is missing and feed it back into the repo
