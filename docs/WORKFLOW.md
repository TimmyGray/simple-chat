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
| `/audit-service` | Codebase audit + metrics update | Every 3-5 features |
| `/retrospective` | Workflow self-improvement | Every 5-10 features |
| `/doc-garden` | Documentation freshness scan | After audits, before releases |
| `/sweep` | Golden principles enforcement | Every 2-3 features, or on quality degradation |
| `/i18n-dev` | i18n development guidelines | When adding user-facing strings |

## Cadence

| Activity | Frequency | Trigger |
|----------|-----------|---------|
| `/develop-feature` | On demand | Human triggers |
| `/sweep` | Every 2-3 features | After merges, quality drops |
| `/doc-garden` | After every audit | Post-audit, pre-release |
| `/audit-service` | Every 3-5 features | Feature milestone |
| `/retrospective` | Every 5-10 features | Quality metrics trend down |

## Principles

1. **Humans steer, agents execute** — Engineers design environments and specify intent. Agents write the code.
2. **When agents fail, fix the environment** — Don't "try harder." Ask: what capability is missing?
3. **Encode taste into tooling** — Review findings become lint rules. Conventions become tests.
4. **Corrections are cheap, waiting is expensive** — Fast merge, fast fix. Don't block on perfection.
5. **Repository is the system of record** — If it's not in the repo, it doesn't exist for the agent.
6. **Progressive disclosure** — CLAUDE.md is the table of contents, not the encyclopedia.
7. **Continuous garbage collection** — Pay down tech debt in small increments, not painful bursts.
