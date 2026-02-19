# Simple Chat

A self-hosted, privacy-first AI chat application. Connect to any OpenRouter-compatible model provider while keeping all your data local.

Unlike cloud-hosted alternatives (ChatGPT, Claude.ai), Simple Chat gives you full control over your data, your models, and your infrastructure.

## Features

- **Multi-model support** — Switch between LLM models per conversation. Free models pre-configured out of the box
- **Real-time streaming** — Server-Sent Events for token-by-token response streaming
- **File attachments** — Upload and process PDF, text, markdown, CSV, and image files in conversations
- **Conversation management** — Create, rename, delete conversations with auto-generated titles
- **JWT authentication** — Secure user registration and login with per-user conversation isolation
- **Internationalization** — English, Russian, Chinese (Simplified), and Spanish
- **Responsive design** — Dark-themed UI that works on desktop and mobile
- **Markdown rendering** — Full GitHub-flavored Markdown with syntax-highlighted code blocks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, MUI 7, TypeScript |
| Backend | NestJS 11, TypeScript 5.7, SWC |
| Database | MongoDB 7 (native driver) |
| LLM Integration | OpenAI SDK via OpenRouter |
| Auth | JWT + bcrypt |
| Testing | Vitest, React Testing Library |
| CI/CD | GitHub Actions |

## Prerequisites

