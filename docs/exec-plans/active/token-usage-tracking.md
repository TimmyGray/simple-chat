# FEAT-6: Token Usage & Cost Tracking

## Task Description
Track token usage per user and per message for future pricing plans. Store cumulative token counts on user documents, per-message tokens on message documents, and display usage in the sidebar.

## Acceptance Criteria
- [ ] Backend extracts token usage from OpenRouter streaming responses
- [ ] Per-message token usage saved on assistant messages
- [ ] Cumulative token usage tracked on user documents
- [ ] Profile endpoint returns token usage data
- [ ] Frontend displays cumulative token usage in sidebar
- [ ] i18n: All strings in 4 locales
- [ ] Tests updated for new behavior
- [ ] All validation passes (lint, typecheck, test, build)

## Implementation Phases

### Phase 1: Backend Data Model
- Update `UserDoc` with `totalTokensUsed`, `totalPromptTokens`, `totalCompletionTokens`
- Update `MessageDoc` with optional `promptTokens`, `completionTokens`, `totalTokens`
- Update MongoDB JSON schemas for both collections
- Initialize token fields to 0 on user registration

### Phase 2: Backend Token Extraction
- Add `stream_options: { include_usage: true }` to OpenAI streaming request
- Capture `chunk.usage` from final stream chunk
- Save per-message tokens on assistant message document
- Atomically increment user token totals via `$inc`
- Include usage in `done` StreamEvent

### Phase 3: Backend API
- Update `AuthUser` interface with token fields
- Update `AuthService.validateUser()` to include token fields in projection
- Profile endpoint automatically returns token data via `req.user`

### Phase 4: Frontend Display
- Update `User` type with token fields
- Add `refreshUser` to `useAuth` hook
- Combine conversation refresh + user refresh after streaming
- Display token usage in Sidebar below user email
- i18n: Add `sidebar.tokensUsed` string to all 4 locales

### Phase 5: Tests
- Update `chat.service.spec.ts` for token extraction & user update
- Update `database.schemas.spec.ts` for new schema fields
- Update `chat.controller.spec.ts` for usage in SSE

## Decision Log
- **Token source**: `stream_options: { include_usage: true }` — OpenAI SDK standard, works with OpenRouter
- **User token refresh**: Piggyback on existing `onConversationUpdate` callback to refresh profile, avoiding new prop drilling
- **SSE protocol**: Send usage as separate `{ usage: {...} }` event before `[DONE]` — backward compatible
- **Schema migration**: Fields optional (not required), so existing users unaffected. `$inc` creates field if missing.

## Files to Modify
- `backend/src/types/documents.ts`
- `backend/src/database/database.schemas.ts`
- `backend/src/chat/interfaces/stream-event.interface.ts`
- `backend/src/chat/chat.service.ts`
- `backend/src/chat/chat.controller.ts`
- `backend/src/auth/interfaces/auth-user.interface.ts`
- `backend/src/auth/auth.service.ts`
- `frontend/src/types/index.ts`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/App.tsx`
- `frontend/src/components/Layout.tsx`
- `frontend/src/components/Sidebar/Sidebar.tsx`
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/ru.json`
- `frontend/src/i18n/locales/zh.json`
- `frontend/src/i18n/locales/es.json`
- `backend/src/chat/chat.service.spec.ts`
- `backend/src/chat/chat.controller.spec.ts`
- `backend/src/database/database.schemas.spec.ts`
