# Simple Chat - Comprehensive Improvement Plan

> Full-stack audit and improvement roadmap for the Simple Chat application.
> Generated: 2026-02-16

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Backend Audit](#backend-audit)
3. [Frontend Audit](#frontend-audit)
4. [Improvement Roadmap](#improvement-roadmap)
5. [New Feature Proposals](#new-feature-proposals)
6. [UI/UX Redesign with MagicUI](#uiux-redesign-with-magicui)

---

## Executive Summary

| Area | Critical | High | Medium | Low | Total |
|------|----------|------|--------|-----|-------|
| Backend | 5 | 8 | 9 | 7 | 29 |
| Frontend | 4 | 6 | 20 | 6 | 36 |
| **Total** | **9** | **14** | **29** | **13** | **65** |

The application has a functional core but significant gaps in **security**, **error handling**, **performance**, and **production readiness**. The most urgent issues are the complete absence of authentication, no rate limiting, and unsafe input handling on both ends.

---

## Backend Audit

### CRITICAL Issues

#### B-C1: No Authentication / Authorization
- **Files:** All controllers (`backend/src/chat/chat.controller.ts`)
- **Impact:** Every endpoint is publicly accessible. Any user can read, create, modify, or delete any conversation or message. File uploads are unrestricted.
- **Risk:** Complete data breach; unauthorized API cost accumulation via LLM calls.
- **Fix:** Implement JWT-based auth with NestJS Guards, or integrate an auth provider (Auth0, Clerk, Firebase Auth).

#### B-C2: No Rate Limiting
- **Files:** All endpoints
- **Impact:** Unlimited LLM API calls (financial risk with OpenRouter), DoS vulnerability, file storage exhaustion.
- **Fix:** Add `@nestjs/throttler` with per-endpoint limits. LLM streaming endpoint needs stricter limits (e.g., 10 req/min).

#### B-C3: Unsafe ObjectId from Untrusted Input
- **Files:** `backend/src/chat/chat.service.ts` (lines 73, 88, 103, 110, 113, 120, 140, 152, 161, 202)
- **Impact:** `new ObjectId(id)` with raw URL params throws unhandled exceptions on invalid input, causing 500 errors instead of 400.
- **Fix:** Add a `ParseObjectIdPipe` or validate with `@IsMongoId()` decorator in param DTOs.

#### B-C4: API Key Exposed in Repository
- **File:** `backend/.env`
- **Impact:** `OPENROUTER_API_KEY` is committed with a real key value. Anyone with repo access can use it.
- **Fix:** Remove `.env` from git history (`git filter-branch` or BFG), rotate the key, ensure `.env` is in `.gitignore`.

#### B-C5: No Configuration Validation
- **File:** `backend/src/config/configuration.ts`
- **Impact:** App starts with empty `OPENROUTER_API_KEY` string. Fails only when first LLM call is made.
- **Fix:** Use `@nestjs/config` with `Joi` or `class-validator` schema to validate required env vars at startup.

---

### HIGH Issues

#### B-H1: File Path Traversal Risk
- **File:** `backend/src/chat/chat.service.ts` (lines 256-272)
- **Detail:** `AttachmentDto.filePath` comes from client input. Path traversal check uses string prefix matching which can be fragile with symlinks.
- **Fix:** Reconstruct file paths server-side using only the filename/ID, never accept full paths from client.

#### B-H2: SSE Stream Without Timeout or Client Disconnect Detection
- **File:** `backend/src/chat/chat.service.ts` (lines 181-225)
- **Detail:** No timeout on LLM streaming. If client disconnects mid-stream, server continues processing. `fullContent += content` accumulates unbounded memory.
- **Fix:** Add `AbortController` with timeout, listen for `req.on('close')`, implement max token limit.

#### B-H3: No Upload Cleanup / TTL
- **File:** `backend/uploads/` directory
- **Detail:** Files accumulate indefinitely. No disk space checks, no per-user quotas, no cleanup cron.
- **Fix:** Add scheduled cleanup job (NestJS `@Cron`), track upload metadata in DB with TTL, limit total storage.

#### B-H4: No Database Schema Validation or Migrations
- **File:** `backend/src/database/database.service.ts`
- **Detail:** Native MongoDB driver with no schema enforcement. TypeScript interfaces provide compile-time safety only.
- **Fix:** Add MongoDB JSON schema validation on collections, or switch to Mongoose for runtime schema enforcement.

#### B-H5: Unsafe `require('pdf-parse')` Inside Method
- **File:** `backend/src/chat/chat.service.ts` (line 297)
- **Detail:** Dynamic `require()` inside method body. No type safety, loaded on every call, ESLint rule disabled.
- **Fix:** Import at module level with proper typing.

#### B-H6: Hardcoded Frontend Origin in LLM Headers
- **File:** `backend/src/chat/chat.service.ts` (lines 34-37)
- **Detail:** `'HTTP-Referer': 'http://localhost:5173'` hardcoded. OpenRouter may validate this in production.
- **Fix:** Make configurable via environment variable.

#### B-H7: Express Response Object Passed to Service Layer
- **File:** `backend/src/chat/chat.service.ts` (line 129)
- **Detail:** `sendMessageAndStream(conversationId, dto, res: Response)` violates separation of concerns. Service should not know about HTTP transport.
- **Fix:** Return `AsyncIterable` from service; let controller handle SSE formatting.

#### B-H8: No Global Exception Filter
- **File:** Missing
- **Detail:** Each error handled differently. No consistent error response format, no centralized logging.
- **Fix:** Implement `@Catch() AllExceptionsFilter` with structured error responses.

---

### MEDIUM Issues

| ID | Issue | File | Fix |
|----|-------|------|-----|
| B-M1 | No response DTOs / API envelope | All controllers | Create response DTOs with metadata |
| B-M2 | No `@HttpCode` decorators | Controllers | Add `@HttpCode(201)` on POST, `204` on DELETE |
| B-M3 | No structured logging | All files | Add Winston/Pino with JSON format, correlation IDs |
| B-M4 | No health check endpoint | Missing | Add `@nestjs/terminus` health module |
| B-M5 | DTO fields lack length limits | `chat/dto/` | Add `@MaxLength`, `@MinLength`, `@IsNotEmpty` |
| B-M6 | No idempotency on message creation | `chat.service.ts` | Add idempotency key header support |
| B-M7 | No MongoDB connection pool config | `database.module.ts` | Configure `MongoClientOptions` |
| B-M8 | 32 ESLint errors in test files | `*.spec.ts` | Fix `any` types, use proper mocking |
| B-M9 | Only 23 tests, no coverage tool | Tests | Add `@vitest/coverage-v8`, target 80%+ |

---

### LOW Issues

| ID | Issue | Fix |
|----|-------|-----|
| B-L1 | Duplicate DTOs (Create/Update) | Use `PartialType(CreateConversationDto)` |
| B-L2 | Synchronous `mkdirSync` at startup | Use async `mkdir` |
| B-L3 | Hardcoded model list | Load from config or OpenRouter API |
| B-L4 | No `.gitignore` for uploads/ | Add to `.gitignore` |
| B-L5 | Missing strict TypeScript flags | Enable `strict: true` in tsconfig |
| B-L6 | Inconsistent SSE error format | Standardize error envelope |
| B-L7 | No CORS configuration documented | Document allowed origins |

---

## Frontend Audit

### CRITICAL Issues

#### F-C1: SSE Streaming Without Cancellation or Timeout
- **File:** `frontend/src/api/client.ts` (lines 39-99)
- **Detail:** No `AbortController`, no timeout, no cleanup on error. Stream reader not properly released. Network errors during streaming silently swallowed.
- **Fix:** Add `AbortController` with configurable timeout, proper `finally` cleanup, retry logic.

#### F-C2: Markdown Rendering Without Sanitization
- **File:** `frontend/src/components/Chat/MessageBubble.tsx` (lines 111-138)
- **Detail:** `react-markdown` renders LLM output without HTML sanitization. Malicious markdown from compromised backend could execute XSS.
- **Fix:** Add `rehype-sanitize` plugin.

#### F-C3: No Client-Side File Validation
- **File:** `frontend/src/components/Chat/FileAttachment.tsx` (lines 27-34)
- **Detail:** `accept` attribute is cosmetic only. No size validation, no count validation, no MIME type checking. Backend limits (5 files, 10MB) not enforced client-side.
- **Fix:** Validate file count, size, and type before upload.

#### F-C4: Array Index Used as React Key
- **Files:** `ChatInput.tsx:127`, `MessageBubble.tsx:72`, `TypingIndicator.tsx:13`
- **Detail:** `key={i}` causes incorrect reconciliation when list items are added/removed.
- **Fix:** Use `key={att.filePath}` or `crypto.randomUUID()`.

---

### HIGH Issues

#### F-H1: No React Error Boundary
- **File:** `frontend/src/App.tsx`
- **Detail:** Runtime errors in any component (e.g., markdown rendering crash) will unmount the entire app with a blank screen.
- **Fix:** Wrap app in Error Boundary with fallback UI.

#### F-H2: API Errors Silently Swallowed
- **Files:** All hooks (`useConversations.ts`, `useMessages.ts`, `useModels.ts`)
- **Detail:** `catch (err) { console.error(err) }` — errors logged to console but never shown to user. No error state returned from hooks.
- **Fix:** Add `error` state to each hook, display error UI.

#### F-H3: Streaming State Desynchronization
- **File:** `frontend/src/hooks/useMessages.ts` (lines 41-84)
- **Detail:** Local `fullContent` variable can diverge from `streamingContent` state. If callbacks aren't called (promise rejects), `streaming` stays `true` forever.
- **Fix:** Use `useRef` for accumulation, add `finally` block to always reset streaming state.

#### F-H4: Temp Message ID Collision with `Date.now()`
- **File:** `frontend/src/hooks/useMessages.ts` (lines 32, 60, 75)
- **Detail:** Rapid sends within same millisecond produce duplicate IDs, breaking React key uniqueness.
- **Fix:** Use `crypto.randomUUID()`.

#### F-H5: No Input Length Validation
- **File:** `frontend/src/components/Chat/ChatInput.tsx` (lines 29-36)
- **Detail:** Unlimited text length can be sent. No max character count enforced.
- **Fix:** Add `MAX_INPUT_LENGTH` constant and enforce on submit.

#### F-H6: MessageBubble Not Memoized
- **File:** `frontend/src/components/Chat/MessageList.tsx`
- **Detail:** All MessageBubble components re-render on every parent update. Markdown parsing is expensive.
- **Fix:** Wrap in `React.memo` with custom comparator.

---

### MEDIUM Issues

| ID | Issue | File | Fix |
|----|-------|------|-----|
| F-M1 | No list virtualization | `MessageList.tsx` | Add `react-window` for long conversations |
| F-M2 | Scroll fires on every stream chunk | `MessageList.tsx:22-24` | Throttle/debounce scroll-to-bottom |
| F-M3 | 9-prop drill through Layout | `Layout.tsx` | Introduce React Context |
| F-M4 | No cache invalidation strategy | `useMessages.ts` | Add background refresh / SWR pattern |
| F-M5 | No offline/connectivity detection | All API | Add `navigator.onLine` checks, queue |
| F-M6 | Missing ARIA labels on IconButtons | `ChatInput.tsx:166`, `FileAttachment.tsx:38` | Add `aria-label` |
| F-M7 | No semantic HTML in messages | `MessageList.tsx` | Use `<main>`, `<article>` |
| F-M8 | No focus management after send | `ChatInput.tsx` | Refocus input after message sent |
| F-M9 | No code splitting for heavy libs | `MessageBubble.tsx` | Lazy-load `react-markdown`, `react-syntax-highlighter` |
| F-M10 | Full page re-render on model change | `App.tsx` | Memoize or use Context |
| F-M11 | Weak interface definitions | `types/index.ts` | Add branded types, stricter contracts |
| F-M12 | Implicit `unknown` error handling | `App.tsx:25-28` | Type guard on caught errors |
| F-M13 | Hardcoded gradient colors | `MessageBubble.tsx:36-38` | Use theme palette tokens |
| F-M14 | No CORS error handling | `client.ts` | Add interceptor for CORS errors |
| F-M15 | Missing ESLint rules | `eslint.config.js` | Add `no-console`, `no-floating-promises` |
| F-M16 | No `.env.example` | Missing | Document `VITE_API_URL` |
| F-M17 | No code splitting in Vite config | `vite.config.ts` | Configure `rollupOptions.manualChunks` |
| F-M18 | Only 6 test files, no hook tests | `__tests__/` | Add hook tests, API layer tests |
| F-M19 | No error scenario tests | All tests | Test network failures, validation errors |
| F-M20 | No accessibility tests | All tests | Add axe-core or Testing Library a11y |

---

### LOW Issues

| ID | Issue | Fix |
|----|-------|-----|
| F-L1 | Magic numbers in component styles | Extract to constants/theme |
| F-L2 | Large component files (180+ lines) | Split into smaller sub-components |
| F-L3 | Inconsistent error logging | Standardize with a logger utility |
| F-L4 | Missing return type annotations | Add explicit types on hooks |
| F-L5 | Tablet layout not optimized | Test/adjust `md-lg` breakpoints |
| F-L6 | No production source maps documented | Configure and document in Vite |

---

## Improvement Roadmap

### Phase 1: Security & Stability (Week 1-2)

**Goal:** Make the app safe for any deployment environment.

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 1 | Add JWT authentication (NestJS Guards + frontend auth flow) | Critical | 3-4 days |
| 2 | Add rate limiting (`@nestjs/throttler`) | Critical | 0.5 day |
| 3 | Remove API key from git history, rotate key | Critical | 0.5 day |
| 4 | Add config validation at startup (Joi schema) | Critical | 0.5 day |
| 5 | Validate ObjectId params (custom pipe) | Critical | 0.5 day |
| 6 | Add `rehype-sanitize` to markdown renderer | Critical | 0.5 day |
| 7 | Client-side file validation (size, type, count) | Critical | 0.5 day |
| 8 | Fix file path traversal — server-side path reconstruction | High | 0.5 day |
| 9 | Add `AbortController` + timeout to SSE streaming (both ends) | High | 1 day |
| 10 | Add React Error Boundary | High | 0.5 day |

### Phase 2: Reliability & Error Handling (Week 3-4)

**Goal:** Graceful degradation, proper error communication.

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 11 | Global exception filter (backend) | High | 0.5 day |
| 12 | Add error state to all frontend hooks | High | 1 day |
| 13 | Fix streaming state desync (useRef, finally blocks) | High | 0.5 day |
| 14 | Client disconnect detection on SSE endpoint | High | 0.5 day |
| 15 | Upload cleanup cron job with TTL tracking | High | 1 day |
| 16 | Structured logging (Winston/Pino, correlation IDs) | Medium | 1 day |
| 17 | Health check endpoint (`@nestjs/terminus`) | Medium | 0.5 day |
| 18 | Fix temp message ID collisions (crypto.randomUUID) | High | 0.25 day |
| 19 | Fix React list keys (use unique IDs, not indices) | High | 0.25 day |

### Phase 3: Performance & Quality (Week 5-6)

**Goal:** Smooth UX for long conversations, clean codebase.

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 20 | Memoize MessageBubble (`React.memo`) | High | 0.5 day |
| 21 | Virtualize message list (`react-window`) | High | 1 day |
| 22 | Throttle scroll-to-bottom during streaming | Medium | 0.25 day |
| 23 | Lazy-load `react-markdown` + `react-syntax-highlighter` | Medium | 0.5 day |
| 24 | Introduce React Context to replace prop drilling | Medium | 1 day |
| 25 | Add response DTOs and consistent API envelope | Medium | 1 day |
| 26 | Configure MongoDB connection pooling | Medium | 0.25 day |
| 27 | Vite code splitting configuration | Medium | 0.5 day |
| 28 | Fix all 32 backend ESLint errors | Medium | 1 day |

### Phase 4: Testing & Observability (Week 7-8)

**Goal:** Confidence in changes, visibility into production behavior.

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 29 | Backend: Add coverage tool, target 80%+ | Medium | 0.5 day |
| 30 | Backend: Test file upload, SSE errors, path traversal | Medium | 2 days |
| 31 | Frontend: Add hook tests (useMessages streaming) | Medium | 1 day |
| 32 | Frontend: Add API layer tests (client.ts) | Medium | 1 day |
| 33 | Frontend: Add error scenario tests | Medium | 1 day |
| 34 | Frontend: Add accessibility tests (axe-core) | Medium | 1 day |
| 35 | Add E2E tests (Playwright or Cypress) | Medium | 2 days |
| 36 | Add application metrics (Prometheus/Grafana) | Low | 1 day |

---

## New Feature Proposals

### Feature 1: User Authentication & Multi-Tenancy
**Value:** Core requirement for any production deployment.
**Scope:**
- Sign up / sign in (email + OAuth providers)
- User-scoped conversations (each user sees only their own)
- Session management with refresh tokens
- Admin role for user management
**Tech:** NestJS Passport module + JWT, frontend auth context + protected routes

### Feature 2: Conversation Search
**Value:** Users can't find past conversations as the list grows.
**Scope:**
- Full-text search across conversation titles and message content
- MongoDB text index on messages collection
- Search UI in sidebar with highlighting
- Keyboard shortcut (Cmd/Ctrl+K) to open search
**Tech:** MongoDB `$text` index, debounced search input

### Feature 3: Message Editing & Regeneration
**Value:** Users often want to rephrase prompts or regenerate poor responses.
**Scope:**
- Edit sent messages (creates new branch in conversation)
- Regenerate last assistant response
- Fork conversation from any point
**Tech:** Message versioning in DB, branching UI

### Feature 4: Conversation Export
**Value:** Users need to share or archive conversations.
**Scope:**
- Export as Markdown, PDF, or JSON
- Copy conversation link (if sharing enabled)
- Bulk export
**Tech:** Server-side rendering with `puppeteer` for PDF, client-side Markdown generation

### Feature 5: System Prompts / Custom Instructions
**Value:** Power users want to customize AI behavior per conversation.
**Scope:**
- Per-conversation system prompt field
- Global default system prompt in settings
- System prompt templates library
**Tech:** `systemPrompt` field on Conversation schema, prepended to LLM messages

### Feature 6: Token Usage & Cost Tracking
**Value:** Users need visibility into API consumption.
**Scope:**
- Track token usage per message (prompt + completion)
- Display cost estimates per conversation
- Usage dashboard with daily/weekly/monthly breakdown
- Budget alerts
**Tech:** Parse OpenRouter response headers for token counts, aggregate in DB

### Feature 7: Streaming Response Controls
**Value:** Better control during long AI responses.
**Scope:**
- Stop generation button (abort stream)
- Copy message button
- Retry failed messages
- Thumbs up/down feedback on responses
**Tech:** `AbortController` for stop, feedback schema in DB

### Feature 8: Dark/Light Theme Toggle
**Value:** User comfort and accessibility.
**Scope:**
- Light theme variant
- System preference detection (`prefers-color-scheme`)
- Persisted preference in localStorage
- Smooth transition animation
**Tech:** MUI theme switching, CSS transitions

### Feature 9: Keyboard Shortcuts
**Value:** Power user productivity.
**Scope:**
- `Cmd+N` / `Ctrl+N` — New conversation
- `Cmd+K` / `Ctrl+K` — Search conversations
- `Cmd+Shift+S` — Toggle sidebar
- `Escape` — Stop generation
- `Up Arrow` in empty input — Edit last message
**Tech:** Global keyboard event listener, help modal

### Feature 10: Real-Time Collaboration (Future)
**Value:** Team usage of shared AI conversations.
**Scope:**
- Share conversations with other users
- Real-time presence (see who's viewing)
- Collaborative editing of system prompts
**Tech:** WebSocket with Socket.io, operational transform or CRDT

---

## UI/UX Redesign with MagicUI

> MagicUI MCP server has been configured in `.mcp.json`. Use it in Claude Code to generate MagicUI components directly.

### MagicUI Integration Opportunities

#### 1. Landing / Empty State
- **MagicUI `BlurFade`** — Animate the empty state text when no conversation is selected
- **MagicUI `AnimatedGridPattern`** — Subtle background pattern for the empty chat area
- **MagicUI `ShimmerButton`** — "New Chat" CTA button with shimmer effect
- **MagicUI `TextReveal`** — Animated welcome message

#### 2. Message Animations
- **MagicUI `BlurFadeText`** — Animate new messages appearing in the chat
- **MagicUI `TypingAnimation`** — Replace the current 3-dot typing indicator with a more polished animation
- **MagicUI `NumberTicker`** — Animate token count display

#### 3. Sidebar Enhancements
- **MagicUI `Marquee`** — Scrolling banner for announcements or tips
- **MagicUI `DockMenu`** — Bottom navigation dock for mobile view
- **MagicUI `MagicCard`** — Hover effect on conversation list items

#### 4. Visual Polish
- **MagicUI `BorderBeam`** — Animated border on the active conversation card
- **MagicUI `MeteorEffect`** — Subtle background animation during AI thinking
- **MagicUI `Particles`** — Background particle effect for the app shell
- **MagicUI `RetroGrid`** — Alternative grid background

#### 5. Interactive Elements
- **MagicUI `AnimatedButton`** — Send button with micro-animation on click
- **MagicUI `Ripple`** — Ripple effect on sidebar conversation items
- **MagicUI `CoolMode`** — Fun confetti/particle effect on message send

#### 6. Onboarding
- **MagicUI `AnimatedList`** — Animated feature list for first-time users
- **MagicUI `Globe`** — 3D globe showing available AI models/regions
- **MagicUI `WordRotate`** — Rotating prompt suggestions in the input placeholder

### Proposed UI Component Hierarchy (Redesigned)

```
App
├── ErrorBoundary
│   ├── AuthProvider
│   │   ├── ChatProvider (Context)
│   │   │   ├── Layout
│   │   │   │   ├── Sidebar
│   │   │   │   │   ├── SearchBar (Cmd+K)
│   │   │   │   │   ├── ConversationList (MagicCard items)
│   │   │   │   │   │   └── ConversationItem (BorderBeam active)
│   │   │   │   │   └── NewChatButton (ShimmerButton)
│   │   │   │   │
│   │   │   │   └── ChatArea
│   │   │   │       ├── ChatHeader (ModelSelector + ConversationSettings)
│   │   │   │       ├── MessageList (virtualized)
│   │   │   │       │   ├── MessageBubble (BlurFade entry, React.memo)
│   │   │   │       │   │   ├── MarkdownRenderer (sanitized)
│   │   │   │       │   │   ├── CodeBlock (syntax highlighted)
│   │   │   │       │   │   ├── AttachmentChips
│   │   │   │       │   │   └── MessageActions (copy, edit, regenerate, feedback)
│   │   │   │       │   └── TypingIndicator (MagicUI TypingAnimation)
│   │   │   │       │
│   │   │   │       ├── EmptyState (AnimatedGridPattern + TextReveal)
│   │   │   │       │
│   │   │   │       └── ChatInput
│   │   │   │           ├── TextArea (validated, max length)
│   │   │   │           ├── FileAttachment (validated)
│   │   │   │           ├── SendButton (AnimatedButton)
│   │   │   │           └── StopButton (visible during streaming)
│   │   │   │
│   │   │   └── KeyboardShortcutModal
│   │   │
│   │   └── ToastNotifications (error display)
│   │
│   └── FallbackErrorUI
```

---

## Appendix: File Reference

### Backend Key Files
| File | Purpose |
|------|---------|
| `backend/src/main.ts` | App bootstrap |
| `backend/src/config/configuration.ts` | Environment config |
| `backend/src/database/database.module.ts` | MongoDB connection |
| `backend/src/database/database.service.ts` | DB collections + indexes |
| `backend/src/chat/chat.controller.ts` | REST endpoints |
| `backend/src/chat/chat.service.ts` | Business logic, SSE streaming, LLM calls |
| `backend/src/chat/dto/*.ts` | Request validation DTOs |
| `backend/src/models/models.service.ts` | Hardcoded model list |

### Frontend Key Files
| File | Purpose |
|------|---------|
| `frontend/src/App.tsx` | Root component, state orchestration |
| `frontend/src/api/client.ts` | API layer (axios + fetch SSE) |
| `frontend/src/hooks/useMessages.ts` | Message state + streaming |
| `frontend/src/hooks/useConversations.ts` | Conversation CRUD state |
| `frontend/src/hooks/useModels.ts` | Model list state |
| `frontend/src/components/Chat/ChatInput.tsx` | Message input + attachments |
| `frontend/src/components/Chat/MessageBubble.tsx` | Message display + markdown |
| `frontend/src/components/Chat/MessageList.tsx` | Scrollable message container |
| `frontend/src/components/Layout.tsx` | Responsive sidebar/chat layout |
| `frontend/src/theme.ts` | MUI dark theme config |
| `frontend/src/types/index.ts` | Shared TypeScript interfaces |
