# FEAT-10a: Backend WebSocket Gateway

## Task Description
Add a Socket.IO-based WebSocket gateway to the NestJS backend for real-time communication between clients viewing the same conversation.

## Acceptance Criteria
- [ ] Socket.IO gateway authenticates connections via JWT (same token as REST API)
- [ ] Clients can join/leave conversation rooms
- [ ] New messages are broadcast to all clients in the same conversation room (except sender)
- [ ] Typing indicator events are broadcast within conversation rooms
- [ ] Gateway handles disconnection gracefully (leave rooms, clean up)
- [ ] Tests cover authentication, room management, and event broadcasting
- [ ] Architecture tests updated to allow chat/ gateway patterns
- [ ] No cross-module import violations

## Implementation Phases

### Phase 1: Dependencies & Gateway Shell (~30 min)
- Install `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`
- Create `chat.gateway.ts` with basic `@WebSocketGateway` decorator
- Add gateway to `ChatModule` providers
- Configure CORS for WebSocket connections

### Phase 2: JWT Authentication (~45 min)
- Create `WsJwtGuard` or use Socket.IO middleware for JWT validation
- Extract token from handshake `auth` field or query parameter
- Validate JWT and attach user to socket
- Reject unauthenticated connections

### Phase 3: Room Management (~30 min)
- `joinConversation` event: client joins a conversation room (with ownership check)
- `leaveConversation` event: client leaves a conversation room
- Auto-leave all rooms on disconnect
- Track connected users per room for presence

### Phase 4: Event Broadcasting (~45 min)
- Hook into ChatService: after message save, emit `message:created` to room
- After message edit, emit `message:updated` to room
- After message delete, emit `message:deleted` to room
- Typing indicator: `typing:start` / `typing:stop` events

### Phase 5: Tests (~45 min)
- Unit tests for gateway (mock socket, mock services)
- Test JWT authentication (valid/invalid/missing token)
- Test room join/leave
- Test event broadcasting

## Files to Create/Modify
- `backend/package.json` — add dependencies
- `backend/src/chat/chat.gateway.ts` — NEW: WebSocket gateway
- `backend/src/chat/chat.gateway.spec.ts` — NEW: gateway tests
- `backend/src/chat/chat.module.ts` — add gateway provider
- `backend/src/chat/chat.service.ts` — emit events after mutations
- `backend/src/chat/interfaces/ws-events.interface.ts` — NEW: WebSocket event types
- `backend/src/main.ts` — configure Socket.IO adapter if needed
- `backend/src/config/env.validation.ts` — no changes expected
- `backend/src/architecture.spec.ts` — update module boundary rules if needed
- `docs/generated/db-schema.md` — no DB changes for this subtask

## Decision Log
- **Socket.IO over native WS**: Socket.IO provides rooms, auto-reconnection, fallback transports, and NestJS has first-class support via `@nestjs/platform-socket.io`
- **JWT in handshake**: Standard Socket.IO pattern — token passed in `auth` field during connection, validated once at handshake (not per-message)
- **Room = conversation ID**: One room per conversation. Clients join when viewing, leave when switching
- **Service emits via gateway**: ChatService injects ChatGateway and calls emit methods after mutations. This keeps the controller layer clean.

## Risks
- Socket.IO adds ~50KB to backend bundle — acceptable for real-time features
- Throttler may need WebSocket-specific configuration (NestJS throttler supports WS)
- Architecture tests may need updates to allow gateway patterns
