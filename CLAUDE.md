# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack chat application with an LLM-powered backend (via OpenRouter API) and a React frontend. Users can create conversations, send messages with file attachments, and receive streamed AI responses.

## Commands

### Development
```bash
npm run dev              # Start both backend and frontend concurrently
npm run dev:backend      # Backend only (NestJS watch mode, port 3001)
npm run dev:frontend     # Frontend only (Vite dev server, port 5173)
```

### Testing
```bash
npm test                           # Run all tests (backend + frontend)
npm run test:backend               # Backend tests (vitest)
npm run test:frontend              # Frontend tests (vitest + jsdom)
cd backend && npx vitest run src/chat/chat.service.spec.ts  # Single backend test
cd frontend && npx vitest run src/__tests__/ChatInput.test.tsx  # Single frontend test
```

### Build & Lint
```bash
npm run build                      # Build both
cd backend && npm run lint         # ESLint backend
cd frontend && npm run lint        # ESLint frontend
cd backend && npm run format       # Prettier backend
```

## Architecture

### Monorepo Structure
- **Root `package.json`** — orchestrates both apps via `concurrently`
- **`backend/`** — NestJS (TypeScript, SWC compiler)
- **`frontend/`** — React 19 + Vite + MUI 7

### Backend (NestJS)

Two modules under `backend/src/`:

- **ChatModule** (`chat/`) — core functionality: conversations CRUD, message sending with SSE streaming, file attachment handling
- **ModelsModule** (`models/`) — serves a hardcoded list of available LLM models

Key patterns:
- LLM calls use the **OpenAI SDK** pointed at OpenRouter's base URL (`openrouter.apiKey`, `openrouter.baseUrl` from config)
- Message streaming uses **Server-Sent Events (SSE)** — the controller passes the Express `Response` object directly to the service, which writes `data:` chunks and ends with `data: [DONE]`
- File uploads go to `./uploads/` via Multer (max 5 files, 10MB each). Text/PDF content is extracted and appended to user messages for the LLM context
- MongoDB via Mongoose with two collections: `Conversation` (title, model) and `Message` (conversationId, role, content, attachments)
- Validation uses `class-validator` DTOs with a global `ValidationPipe({ whitelist: true, transform: true })`
- Tests use **Vitest** with SWC (`unplugin-swc`), test files are `*.spec.ts`

### Frontend (React + Vite)

- **State management**: custom hooks (`useConversations`, `useMessages`, `useModels`) — no external state library
- **API layer**: `src/api/client.ts` — axios for REST, native `fetch` with `ReadableStream` for SSE streaming
- **Components**: `Layout` (responsive sidebar/chat split), `Sidebar/` (conversation list), `Chat/` (message area, input, model selector, file attachments)
- **UI framework**: MUI 7 with custom dark theme (`src/theme.ts`)
- **Markdown rendering**: `react-markdown` + `react-syntax-highlighter` in MessageBubble
- Tests use **Vitest + jsdom + React Testing Library**, test files are in `src/__tests__/`

### Environment Variables

Configured in `backend/.env` (see `backend/.env.example`):
- `OPENROUTER_API_KEY` — required for LLM calls
- `LLM_URL_KEY` — base URL override (defaults to OpenRouter)
- `MONGODB_URI` — defaults to `mongodb://localhost:27017/simple-chat`
- `PORT` — backend port (default 3001)
- Frontend: `VITE_API_URL` — backend API base URL (default `http://localhost:3001/api`)

## API Endpoints

All under `/api`:
- `GET/POST /conversations`, `PATCH/DELETE /conversations/:id`
- `GET /conversations/:id/messages`, `POST /conversations/:id/messages` (SSE stream)
- `POST /upload` (multipart form, field name: `files`)
- `GET /models`
