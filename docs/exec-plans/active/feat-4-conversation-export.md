# FEAT-4: Conversation Export (Markdown/PDF/JSON)

## Task Description
Add ability to export conversations in three formats: Markdown, PDF, and JSON.
Users should be able to download their conversation history for data portability.

## Acceptance Criteria
- Export button accessible from conversation view (ChatArea header)
- Three format options: Markdown (.md), PDF (.pdf), JSON (.json)
- Exports include: conversation title, model, messages with roles and timestamps
- PDF includes basic formatting (headers, message blocks, timestamps)
- JSON includes full metadata (token usage, attachments info)
- All user-facing strings use t() with 4 locales
- Backend generates files, frontend triggers download
- JWT-protected endpoints with userId scoping

## Implementation Phases

### Phase 1: Backend Export Service + Endpoint (~0.5d)
- Create `ExportService` in chat module (no new module needed — export is a chat concern)
- Add `GET /api/conversations/:id/export?format=markdown|pdf|json` endpoint
- Markdown format: render messages as `## User\n{content}\n\n## Assistant\n{content}`
- JSON format: full conversation + messages dump with metadata
- PDF format: use `pdfkit` library for clean PDF generation
- **Decision**: Single endpoint with `format` query param (simpler than 3 endpoints)

### Phase 2: Frontend Export UI + Download Logic (~0.5d)
- Add export button/menu in ChatArea header area
- Menu with 3 format options (Markdown, PDF, JSON)
- Download via blob URL pattern (fetch → blob → download link click)
- Add `exportConversation(id, format)` to API client
- Loading state during export generation

### Phase 3: i18n + Tests (~0.5d)
- Add i18n keys for export labels in all 4 locales
- Backend unit test for ExportService
- Frontend test for export button rendering

## Files to Create/Modify

### Backend (create)
- `backend/src/chat/export.service.ts` — export logic
- `backend/src/chat/dto/export-conversation.dto.ts` — query validation

### Backend (modify)
- `backend/src/chat/chat.controller.ts` — add export endpoint
- `backend/src/chat/chat.module.ts` — register ExportService

### Frontend (create)
- `frontend/src/components/Chat/ExportMenu.tsx` — export button + format menu

### Frontend (modify)
- `frontend/src/api/client.ts` — add exportConversation function
- `frontend/src/components/Chat/ChatArea.tsx` — add export button to header
- `frontend/src/i18n/locales/en.json` — export strings
- `frontend/src/i18n/locales/ru.json` — export strings
- `frontend/src/i18n/locales/zh.json` — export strings
- `frontend/src/i18n/locales/es.json` — export strings

## Decision Log
- Export endpoint in chat module (not a separate module) — follows existing patterns
- Single endpoint with format query param — simpler API surface
- Backend generates files (not frontend) — supports PDF which needs server-side library
- pdfkit for PDF — lightweight, no headless browser needed
- Export button in ChatArea header — discoverable, contextual

## Risks
- PDF generation adds a new dependency (pdfkit)
- Large conversations may produce large exports — consider streaming for huge chats
