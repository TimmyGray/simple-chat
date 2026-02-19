# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Quick Reference

| What | Where |
|------|-------|
| System architecture | `ARCHITECTURE.md` |
| Security model & checklist | `docs/SECURITY.md` |
| Frontend patterns | `docs/FRONTEND.md` |
| UI/UX design system | `docs/DESIGN.md` |
| Error handling & monitoring | `docs/RELIABILITY.md` |
| Product vision & priorities | `docs/PRODUCT_SENSE.md` |
| High-level roadmap | `docs/PLANS.md` |
| Quality metrics | `docs/QUALITY_SCORE.md` |
| Engineering principles | `docs/design-docs/core-beliefs.md` |
| Task backlog | `docs/exec-plans/tech-debt-tracker.md` |
| NestJS patterns | `docs/references/nestjs-patterns.md` |
| MUI theme reference | `docs/references/mui-theme-reference.md` |
| OpenRouter API | `docs/references/openrouter-api.md` |
| DB schema | `docs/generated/db-schema.md` |

## Commands

### Development
```bash
npm run dev              # Start both backend and frontend concurrently
npm run dev:backend      # Backend only (NestJS watch mode, port 3001)
npm run dev:frontend     # Frontend only (Vite dev server, port 5173)
```

### Validation
```bash
npm run lint             # ESLint backend + frontend
npm run typecheck        # TypeScript check backend + frontend
npm test                 # Run all tests (backend + frontend)
npm run build            # Build both
npm run validate         # All of the above in sequence
```

### Single-target
```bash
npm run test:backend               # Backend tests only
npm run test:frontend              # Frontend tests only
cd backend && npx vitest run src/chat/chat.service.spec.ts  # Single test
cd frontend && npx vitest run src/__tests__/ChatInput.test.tsx  # Single test
```

## Claude Code Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/develop-feature` | Autonomous feature development | Pick next task, implement, test, PR |
| `/develop-feature <ID>` | Develop specific task | Implement a specific task by ID |
| `/validate` | Run full validation suite | Before creating a PR |
| `/review-pr` | Self-review current branch | After implementation, before merge |
| `/review-pr <PR#>` | Review a specific PR | Code review |
| `/audit-service` | Codebase audit + metrics update | Every 3-5 features |
| `/retrospective` | Workflow self-improvement | Every 5-10 features |
| `/i18n-dev` | i18n development guidelines | When adding user-facing strings |

## Conventions

### Code
- **Backend tests:** `*.spec.ts` next to source files, Vitest + NestJS Testing
- **Frontend tests:** `src/__tests__/*.test.tsx`, Vitest + jsdom + RTL
- **i18n:** All user-facing strings use `t()` from react-i18next. 4 locales: en, ru, zh, es
- **Validation:** DTOs with class-validator (backend), client-side validation (frontend)
- **Styling:** MUI 7 components + theme tokens, no raw HTML or hardcoded colors

### Git
- Branch naming: `feat/<kebab-case>`, `fix/<kebab-case>`, `chore/<kebab-case>`
- Commit messages: descriptive, focused on "why"
- Stage files explicitly — never use `git add .` or `git add -A`
- PRs follow `.github/pull_request_template.md` format

### Environment
- Backend: `backend/.env` (see `backend/.env.example`) — `OPENROUTER_API_KEY` required
- Frontend: `VITE_API_URL` (default `http://localhost:3001/api`)

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
```

**Cadence:**
- `/develop-feature` — on demand (human triggers)
- `/audit-service` — every 3-5 features completed
- `/retrospective` — every 5-10 features, or when quality metrics trend down
