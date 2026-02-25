# Autonomous Development Workflow

## Self-Improvement Loop

The autonomous development workflow improves itself over time:

```
User idea → /add-feature → tech-debt-tracker.md → /develop-feature → /validate → /review-pr → PR
                                                         ↑                                       |
                                                         |                                       ↓
                                               /audit-service ← ← ← ← ← ← ← ← ← ← ←  merged PR
                                               (update metrics,                              |
                                                find new issues)                             ↓
                                                         ↑                           /retrospective
                                                         |                           (improve workflow)
                                                         ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
                                                         ↑
                                               /doc-garden + /sweep
                                               (continuous quality enforcement)
```

## Command Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/add-feature` | Interactive backlog intake | Add feature or task to tracker interactively |
| `/develop-feature` | Autonomous feature development | Pick next task, implement, test, PR |
| `/develop-feature <ID>` | Develop specific task | Implement a specific task by ID |
| `/validate` | Run full validation suite | Before creating a PR |
| `/review-pr` | Multi-agent self-review | After implementation, before merge |
| `/review-pr <PR#>` | Review a specific PR | Code review |
| `/audit-service` | Codebase audit + metrics update | Auto: every 5 features (or manual) |
| `/retrospective` | Workflow self-improvement | Auto: every 10 features (or manual) |
| `/doc-garden` | Documentation freshness scan | Auto: runs with audit (or manual) |
| `/sweep` | Golden principles enforcement | Auto: every 3 features (or manual) |
| `/i18n-dev` | i18n development guidelines | When adding user-facing strings |
| `/update-roadmap` | Strategic roadmap refresh | Quarterly or when roadmap feels stale |

## Cadence

| Activity | Frequency | Trigger |
|----------|-----------|---------|
| `/add-feature` | On demand | Human triggers |
| `/develop-feature` | On demand | Human triggers |
| `/sweep` | Every 3 features | Auto: Phase 12 of develop-feature |
| `/doc-garden` | After every audit | Auto: runs with audit in Phase 12 |
| `/audit-service` | Every 5 features | Auto: Phase 12 of develop-feature |
| `/retrospective` | Every 10 features | Auto: Phase 12 of develop-feature |
| `/update-roadmap` | Quarterly (manual) | Human triggers after phase completion or market shift |

## Parallel Execution

Multiple `/develop-feature` agents can run concurrently. The system handles this through:

### Active Work Registry

File: `docs/exec-plans/active-work.json` (gitignored — runtime state only)

Each agent registers itself on startup and unregisters on completion. The registry tracks:
- **Task ID** — prevents two agents from picking the same task
- **PID** — enables stale session detection (dead process = auto-cleanup)
- **Ports** — each agent gets a unique port pair for dev servers
- **Timestamp** — sessions older than 24h are cleaned up as stale

### Port Allocation

Each agent is assigned a unique port pair based on its slot in the registry:

| Slot | Backend Port | Frontend Port |
|------|-------------|---------------|
| 0 | 3001 | 5173 |
| 1 | 3002 | 5174 |
| 2 | 3003 | 5175 |
| N | 3001 + N | 5173 + N |

Agents kill only their own dev servers using port-specific `lsof -ti:<port>` commands (never `pkill -f` which could affect other agents).

### Worktree Isolation

Each `/develop-feature` agent creates an isolated git worktree (via `EnterWorktree`) after task selection. This gives each agent its own working directory, eliminating branch conflicts and file operation races between concurrent agents. The worktrees are created at `.claude/worktrees/<name>/` and cleaned up on session exit.

**Important**: Phases 0–1 (concurrency setup and task selection) run in the main repo because `active-work.json` is gitignored and only exists there. Phase 1.5 enters the worktree, and all subsequent phases run in isolation.

### Concurrency Safety

- **Working tree isolation**: Each agent runs in its own git worktree — no branch or file conflicts
- **Task selection**: Agents skip tasks that are already active in the registry
- **Dev servers**: Each agent uses its allocated ports — no conflicts
- **Maintenance counters**: Slight over-counting from concurrent agents is acceptable and self-correcting (maintenance runs slightly more often)
- **Maintenance launches**: Before launching maintenance tasks, agents re-read `pending_runs` to avoid double-launching
- **Merge conflicts**: If merge fails due to conflicts from another recently-merged PR, the agent rebases and retries
- **Branch not up to date**: If `gh pr merge` fails with "head branch is not up to date", follow the recovery steps in the **PR Merge Recovery** section below

### Example: Running Two Agents in Parallel

Open two terminals and run `/develop-feature` in each. The first agent will take slot 0 (ports 3001/5173) and the second will take slot 1 (ports 3002/5174). They will automatically select different tasks, enter separate worktrees, and work independently without any file or branch conflicts.

## Maintenance Cadence State

Maintenance cadence is tracked in `docs/exec-plans/maintenance-cadence.json`. This file:
- Is updated by Phase 12 of `/develop-feature` after every feature merge
- Contains counters (features since last run), thresholds (trigger points), and last-run dates
- Is committed to git so state persists across sessions
- Thresholds are tunable: edit the `thresholds` object to change trigger points

When thresholds are met, Phase 12 launches maintenance tasks as parallel background subagents. Each subagent reads the corresponding `.claude/commands/*.md` file and executes independently, creating its own branch and PR.

## PR Merge Recovery

If `gh pr merge` fails with **"the head branch is not up to date with the base branch"**, the feature branch is behind `main`. Follow these steps:

1. **Fetch and rebase onto main**
   ```bash
   git fetch origin main
   git rebase origin/main
   ```
2. **Resolve conflicts** — if the rebase produces conflicts, resolve them, `git add` the fixed files, and `git rebase --continue`
3. **Run validation** — `npm run validate` to confirm nothing broke
4. **Force-push the updated branch** — `git push --force-with-lease`
5. **Wait for CI** — let any required checks pass on the updated branch
6. **Retry the merge** — `gh pr merge <PR#> --squash --delete-branch`

This is the expected recovery path when `main` has advanced since the branch was created (e.g., another PR was merged first). Do not use `--admin` to bypass branch protection.

## Principles

1. **Humans steer, agents execute** — Engineers design environments and specify intent. Agents write the code.
2. **When agents fail, fix the environment** — Don't "try harder." Ask: what capability is missing?
3. **Encode taste into tooling** — Review findings become lint rules. Conventions become tests.
4. **Corrections are cheap, waiting is expensive** — Fast merge, fast fix. Don't block on perfection.
5. **Repository is the system of record** — If it's not in the repo, it doesn't exist for the agent.
6. **Progressive disclosure** — CLAUDE.md is the table of contents, not the encyclopedia.
7. **Continuous garbage collection** — Pay down tech debt in small increments, not painful bursts.
8. **Parallelism over sequencing** — Multiple agents working concurrently outperform a single agent in series.
