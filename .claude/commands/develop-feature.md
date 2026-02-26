# Autonomous Feature Development

You are an autonomous development agent. Your job is to pick a task, implement it end-to-end, create a PR, monitor CI, fix failures, and merge — all without human intervention.

## Input
$ARGUMENTS — Optional task ID from `docs/exec-plans/tech-debt-tracker.md`. If empty, pick the next unstarted highest-priority task.

## Workflow

### Phase 0: Concurrency Setup

Before task selection, set up for safe parallel execution with other agents. **Phases 0–1 must run in the main repo** (before entering a worktree) because `active-work.json` is gitignored and only exists in the main working tree.

> **Sandbox note**: When the agent starts inside a worktree, the sandbox's `.` scope covers only the worktree directory. All writes to `active-work.json` in the main repo (and `git fetch` which writes `FETCH_HEAD`) require `dangerouslyDisableSandbox: true` on Bash calls. This applies to Phases 0, 1 (registry write), 1.5 (git fetch), and 11 (unregister).

1. Read `docs/exec-plans/active-work.json`. If the file is missing or corrupt, back up the corrupt file (`cp active-work.json active-work.json.bak 2>/dev/null || true`), then create a fresh file with: `{"schema_version":1,"sessions":[]}`
2. **Stale cleanup**: For each session entry:
   - If `started_at` is older than 24 hours → remove the entry (safety net for crashed sessions)
   - Otherwise, treat the entry as **active** — do not remove it. Entries are only removed by Phase 11 (post-merge bookkeeping) or by this 24-hour timeout.
3. Write the cleaned registry using atomic rename: write to `active-work.json.tmp`, then `mv active-work.json.tmp active-work.json`
4. **Port allocation**: Find the lowest available slot number (0, 1, 2, ...) not used by any remaining session. Base ports match `backend/.env.example` (PORT=3001) and frontend default `VITE_API_URL` (localhost:3001):
   - Slot 0: backend port 3001, frontend port 5173
   - Slot 1: backend port 3002, frontend port 5174
   - Slot 2: backend port 3003, frontend port 5175
   - General formula: backend = 3001 + slot, frontend = 5173 + slot
5. Note the list of currently active `task_id`s — these are off-limits for task selection
6. Store the allocated ports and slot number for use in later phases

### Phase 1: Task Selection
1. Read `docs/exec-plans/tech-debt-tracker.md`
2. If task ID provided, find that task. Otherwise, select the next task with status `todo` and highest priority (critical > high > medium > low)
3. **Skip active tasks**: When selecting the next `todo` task, skip any task whose ID appears in the active-work registry (from Phase 0 step 5). If a specific task ID was provided via `$ARGUMENTS` and it's already active in the registry, **warn and stop** — do not compete with another agent
4. Display the selected task and confirm understanding
5. **Register in active-work registry**: Add a session entry to `docs/exec-plans/active-work.json` with:
   - `task_id`: the selected task ID
   - `branch`: the branch name to be created (e.g., `feat/<kebab-case-task-name>`)
   - `started_at`: current ISO 8601 timestamp
   - `ports`: `{"backend": <allocated_backend_port>, "frontend": <allocated_frontend_port>}`
6. Write the updated registry using atomic rename (write to `.tmp`, then `mv`)
7. **Post-write verification**: Re-read `active-work.json` and confirm that:
   - Own entry is present
   - No other entry has the same slot or task_id
   - If a conflict is detected (another agent registered simultaneously), pick a new slot/task and retry from step 1 (max 3 retries)

### Phase 1.5: Worktree Isolation

Isolate the working tree so multiple `/develop-feature` agents can run concurrently without branch conflicts.

1. **Store main repo root** for later reference to shared files (e.g., `active-work.json` which is gitignored and only exists in the main working tree):
   - Run `git rev-parse --show-toplevel` and **remember this path as the main repo root** (referred to as "the main repo root" in Phases 10–12). This is agent-remembered state, not a persistent environment variable.
2. **Enter an isolated worktree** using the `EnterWorktree` tool with `name: "feat-<task-kebab>"`. This creates a fresh copy of the repo at `.claude/worktrees/<name>/` with its own branch.
   - If `EnterWorktree` fails (e.g., already in a worktree), skip this step — the agent is already isolated
3. **Verify isolation**: Run `git rev-parse --show-toplevel` and confirm the path contains `.claude/worktrees/`. If not, the worktree setup was skipped (which is acceptable for single-agent execution).
4. **Install dependencies**: The worktree has no `node_modules/`. Run `npm install` at the repo root, then `npm install` in `backend/` and `npm install` in `frontend/`.
5. **Sync remote refs**: Run `git fetch origin main` to ensure `origin/main` is up-to-date. **Never run `git checkout main`** inside a worktree — `main` is always checked out by the primary working tree and git forbids the same branch in two worktrees.