- **Node.js** 22+
- **MongoDB** 7+ (running locally or remote)
- **OpenRouter API key** — get one free at [openrouter.ai/keys](https://openrouter.ai/keys)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/simple-chat.git
cd simple-chat
```

### 2. Install dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set the required variables:

```env
OPENROUTER_API_KEY=sk-or-...    # Required — your OpenRouter API key
JWT_SECRET=your-secret-key       # Required — secret for signing JWT tokens
MONGODB_URI=mongodb://localhost:27017/simple-chat  # Default shown
```

### 4. Start the application

```bash
npm run dev
```

This starts both services concurrently:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | — | API key for OpenRouter LLM calls |
| `JWT_SECRET` | Yes | — | Secret key for JWT token signing |
| `MONGODB_URI` | No | `mongodb://localhost:27017/simple-chat` | MongoDB connection string |
| `PORT` | No | `3001` | Backend HTTP port |
| `JWT_EXPIRATION_SECONDS` | No | `900` | JWT token TTL in seconds |
| `LLM_URL_KEY` | No | `https://openrouter.ai/api/v1` | Override LLM base URL |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |
| `UPLOAD_TTL_HOURS` | No | `24` | Hours before uploaded files are cleaned up |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `NODE_ENV` | No | `development` | Environment mode |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API base URL |

## Available Models

Pre-configured models accessible through the model selector:

| Model | Free | Context Window | Vision |
|-------|------|---------------|--------|
| Free Models Router | Yes | 128K | Yes |
| GPT-OSS 120B | Yes | 128K | No |
| Qwen3 Coder 480B | Yes | 65K | No |
| Nemotron Nano 12B VL | Yes | 32K | Yes |
| Gemma 3n 2B | Yes | 32K | No |
| Auto (Smart Routing) | No | 128K | Yes |

All free-tier models work without any OpenRouter credits.

## Project Structure

```
simple-chat/
├── package.json              # Root orchestrator
├── backend/                  # NestJS API server
│   ├── src/
│   │   ├── auth/             # JWT authentication (register, login, guards)
│   │   ├── chat/             # Conversations, messages, LLM streaming
│   │   ├── config/           # Configuration + Joi env validation
│   │   ├── database/         # MongoDB native driver (global module)
│   │   ├── models/           # LLM model catalog
│   │   ├── health/           # Health check endpoint
│   │   ├── uploads/          # File upload + cron cleanup
│   │   └── common/           # Exception filter, correlation IDs, pipes
│   └── uploads/              # File upload storage (disk)
└── frontend/                 # React SPA
    └── src/
        ├── api/              # HTTP client (axios + fetch SSE)
        ├── components/       # UI components
        ├── hooks/            # Custom React hooks
        ├── i18n/             # 4-language translations
        ├── types/            # TypeScript interfaces
        └── theme.ts          # MUI dark theme
```

## Scripts

### Development

```bash
npm run dev              # Start both backend and frontend
npm run dev:backend      # Backend only (NestJS watch mode, port 3001)
npm run dev:frontend     # Frontend only (Vite dev server, port 5173)
```

### Testing

```bash
npm test                 # Run all tests
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only
```

### Validation

```bash
npm run lint             # ESLint check (backend + frontend)
npm run typecheck        # TypeScript check (backend + frontend)
npm run build            # Production build (backend + frontend)
npm run validate         # lint + typecheck + test + build (full CI pipeline)
```

## API Reference

All routes are prefixed with `/api`. Endpoints marked with a lock require `Authorization: Bearer <token>`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/profile` | Get current user profile |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations` | List user's conversations |
| POST | `/conversations` | Create a new conversation |
| PATCH | `/conversations/:id` | Update title or model |
| DELETE | `/conversations/:id` | Delete conversation and its messages |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations/:id/messages` | List messages in a conversation |
| POST | `/conversations/:id/messages` | Send message and stream LLM response (SSE) |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload files (max 5 files, 10MB each) |
| GET | `/models` | List available LLM models |
| GET | `/api/health` | Health check (no auth required) |

### Rate Limits

| Scope | Limit |
|-------|-------|
| General endpoints | 60 requests/min |
| Message streaming | 10 requests/min |
| File uploads | 20 requests/min |

## Architecture

### Data Flow (Streaming)

```
Frontend                     Backend                       OpenRouter
   │                                                            │
   │  POST /conversations/:id/messages                          │
   │ ──────────────────────────────────>                        │
   │                             Validate & save user message   │
   │                             Build LLM context              │
   │                             stream: true ─────────────────>│
   │  data: {"content":"chunk"}  <──────────── streaming ───────│
   │  data: {"content":"chunk"}  <──────────── streaming ───────│
   │  data: [DONE]               Save assistant message         │
   │ <──────────────────────────────────                        │
```

- 5-minute server-side stream timeout
- Client disconnect detection with immediate LLM stream abort
- File content extracted from uploads (PDF, text, CSV) and injected into LLM context

### Database Collections

| Collection | Key Fields | Indexes |
|------------|-----------|---------|
| `users` | `email` (unique), `password` (bcrypt) | `email: 1` |
| `conversations` | `userId`, `title`, `model` | `(userId: 1, updatedAt: -1)` |
| `messages` | `conversationId`, `role`, `content`, `attachments` | `(conversationId: 1, createdAt: 1)` |

## Security

- **Authentication:** JWT tokens with configurable expiration
- **Password storage:** bcrypt with 12 salt rounds
- **Authorization:** All conversations scoped to the authenticated user's `userId`
- **Input validation:** class-validator DTOs with whitelist mode (unknown properties stripped)
- **File uploads:** MIME type whitelist, 10MB size limit, path traversal protection
- **XSS prevention:** `rehype-sanitize` on all rendered Markdown
- **CORS:** Configurable allowed origin
- **Fail-fast startup:** Joi schema validates all required environment variables at boot

## Contributing

### Branch Naming

```
feat/<description>    # New features
fix/<description>     # Bug fixes
chore/<description>   # Maintenance tasks
```

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run the full validation suite: `npm run validate`
4. Open a pull request against `main`

### PR Checklist

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linting passes
- [ ] Build succeeds
- [ ] New code has tests
- [ ] No hardcoded user-facing strings (use `t()` for i18n)
- [ ] No secrets committed to code
- [ ] Documentation updated if needed

### Adding Translations

All user-facing strings use `react-i18next`. Translation files are located in `frontend/src/i18n/locales/`:

```
locales/
├── en.json   # English (primary)
├── ru.json   # Russian
├── zh.json   # Chinese (Simplified)
└── es.json   # Spanish
```

When adding new strings, update all four locale files.

## Observability

- **Structured logging:** Pino — JSON format in production, pretty-print in development
- **Correlation IDs:** UUID assigned to every request and propagated through all log entries
- **Health endpoint:** `GET /api/health` returns MongoDB connectivity status (200 OK / 503 degraded)
- **Error responses:** Structured JSON with `statusCode`, `timestamp`, `path`, `method`, `correlationId`, `message`
- **React ErrorBoundary:** Catches render errors and shows a recovery UI

## License

This project is private. All rights reserved.
