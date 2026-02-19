# Code Conventions

## Code Standards

### Backend
- **Tests:** `*.spec.ts` next to source files, Vitest + NestJS Testing
- **Logging:** Pino via nestjs-pino. Never use `console.log` — use `Logger` from `@nestjs/common`
- **Validation:** DTOs with class-validator at controller boundary, trust inside services
- **Error handling:** Use `AllExceptionsFilter` (global). Throw NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.)
- **Database:** MongoDB native driver via `DatabaseService`. Never access collections directly — use `DatabaseService` methods

### Frontend
- **Tests:** `src/__tests__/*.test.tsx`, Vitest + jsdom + React Testing Library
- **Components:** MUI 7 components only — no raw HTML (`<button>`, `<input>`, `<select>`, etc.)
- **Styling:** Theme tokens from `theme.ts` — no hardcoded colors (hex, rgb, hsl)
- **State:** Custom hooks (`useAuth`, `useConversations`, `useMessages`, `useModels`)
- **i18n:** All user-facing strings use `t()` from react-i18next. 4 locales: en, ru, zh, es

### Shared
- **TypeScript:** No `any` types in production code (allowed in test files)
- **Imports:** No cross-module internal imports. Use NestJS dependency injection for cross-module dependencies
- **File size:** Max 300 lines per file, max 50 lines per function
- **Async:** Always handle errors on async operations (try/catch or .catch())

## Git Conventions

- **Branch naming:** `feat/<kebab-case>`, `fix/<kebab-case>`, `chore/<kebab-case>`
- **Commit messages:** Descriptive, focused on "why" not "what"
- **Staging:** Always stage files explicitly by name — never use `git add .` or `git add -A`
- **PRs:** Follow `.github/pull_request_template.md` format. One PR = one concern.

## Architecture Rules (Mechanically Enforced)

These rules are enforced by ESLint custom rules with remediation messages and structural architecture tests:

1. **No cross-module imports:** Backend modules (`auth/`, `chat/`, `uploads/`, `health/`, `models/`) must not import from each other's internal files. Use NestJS DI instead.
2. **No console.log:** Use the injected Pino logger (`Logger` from `@nestjs/common`)
3. **No raw HTML in React:** Use MUI components (`Button`, `TextField`, `Select`, etc.)
4. **No hardcoded colors:** Use `theme.palette.*` tokens
5. **Dependency direction:** Controllers → Services → Database. Never the reverse.

## Environment

- **Backend:** `backend/.env` (see `backend/.env.example`) — `OPENROUTER_API_KEY` required
- **Frontend:** `VITE_API_URL` (default `http://localhost:3001/api`)
