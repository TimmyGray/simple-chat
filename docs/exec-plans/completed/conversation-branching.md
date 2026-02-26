# FEAT-12: Conversation Branching

## Task Description
Fork conversations from any message to explore alternative paths.

## Acceptance Criteria
- User can fork a conversation from any message (user or assistant)
- Fork creates a new conversation with messages copied up to the fork point
- New conversation shows "Forked from..." indicator
- Sidebar shows fork icon on forked conversations
- i18n support for all 4 locales

## Approach: Fork-as-Copy
When a user forks from a message, create a new conversation that copies messages up to (and including) the fork point. Store a `forkedFrom` reference on the new conversation.

**Chose fork-as-copy over tree-based history because:**
- Works with existing linear message model (no schema migration)
- Much simpler to implement and reason about
- Message data is small text — duplication cost is negligible
- Avoids complex branch navigation UI

## Implementation Phases

### Phase 1: Backend (data model + endpoint)
- [x] Add `forkedFrom` to ConversationDoc and DB schema
- [x] Add `forkConversation()` to ChatService
- [x] Add `POST /api/conversations/:id/fork/:messageId` endpoint
- [x] Add backend test

### Phase 2: Frontend (API + hook + context)
- [x] Add `forkedFrom` to Conversation interface
- [x] Add `forkConversation()` to API client
- [x] Add `fork()` to useConversations hook
- [x] Add `forkConversation` to ChatAppContext

### Phase 3: Frontend (UI)
- [x] Add fork button to MessageActions
- [x] Wire fork through MessageBubble → MessageList → ChatArea
- [x] Show fork indicator in ConversationItem
- [x] Add i18n strings (en, ru, zh, es)

## Files to Create/Modify
- `backend/src/types/documents.ts` (modify)
- `backend/src/database/database.schemas.ts` (modify)
- `backend/src/chat/chat.service.ts` (modify)
- `backend/src/chat/chat.controller.ts` (modify)
- `backend/src/chat/chat.service.spec.ts` (modify)
- `frontend/src/types/index.ts` (modify)
- `frontend/src/api/client.ts` (modify)
- `frontend/src/hooks/useConversations.ts` (modify)
- `frontend/src/contexts/ChatAppContext.tsx` (modify)
- `frontend/src/components/ChatApp.tsx` (modify)
- `frontend/src/components/Chat/MessageActions.tsx` (modify)
- `frontend/src/components/Chat/MessageBubble.tsx` (modify)
- `frontend/src/components/Chat/MessageList.tsx` (modify)
- `frontend/src/components/Chat/ChatArea.tsx` (modify)
- `frontend/src/components/Sidebar/ConversationItem.tsx` (modify)
- `frontend/src/i18n/locales/en.json` (modify)
- `frontend/src/i18n/locales/ru.json` (modify)
- `frontend/src/i18n/locales/zh.json` (modify)
- `frontend/src/i18n/locales/es.json` (modify)

## Decision Log
- Fork-as-copy over tree model: simpler, works with linear messages, negligible data cost
