# Roadmap

## Current Status
- **Phase 1 (Security & Stability):** Complete
- **Phase 2 (Reliability & Error Handling):** Complete
- **Phase 3 (Performance & Quality):** Complete
- **Phase 4 (Testing & Observability):** Complete
- **Phase 5 (System Prompt Templates):** In progress — backend done (FEAT-5a), frontend remaining (FEAT-5b/5c/5d)
- **Phase 6 (Multi-Modal & Integrations):** Not started
- **Phase 7 (Advanced UX):** Not started

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

## Phase 5: System Prompt Templates (FEAT-5)
Focus: Reusable system prompt library for different conversation modes.

Key tasks:
- Backend templates module with CRUD + 8-10 seed defaults (FEAT-5a)
- Admin role system with isAdmin flag + AdminGuard (FEAT-5b)
- Frontend template selector in conversation UI (FEAT-5c)
- Frontend admin panel for template management (FEAT-5d)
- Future: per-user custom templates (visible only to creator)

## Phase 6: Multi-Modal & Integrations
Focus: Extend Simple Chat beyond text — support images, local models, and external tools.

Key tasks:
- Image input for vision-capable models (FEAT-11)
- Direct Ollama connection for offline local model usage (FEAT-13)
- MCP tool integration with inline tool-call rendering (FEAT-14)

## Phase 7: Advanced UX
Focus: Power-user workflows and conversation management.

Key tasks:
- Conversation branching / fork from any message (FEAT-12)
- Keyboard shortcuts system (FEAT-9)
- Real-time collaboration (FEAT-10)

## Future Features
See `docs/PRODUCT_SENSE.md` for prioritized feature list.
See `docs/exec-plans/tech-debt-tracker.md` for detailed task backlog.

## Completed
- Phase 1 items (rate limiting, input validation, XSS protection, error boundaries, etc.)
- Phase 2 items (exception filter, error states, SSE reliability, structured logging, etc.)
- Phase 3 items (memoize, virtualize, lazy-load, React Context, DTOs, code splitting)
- Phase 4 items (coverage tooling, hook tests, error scenario tests, accessibility tests)
- i18n support (4 languages)
- Harness engineering infrastructure (CI/CD, hooks, commands)
- FEAT-1: Authentication & Multi-Tenancy
- FEAT-2: Conversation Search (Cmd+K)
- FEAT-3: Message Editing & Regeneration
- FEAT-4: Conversation Export (Markdown/PDF/JSON)
- FEAT-6: Token Usage & Cost Tracking
- FEAT-7: Streaming Response Controls
- FEAT-8: Dark/Light Theme Toggle
