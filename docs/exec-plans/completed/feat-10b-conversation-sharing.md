# FEAT-10b: Conversation Sharing Model

## Task
Add participants field to conversations, invite/revoke endpoints, shared conversation queries, and access control.

## Acceptance Criteria
- Conversations have an optional `participants` array with `userId`, `role` (viewer/editor), `addedAt`
- Owner can invite participants by email
- Owner can revoke participant access
- Participants can list conversations shared with them
- Editors can send messages; viewers are read-only
- WebSocket gateway allows participants into conversation rooms
- All existing owner-only operations remain owner-only (delete, update title/model)

## Implementation Plan

### Phase 1: Data Model
- Add `ParticipantRef` interface to `types/documents.ts`
- Add `participants` to `ConversationDoc`
- Update MongoDB JSON schema in `database.schemas.ts`
- Add `participants.userId` index in `database.service.ts`

### Phase 2: Sharing Service
- Create `chat/sharing.service.ts` with:
  - `inviteParticipant(conversationId, ownerUserId, targetEmail, role)`
  - `revokeParticipant(conversationId, ownerUserId, targetUserId)`
  - `getParticipants(conversationId, userId)`
  - `findAccessibleConversation(conversationId, userId)` — returns conversation if user is owner OR participant
  - `getSharedConversations(userId)` — returns conversations where user is a participant
  - `hasAccess(conversationId, userId, requiredRole?)` — role-based check

### Phase 3: Controller Endpoints
- `POST /api/conversations/:id/participants` — invite (owner only)
- `DELETE /api/conversations/:id/participants/:userId` — revoke (owner only)
- `GET /api/conversations/:id/participants` — list (owner or participant)
- `GET /api/conversations/shared` — shared conversations for current user

### Phase 4: Access Control Integration
- Update `ChatService.getConversation` → use `SharingService.findAccessibleConversation`
- Update `ChatService.getMessages` → allow participants
- Update `ChatService.sendMessageAndStream` → allow editors
- Keep owner-only: `updateConversation`, `deleteConversation`
- Update `ChatGateway.handleJoinConversation` → allow participants

### Phase 5: Tests + Validation

## Decision Log
- Chose participants array (not separate collection) — embedded for simplicity, fits MongoDB document model, max ~50 participants per conversation
- Invite by email (not userId) — UX-friendly, service resolves email → userId
- Viewer/editor roles only (not admin) — KISS for v1, owner is implicit admin
- SharingService lives inside chat module (not separate module) — shares same bounded context