> **Why worktrees?** Without isolation, two `/develop-feature` agents sharing the same working tree will conflict on `git checkout`, `git add`, and other file operations. Worktrees give each agent its own directory, while sharing the same `.git` object store (so pushes and fetches are fast).

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
1. Create a feature branch: `git checkout -b feat/<kebab-case-task-name> origin/main`. In a worktree, this creates a new branch based on the latest `origin/main` and switches to it (the worktree's initial branch is abandoned). This works because the feature branch name (`feat/...`) differs from the worktree-created branch, and using `origin/main` avoids needing to checkout `main` (which is forbidden in worktrees).
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
3. Ensure i18n compliance: all user-facing strings use `t()` from react-i18next. **In plain `.ts` modules without React hook access** (utilities, API clients), do NOT hardcode user-facing strings — accept i18n strings as parameters from the calling hook/component.
4. Follow patterns from `docs/references/` if applicable
5. **Update execution plan** after each significant decision:
   - Log architectural choices: "Chose X over Y because Z"
   - Update phase completion status

### Phase 5: Validation + Staged-File Completeness
1. **Dependency freshness check** — ensure `node_modules` matches `package-lock.json`:
   ```
   cd backend && npm ls --depth=0 2>&1 | grep -q 'missing:' && npm install; cd ..
   cd frontend && npm ls --depth=0 2>&1 | grep -q 'missing:' && npm install; cd ..
   ```
   This catches the case where new packages were added to `package.json` but `npm install` wasn't run (e.g., stale node_modules from a prior session).
2. Run validation checks — fix failures, max 3 retries per check:
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

### Phase 6: Playwright Deep Validation (Port-Aware)

Use the ports allocated in Phase 0. This ensures multiple agents can run dev servers simultaneously.

1. Start dev servers in background using allocated ports:
   - `PORT=<allocated_backend_port> npm run dev:backend &`
   - `cd frontend && VITE_API_URL=http://localhost:<allocated_backend_port>/api npx vite --port <allocated_frontend_port> &`
   - Note: `VITE_API_URL` must be set so the frontend calls the correct backend port (the default fallback in `client.ts` is port 3001, which is wrong for slot 1+)
2. Wait for servers to be ready:
   - Poll `http://localhost:<allocated_backend_port>/api/health` until it responds (max 30s)
   - Poll `http://localhost:<allocated_frontend_port>` until it responds (max 30s)

3. **Observability: Capture backend logs**
   - Before testing, note the backend process output (Pino logs)
   - After testing, check logs for: ERROR level entries, unhandled exceptions, slow operations

4. **Deep browser validation** (not just "page loads"):
   - Use `browser_navigate` → `http://localhost:<allocated_frontend_port>`
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

   **CRITICAL — End-to-end action verification:**
   - Do NOT stop at "the page loads and looks correct"
   - **Actually click every new button/action** added by this feature and verify the result
   - After any streaming operation completes, verify that follow-up actions work (fork, regenerate, edit, etc.) — optimistic state can hide bugs that only surface on user interaction
   - Use `browser_evaluate` to inspect React state if needed (e.g., verify message `_id` format, check for stale/optimistic data)
   - Use `browser_network_requests` AFTER performing actions to confirm the expected API calls were made
   - If an action silently does nothing (no error, no network call, no UI change), that's a **critical bug** — investigate

5. **Check backend logs for errors**:
   - Read the backend process output
   - Flag any ERROR or WARN level log entries that occurred during the test
   - If backend errors found, treat as a validation failure

6. Kill dev servers precisely (won't interfere with other agents' servers or unrelated processes):
   - `lsof -ti:<allocated_backend_port> -c node | xargs kill 2>/dev/null || true`
   - `lsof -ti:<allocated_frontend_port> -c node -c vite | xargs kill 2>/dev/null || true`
   - The `-c` flag filters by command name, preventing accidental termination of non-dev-server processes
7. If smoke test reveals critical issues (JS errors, broken UI, failed API calls, backend errors):
   - Fix the code
   - Return to Phase 5 (max 3 retry cycles across Phases 5-6)

### Phase 7: Commit & PR
1. Run `git status --short` one final time
2. **Working directory assertion**: Before any git commands, run `git rev-parse --show-toplevel` and confirm you're at the repo root. If you `cd`'d into a subdirectory during implementation, `cd` back to the repo root first.
3. Stage each file explicitly by name (never `git add .` or `git add -A`). **Always use repo-root-relative paths** (e.g., `frontend/vite.config.ts`, not `src/../../vite.config.ts`). If unsure of the correct path, use `git status --short` output which always shows repo-root-relative paths.
4. Cross-check: run `git diff --cached --name-only` and verify it includes all files created/modified in Phase 4
5. If any file is missing from the staged set, stage it now
6. Commit with a descriptive message focused on "why"
7. Push: `git push -u origin feat/<branch-name>`
8. Create PR via `gh pr create` using the project's PR template format
   - Include Playwright smoke test screenshot in the PR body if captured
   - Include link to execution plan if one was created

### Phase 8: CI Monitor & Fix Loop
1. **Wait for checks to register** before polling: GitHub Actions needs time to pick up a new push. Run `sleep 10` first, then use `gh pr checks <PR#> --watch --interval 30` to wait for CI. If `--watch` returns "no checks reported", retry with `sleep 15 && gh pr checks <PR#> --watch --interval 30` (max 2 retries). Do **not** fall back to manual `sleep N && gh pr checks` loops — always use `--watch`.
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

### Phase 9b: Root Cause Analysis & Immediate Learning

**Activation**: Only when Phase 9 had `REQUEST_CHANGES` (skip entirely if Phase 9 was `APPROVE` on first pass).

**Time budget**: 3-5 minutes (analysis only, no functional code changes).

1. **Collect findings**: Gather all critical/warning findings from the Phase 9 review(s)
2. **Classify each by root cause category**:
   - `CONV` — Convention gap (rule exists but context made it hard to apply)
   - `OVER` — Overgeneralization (correct in narrow context, wrong when exported broadly)
   - `RAIL` — Missing guard rail (no lint rule/test prevents this)
   - `PROC` — Workflow/process bug (wrong directory, wrong paths, stale state)
   - `MODEL` — Incomplete mental model (didn't consider all callers/contexts)
   - `COPY` — Copy-paste drift (adapted from similar code without verifying assumptions)
3. **Write structured entries** to `pitfalls.md` (in the Claude Code auto-memory directory — the path is shown in your system prompt, e.g., `~/.claude/projects/.../memory/pitfalls.md`) under a `## Per-Feature Learning:` section with:
   - Finding (what was caught)
   - Category (from above)
   - Root cause analysis (why it happened)
   - Prevention (what would have caught it earlier)
   - Promotion candidacy (is this promotable to a lint rule/test/prompt?)
4. **Check promotion threshold**: Count same-category occurrences in `pitfalls.md`. If **2+ occurrences** of the same category, promote immediately (this is the first-tier prompt-level promotion; if the same category reaches 3+ in `/retrospective`, it gets escalated further to a lint rule or architecture test):
   - `CONV` → Update `docs/CONVENTIONS.md` + `review-pr.md` agent prompt
   - `OVER` / `MODEL` / `COPY` → Update `review-pr.md` agent prompt with a new check
   - `RAIL` → Add ESLint rule (`no-restricted-syntax`) or architecture test
   - `PROC` → Add safeguard to `develop-feature.md`
5. **If promotion applied**: Stage the changed `.md`/config files, commit with message `"chore: phase 9b promotion — <category>"`, and push to the feature branch
6. **Append root cause summary** to the PR description:
   ```bash
   BODY=$(gh pr view --json body -q '.body')
   gh pr edit --body "$BODY

   ## Root Cause Analysis
   <summary>"
   ```

### Phase 10: Auto-Merge (Conflict-Aware)
1. Verify PR is mergeable: `gh pr view --json mergeable,mergeStateStatus`
2. If not mergeable (e.g., conflicts):
   - Attempt rebase onto main: `git fetch origin main && git rebase origin/main`
   - If rebase succeeds, force-push the rebased branch: `git push --force-with-lease`
   - If rebase fails due to conflicts in **bookkeeping files only** (`tech-debt-tracker.md`, `maintenance-cadence.json`, `db-schema.md`): resolve by accepting the main branch version and re-applying own changes, then `git rebase --continue`
   - If rebase fails due to conflicts in **application source code** (`.ts`, `.tsx`, `.spec.ts`, etc.): abort the rebase (`git rebase --abort`), stop, and report the conflict — do not auto-resolve source code conflicts
   - Retry the merge check. If still not mergeable after one rebase attempt, stop and report
3. Merge: `gh pr merge --squash --delete-branch`
4. **Switch to the main repo working tree**: `cd` to the main repo root (remembered from Phase 1.5). The main repo already has `main` checked out (running `git checkout main` from the worktree would fail). Once in the main repo root, run `git pull origin main` to sync with the merged PR.

### Phase 11: Bookkeeping (Post-Merge)

> **Important**: All Phase 11 and 12 operations run from the **main repo working tree** (the path remembered from Phase 1.5), not from the worktree. The worktree's branch was deleted by `--delete-branch` in Phase 10, so the worktree is abandoned after merge.

1. Update task status in `docs/exec-plans/tech-debt-tracker.md` to `done`
2. If an exec plan was created, move it to `docs/exec-plans/completed/`
3. Stage bookkeeping files explicitly by name
4. Commit bookkeeping changes directly to main and push
5. **Unregister from active-work registry**: Read `docs/exec-plans/active-work.json` (you are already in the main repo root per the Phase 11 note above), remove own session entry (matching own `task_id` — this is the authoritative identifier), write the updated registry back using atomic rename. No need to commit — it's gitignored.

### Phase 12: Maintenance Cadence Check

After bookkeeping, check if any maintenance tasks are due and launch them automatically.

> **Concurrency note**: Multiple agents may increment counters concurrently. Slight over-counting is acceptable and self-correcting (maintenance runs slightly more often, which is harmless).

1. Read `docs/exec-plans/maintenance-cadence.json`
   - If the file does not exist, create it with: `schema_version: 1`, all counters at 0, thresholds `{sweep: 3, audit: 5, retrospective: 10}`, empty `pending_runs: []`, today's date for all `last_runs`, and `last_updated` set to today
2. **Recovery check**: if `pending_runs` is non-empty, these are maintenance tasks that were due but never launched (previous session crashed). Re-launch them now (skip to step 10) and clear `pending_runs` after launching
3. Increment all three counters by 1:
   - `counters.features_since_last_sweep += 1`
   - `counters.features_since_last_audit += 1`
   - `counters.features_since_last_retrospective += 1`
4. Update `last_updated` to today's date
5. Determine which maintenance tasks are due:
   - **Sweep due** if `features_since_last_sweep >= thresholds.sweep_every_n_features`
   - **Audit due** if `features_since_last_audit >= thresholds.audit_every_n_features`
   - **Doc-garden due** if audit is due (doc-garden always runs after audit, not independently — it has no separate counter)
   - **Retrospective due** if `features_since_last_retrospective >= thresholds.retrospective_every_n_features`
6. For each due task: reset its counter to 0 and set its `last_runs` date to today
7. Write the list of due tasks to `pending_runs` (e.g., `["sweep", "audit", "retrospective"]`)
8. Write the updated JSON back to `docs/exec-plans/maintenance-cadence.json`
9. Stage, commit, and push the state file to main: `"chore: update maintenance cadence counters"`. If the push fails due to a non-fast-forward rejection (another agent pushed first), run `git pull --rebase origin main`, re-read `maintenance-cadence.json`, and re-evaluate whether maintenance is still due based on the pulled state. If counters were already reset by another agent, skip to step 13.
10. **Double-check before launching**: Re-read `pending_runs` from `docs/exec-plans/maintenance-cadence.json`. If another agent has already cleared `pending_runs` to `[]` since step 7, skip launching — the other agent already handled it.
11. **If any maintenance tasks are due** (or recovered from `pending_runs`), report which ones and launch them as **parallel background Task subagents**:
    - Use `run_in_background: true` for all subagents — do NOT wait for them to complete
    - **Sweep subagent** (`general-purpose`): "Read `.claude/commands/sweep.md` and execute all instructions in that file against this codebase. You are running as an automated maintenance task triggered by the develop-feature workflow."
    - **Audit + Doc-garden subagent** (`general-purpose`): "Read `.claude/commands/audit-service.md` and execute all instructions. When the audit is complete, read `.claude/commands/doc-garden.md` and execute those instructions too. You are running as an automated maintenance task triggered by the develop-feature workflow."
    - **Retrospective subagent** (`general-purpose`): "Read `.claude/commands/retrospective.md` and execute all instructions in that file. You are running as an automated maintenance task triggered by the develop-feature workflow."
    - Note: doc-garden is bundled with audit (sequential within one subagent) because doc-garden checks for staleness that audit may have just updated
12. After subagents are launched, clear `pending_runs` to `[]`, write the JSON, stage, commit, and push: `"chore: clear maintenance pending_runs"`
13. **If no maintenance tasks are due**, report the countdown:
    - "No maintenance tasks due. Next: sweep in N features, audit in N features, retrospective in N features (last run: DATE)."
    - Calculate N as `threshold - current_counter` for each task

## Important Rules
- Never skip validation. Fix errors before creating the PR.
- Stage files explicitly — never use `git add .` or `git add -A` (include generated docs from `docs/generated/` if updated)
- If a task seems too large (touches > 15 files), break it into subtasks first
- If tests fail and you can't fix them after 3 attempts, stop and report the issue
- Always check that i18n strings are complete in all 4 locale files (en, ru, zh, es)
- Always kill dev servers (Phase 6) using port-specific `lsof` commands — never `pkill -f` which may kill other agents' servers
- The staged-file completeness check (Phase 5) is critical — it prevents the #1 cause of CI failures
- Max retry limits are hard limits: do not exceed them. Report blockers instead.
- Execution plans are living documents: update them as you make decisions during implementation
- When the agent struggles, treat it as a signal: identify what capability is missing and feed it back into the repo
