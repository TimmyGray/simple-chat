# Roadmap

## Current Status
- **Phase 1 (Security & Stability):** 9/10 complete — JWT auth remaining
- **Phase 2 (Reliability & Error Handling):** 8/9 complete — minor streaming fix remaining
- **Phase 3 (Performance & Quality):** Not started
- **Phase 4 (Testing & Observability):** Not started

## Phase 3: Performance & Quality
Focus: Smooth UX for long conversations, clean codebase.

Key tasks:
- Memoize MessageBubble (React.memo)
- Virtualize message list (react-window)
- Lazy-load heavy markdown/syntax highlighting libs
- React Context to replace prop drilling
- Response DTOs and consistent API envelope
- Vite code splitting configuration

## Phase 4: Testing & Observability
Focus: Confidence in changes, visibility into production.

Key tasks:
- Backend coverage target: 80%+
- Frontend hook tests and API layer tests
- E2E tests with Playwright
- Error scenario tests
- Accessibility tests (axe-core)

## Future Features
See `docs/PRODUCT_SENSE.md` for prioritized feature list.
See `docs/exec-plans/tech-debt-tracker.md` for detailed task backlog.

## Completed
- Phase 1 items (rate limiting, input validation, XSS protection, error boundaries, etc.)
- Phase 2 items (exception filter, error states, SSE reliability, structured logging, etc.)
- i18n support (4 languages)
- Harness engineering infrastructure (CI/CD, hooks, commands)
