# Autonomous Development Workflow

## Self-Improvement Loop

The autonomous development workflow improves itself over time:

```
tech-debt-tracker.md → /develop-feature → /validate → /review-pr → PR
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

## Cadence

| Activity | Frequency | Trigger |
|----------|-----------|---------|
| `/develop-feature` | On demand | Human triggers |
| `/sweep` | Every 3 features | Auto: Phase 12 of develop-feature |
| `/doc-garden` | After every audit | Auto: runs with audit in Phase 12 |
| `/audit-service` | Every 5 features | Auto: Phase 12 of develop-feature |
| `/retrospective` | Every 10 features | Auto: Phase 12 of develop-feature |

## Maintenance Cadence State

Maintenance cadence is tracked in `docs/exec-plans/maintenance-cadence.json`. This file:
- Is updated by Phase 12 of `/develop-feature` after every feature merge
- Contains counters (features since last run), thresholds (trigger points), and last-run dates
- Is committed to git so state persists across sessions
- Thresholds are tunable: edit the `thresholds` object to change trigger points

When thresholds are met, Phase 12 launches maintenance tasks as parallel background subagents. Each subagent reads the corresponding `.claude/commands/*.md` file and executes independently, creating its own branch and PR.

## Principles

1. **Humans steer, agents execute** — Engineers design environments and specify intent. Agents write the code.
2. **When agents fail, fix the environment** — Don't "try harder." Ask: what capability is missing?
3. **Encode taste into tooling** — Review findings become lint rules. Conventions become tests.
4. **Corrections are cheap, waiting is expensive** — Fast merge, fast fix. Don't block on perfection.
5. **Repository is the system of record** — If it's not in the repo, it doesn't exist for the agent.
6. **Progressive disclosure** — CLAUDE.md is the table of contents, not the encyclopedia.
7. **Continuous garbage collection** — Pay down tech debt in small increments, not painful bursts.
