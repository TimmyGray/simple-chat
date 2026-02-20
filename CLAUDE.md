# CLAUDE.md

This file is the table of contents for Claude Code. It points to deeper sources of truth — not a comprehensive manual. (~60 lines, by design.)

## Quick Reference

| What | Where |
|------|-------|
| System architecture | `ARCHITECTURE.md` |
| Code conventions | `docs/CONVENTIONS.md` |
| Workflow & commands | `docs/WORKFLOW.md` |
| Security model | `docs/SECURITY.md` |
| Frontend patterns | `docs/FRONTEND.md` |
| UI/UX design system | `docs/DESIGN.md` |
| Reliability & errors | `docs/RELIABILITY.md` |
| Product vision | `docs/PRODUCT_SENSE.md` |
| Roadmap | `docs/PLANS.md` |
| Quality metrics | `docs/QUALITY_SCORE.md` |
| Engineering principles | `docs/design-docs/core-beliefs.md` |
| Task backlog | `docs/exec-plans/tech-debt-tracker.md` |
| Maintenance cadence | `docs/exec-plans/maintenance-cadence.json` |
| NestJS patterns | `docs/references/nestjs-patterns.md` |
| MUI theme reference | `docs/references/mui-theme-reference.md` |
| OpenRouter API | `docs/references/openrouter-api.md` |
| DB schema | `docs/generated/db-schema.md` |

## Commands (Quick)

```bash
npm run dev              # Start both backend and frontend
npm run validate         # lint + typecheck + test + build
npm test                 # Run all tests
```

## Claude Code Commands

| Command | When to Use |
|---------|-------------|
| `/develop-feature` | Pick next task, implement end-to-end, PR, merge |
| `/validate` | Before creating a PR |
| `/review-pr` | After implementation, before merge |
| `/audit-service` | Auto: every 5 features (or manual) |
| `/sweep` | Auto: every 3 features (or manual) |
| `/doc-garden` | Auto: runs with audit (or manual) |
| `/retrospective` | Auto: every 10 features (or manual) |
| `/i18n-dev` | When adding user-facing strings |

## Key Rules (Non-Negotiable)

- Stage files explicitly — never `git add .` or `git add -A`
- All user-facing strings use `t()` — 4 locales: en, ru, zh, es
- No `console.log` — use Pino logger (backend) or remove (frontend)
- No raw HTML — use MUI components
- No cross-module imports — use NestJS DI
- Run `npm run validate` before every PR

For full conventions, see `docs/CONVENTIONS.md`. For workflow details, see `docs/WORKFLOW.md`.
