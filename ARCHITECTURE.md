# Architecture

## System Overview

A full-stack chat application with an LLM-powered backend (via OpenRouter API) and a React frontend. Users can create conversations, send messages with file attachments, and receive streamed AI responses. The backend proxies LLM calls through the OpenAI SDK pointed at OpenRouter, streaming tokens back to the client via Server-Sent Events (SSE).

## Monorepo Structure

```
simple-chat/
├── package.json              # Root orchestrator (concurrently, husky, lint-staged)
├── backend/                  # NestJS 11 (TypeScript, SWC compiler)
│   ├── src/
│   │   ├── main.ts           # Bootstrap: filters, pipes, CORS, logger
│   │   ├── app.module.ts     # Root module wiring
│   │   ├── auth/             # Authentication: register, login, JWT, guards
│   │   ├── config/           # Configuration + Joi env validation
│   │   ├── database/         # MongoDB native driver (global module)
│   │   ├── chat/             # Core: conversations, messages, LLM streaming
│   │   ├── models/           # LLM model catalog (fetched from OpenRouter)
│   │   ├── health/           # Health check with MongoDB indicator
│   │   ├── uploads/          # Cron-based upload cleanup
│   │   ├── types/            # Shared document interfaces (ConversationDoc, MessageDoc, UserDoc)
│   │   └── common/           # Shared: exception filter, correlation ID middleware, pipes, utils (getErrorMessage)
│   └── uploads/              # File upload storage (disk)
└── frontend/                 # React 19 + Vite 7 + MUI 7
    └── src/
        ├── main.tsx          # Entry point
        ├── App.tsx           # Root component (theme, error boundary, snackbar)
        ├── api/              # HTTP client (axios + fetch SSE)
        ├── components/       # UI components (Layout, Sidebar, Chat, common)
        ├── contexts/         # React Context providers (ChatAppContext, ModelContext)
        ├── hooks/            # Custom state hooks
        ├── i18n/             # Internationalization (4 languages)
        ├── types/            # TypeScript interfaces
        ├── utils/            # Shared utilities (getErrorMessage)
        └── theme.ts          # MUI dark theme
```

The root `package.json` uses `concurrently` to run both apps in parallel during development. Husky and lint-staged enforce pre-commit linting and formatting.

---

## Backend Architecture (NestJS)

### Module Graph

```
AppModule
├── ConfigModule.forRoot (global)
│   └── Joi env validation schema
├── LoggerModule (nestjs-pino)
│   └── pino-pretty in dev, structured JSON in prod
├── ThrottlerModule (60 req/min default)
│   └── ThrottlerGuard (APP_GUARD)
├── ScheduleModule
├── DatabaseModule (global)
│   ├── MONGO_CLIENT provider → MongoClient
│   ├── DATABASE_CONNECTION provider → Db
│   └── DatabaseService (collection accessors + index creation)
├── AuthModule
│   ├── AuthController (register, login, profile)
│   ├── AuthService (JWT issuance, bcrypt password hashing)
│   ├── JwtStrategy (token validation, user lookup)
│   ├── JwtAuthGuard (route protection)
│   └── AdminGuard (admin-only route protection)
├── ChatModule (imports AuthModule, McpModule)
│   ├── ChatController (REST + SSE endpoints, JWT-protected)
│   ├── ChatGateway (Socket.IO WebSocket gateway, JWT auth, room-based conversations)
│   ├── ChatService (conversations CRUD, userId-scoped)
│   ├── ChatBroadcastService (WebSocket event broadcasting for real-time sync)
│   ├── LlmStreamService (LLM streaming via OpenAI SDK + OpenRouter, MCP tool-use loop)
│   ├── SearchService (full-text conversation/message search)
│   ├── ExportService (conversation export: Markdown, JSON, PDF)
│   └── FileExtractionService (PDF/text/CSV file content extraction)
├── ModelsModule
│   ├── ModelsController (GET /api/models)
│   ├── ModelsService (fetches from OpenRouter, hourly refresh, fallback defaults)
│   └── OllamaService (auto-detects Ollama, fetches local models, hourly refresh)
├── TemplatesModule (imports AuthModule)
│   ├── TemplatesController (CRUD endpoints, admin-protected writes)
│   └── TemplatesService (template CRUD, seed defaults on startup)
├── McpModule (imports AuthModule)
│   ├── McpController (CRUD for MCP server configs, admin-protected writes)
│   └── McpService (lifecycle management, tool discovery, tool execution, 30s timeout)
├── HealthModule
│   ├── HealthController (GET /api/health)
│   └── MongoHealthIndicator (ping check)
└── UploadsModule
    └── UploadsCleanupService (@Cron EVERY_HOUR)
```

Global middleware applied to all routes:
- **CorrelationIdMiddleware** -- assigns or validates a UUID `x-correlation-id` header on every request/response.

Global providers set in `main.ts` and `app.module.ts`:
- **AllExceptionsFilter** -- catches all unhandled exceptions, logs with correlation ID, returns structured JSON errors.
- **ValidationPipe** -- `whitelist: true, transform: true` using class-validator DTOs.
- **TransformResponseInterceptor** -- wraps all responses in `{ data: T }` envelope (APP_INTERCEPTOR).

### Data Flow (Message Sending)

```
Frontend                          Backend                           OpenRouter
   │                                │                                  │
   │  POST /api/conversations/:id/messages                             │
   │  { content, model, attachments }                                  │
   │ ──────────────────────────────>│                                  │
   │                                │  1. Validate DTO (SendMessageDto)│
   │                                │  2. Verify conversation exists   │
   │                                │  3. Save user message to MongoDB │
   │                                │  4. Auto-title if first message  │
   │                                │  5. Build LLM message history    │
   │                                │     (extract file contents)      │
   │                                │  6. Set SSE headers              │
   │                                │  7. openai.chat.completions.create({ stream: true })
   │                                │ ────────────────────────────────>│
   │                                │                                  │
   │  data: {"content":"chunk..."}  │  <── streaming chunks ──────────│
   │ <──────────────────────────────│                                  │
   │  data: {"content":"chunk..."}  │  <── streaming chunks ──────────│
   │ <──────────────────────────────│                                  │
   │                                │  8. Save assistant message       │
   │  data: [DONE]                  │                                  │
   │ <──────────────────────────────│                                  │
```

Key behaviors:
- Client disconnect detection via `AbortController` in the controller -- signals the service to abort the LLM stream.
- 5-minute stream timeout in the controller -- sends an error event and closes the connection.
- File content extraction supports `.txt`, `.md`, `.csv` (read as UTF-8) and `.pdf` (via `pdf-parse`). Binary files are passed as `[Binary file: name]` placeholders.
- Path traversal protection: file paths are reconstructed from `path.basename()` only, with a defense-in-depth resolved path check against the uploads directory.

### Database (MongoDB Native Driver)

The project uses the **MongoDB native driver** (not Mongoose). `DatabaseModule` is a global module that provides a `MongoClient` and `Db` instance via custom providers.

#### Collections

**conversations**
| Field       | Type     | Description                      |
|-------------|----------|----------------------------------|
| `_id`       | ObjectId | Primary key                      |
| `userId`    | ObjectId | Owner (reference to users._id)   |
| `title`     | string   | Display name (auto-set from first message) |
| `model`     | string   | Default LLM model ID             |
| `templateId`| ObjectId (optional) | Reference to templates._id (system prompt template) |
| `forkedFrom`| object (optional) | Fork origin: `{ conversationId: ObjectId, messageId: ObjectId }` |
| `createdAt` | Date     | Creation timestamp               |
| `updatedAt` | Date     | Last modification timestamp      |

**messages**
| Field              | Type                           | Description                    |
|--------------------|--------------------------------|--------------------------------|
| `_id`              | ObjectId                       | Primary key                    |
| `conversationId`   | ObjectId                       | Foreign key to conversations   |
| `role`             | `'user'` \| `'assistant'`      | Message author                 |
| `content`          | string                         | Message text                   |
| `model`            | string (optional)              | Model used (assistant messages)|
| `isEdited`         | boolean (optional)             | Whether message has been edited |
| `idempotencyKey`   | string (optional)              | Client UUID for dedup (user messages) |
| `attachments`      | `AttachmentDoc[]`              | File metadata array            |
| `promptTokens`     | number (optional)              | LLM prompt tokens consumed (assistant messages) |
| `completionTokens` | number (optional)              | LLM completion tokens consumed (assistant messages) |
| `totalTokens`      | number (optional)              | Total tokens consumed (assistant messages) |
| `createdAt`        | Date                           | Creation timestamp             |
| `updatedAt`        | Date                           | Last modification timestamp    |

**AttachmentDoc** shape: `{ fileName, fileType, filePath, fileSize }`

**users**
| Field                   | Type     | Description                              |
|-------------------------|----------|------------------------------------------|
| `_id`                   | ObjectId | Primary key                              |
| `email`                 | string   | User email (unique)                      |
| `password`              | string   | bcrypt-hashed password                   |
| `isAdmin`               | boolean  | Admin flag (default: false)              |
| `totalTokensUsed`       | number   | Cumulative total tokens consumed         |
| `totalPromptTokens`     | number   | Cumulative prompt tokens consumed        |
| `totalCompletionTokens` | number   | Cumulative completion tokens consumed    |
| `createdAt`             | Date     | Creation timestamp                       |
| `updatedAt`             | Date     | Last modification timestamp              |

**mcpServers**
| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| `_id`       | ObjectId | Primary key                              |
| `name`      | string   | Display name for the MCP server          |
| `command`   | string   | Executable command to launch the server  |
| `args`      | string[] | Command-line arguments                   |
| `env`       | Record<string, string> (optional) | Environment variables for the server process |
| `enabled`   | boolean  | Whether to auto-connect on startup       |
| `createdAt` | Date     | Creation timestamp                       |
| `updatedAt` | Date     | Last modification timestamp              |

#### Indexes

Created programmatically in `DatabaseService.onModuleInit()`:
- `messages(conversationId: 1, createdAt: 1)` -- optimizes message history queries sorted by time.
- `messages(conversationId: 1)` -- optimizes message count and delete operations.
- `messages(idempotencyKey: 1)` unique, sparse -- prevents duplicate message creation.
- `conversations(userId: 1, updatedAt: -1)` -- optimizes user-scoped conversation listing.
- `users(email: 1)` unique -- fast lookup by email, enforces uniqueness.

### API Endpoints

All routes are prefixed with `/api`.

| Method   | Path                                | Throttle     | Auth     | Description                              |
|----------|-------------------------------------|--------------|----------|------------------------------------------|
| `POST`   | `/auth/register`                    | **5/min**    | No       | Register a new user                      |
| `POST`   | `/auth/login`                       | **10/min**   | No       | Login and receive JWT token              |
| `GET`    | `/auth/profile`                     | 60/min       | JWT      | Get current user profile                 |
| `GET`    | `/conversations`                    | 60/min       | JWT      | List all conversations (sorted by updatedAt desc) |
| `POST`   | `/conversations`                    | 60/min       | JWT      | Create a new conversation                |
| `PATCH`  | `/conversations/:id`                | 60/min       | JWT      | Update conversation (title, model)       |
| `DELETE` | `/conversations/:id`                | 60/min       | JWT      | Delete conversation and all its messages  |
| `GET`    | `/conversations/:id/messages`       | 60/min       | JWT      | List messages for a conversation (sorted by createdAt asc) |
| `POST`   | `/conversations/:id/messages`       | **10/min**   | JWT      | Send message + stream LLM response (SSE) |
| `POST`   | `/conversations/:id/messages/:msgId/edit` | **10/min** | JWT   | Edit message + re-stream LLM response (SSE) |
| `POST`   | `/conversations/:id/messages/:msgId/regenerate` | **10/min** | JWT | Regenerate assistant response (SSE) |
| `POST`   | `/conversations/:id/fork/:messageId` | **10/min** | JWT      | Fork conversation from a specific message |
| `GET`    | `/conversations/search`             | **30/min**   | JWT      | Search conversations and messages |
| `GET`    | `/conversations/:id/export`         | **10/min**   | JWT      | Export conversation (Markdown/JSON/PDF) |
| `GET`    | `/templates`                        | 60/min       | JWT      | List all system prompt templates         |
| `GET`    | `/templates/:id`                    | 60/min       | JWT      | Get a single template                    |
| `POST`   | `/templates`                        | **10/min**   | JWT+Admin| Create a template (admin only)           |
| `PATCH`  | `/templates/:id`                    | **10/min**   | JWT+Admin| Update a template (admin only)           |
| `DELETE` | `/templates/:id`                    | **10/min**   | JWT+Admin| Delete a template (admin only)           |
| `POST`   | `/upload`                           | **20/min**   | JWT      | Upload files (multipart, max 5 files, 10MB each) |
| `GET`    | `/mcp-servers`                      | 60/min       | JWT      | List all MCP server configs              |
| `GET`    | `/mcp-servers/tools`                | 60/min       | JWT      | List available tools from connected MCP servers |
| `GET`    | `/mcp-servers/:id`                  | 60/min       | JWT      | Get a single MCP server config           |
| `POST`   | `/mcp-servers`                      | **10/min**   | JWT+Admin| Register a new MCP server (admin only)   |
| `PATCH`  | `/mcp-servers/:id`                  | **10/min**   | JWT+Admin| Update MCP server config (admin only)    |
| `DELETE` | `/mcp-servers/:id`                  | **10/min**   | JWT+Admin| Remove MCP server (admin only)           |
| `GET`    | `/models`                           | 60/min       | No       | List available LLM models                |
| `GET`    | `/health`                           | none         | No       | Health check (skips throttler)           |

All `:id` parameters are validated by `ParseObjectIdPipe` (returns 400 for invalid ObjectId format).

### Key Backend Patterns

- **LLM integration**: OpenAI SDK with `baseURL` pointed at OpenRouter (`https://openrouter.ai/api/v1`). Custom headers include `HTTP-Referer` and `X-Title`. A second OpenAI client is configured for Ollama (local models) at `OLLAMA_BASE_URL/v1`. Routing is based on model ID prefix: `ollama/` models use the Ollama client, all others use OpenRouter.
- **SSE streaming**: The service returns an `AsyncGenerator<StreamEvent>` (discriminated union: `content`, `done`, `error`). The controller owns SSE headers, wire format (`data: {json}\n\n`), timeout, and disconnect detection via `AbortController`/`AbortSignal`.
- **File uploads**: Multer with `diskStorage` to `./uploads/`. MIME whitelist: `application/pdf`, `text/plain`, `text/markdown`, `text/csv`, `image/png`, `image/jpeg`, `image/gif`, `image/webp`. Unique filenames via timestamp + random suffix.
- **Upload cleanup**: `UploadsCleanupService` runs an hourly cron job that deletes files older than a configurable TTL (default 24 hours, set via `UPLOAD_TTL_HOURS`).
- **Error handling**: `AllExceptionsFilter` catches all unhandled exceptions, includes `correlationId` in the response, logs 5xx at error level and 4xx at warn level.
- **Correlation IDs**: `CorrelationIdMiddleware` assigns a UUID to every request (or validates an incoming one). Pino logger includes it in all log entries.
- **MCP tool integration**: `McpService` manages connections to MCP (Model Context Protocol) servers via stdio transport. On startup, it connects to all enabled servers and caches available tools. `LlmStreamService` converts cached tools to OpenAI function-calling format and executes a tool-use loop (max 10 iterations) when the LLM returns `tool_calls`. Tool execution has a 30-second timeout. Environment inheritance is sandboxed via `buildSafeEnv()` (only PATH, HOME, NODE_ENV, LANG).
- **Env validation**: Joi schema in `env.validation.ts` validates all environment variables at startup. `OPENROUTER_API_KEY` is required; others have sensible defaults.
- **Rate limiting**: Default 60 req/min via `ThrottlerGuard` (APP_GUARD). Streaming endpoint: 10/min. Upload endpoint: 20/min.
- **WebSocket (Socket.IO)**: `ChatGateway` provides real-time collaboration via Socket.IO. JWT authentication via handshake `auth.token` field. Room-based architecture: clients join `conversation:<id>` rooms to receive live updates. Events: `message:created`, `message:updated`, `message:deleted`, `typing:start`, `typing:stop`, `user:joined`, `user:left`. `ChatBroadcastService` wraps LLM streams to broadcast assistant messages to other connected clients. CORS configured to match the same origin as the REST API.

---

## Frontend Architecture (React + Vite)

### Component Tree

```
App (useAuth + useThemeMode hooks)
├── ErrorBoundary
│   └── ThemeModeProvider (dark/light/system)
│       └── ThemeProvider (MUI theme from resolved mode)
│           ├── CssBaseline
│           ├── AuthPage (login/register, shown when unauthenticated)
│           │   ├── LanguageSwitcher
│           │   ├── ThemeToggle
│           │   └── Login/Register form
│           ├── ChatApp (shown when authenticated)
│           │   ├── ChatAppProvider (React Context for shared state)
│           │   │   └── ModelProvider (React Context for model selection)
│           │   │       └── TemplateProvider (React Context for template selection)
│           │   │           └── Layout (pure layout, no data props)
│           │   │               ├── Sidebar (reads from ChatAppContext)
│           │   │               │   ├── LanguageSwitcher
│           │   │               │   ├── ThemeToggle
│           │   │               │   ├── NewChatButton
│           │   │               │   ├── ConversationItem[] (list with delete)
│           │   │               │   └── User email + Logout button
│           │   │               └── ChatArea (reads from ChatAppContext + ModelContext + TemplateContext)
│           │   │                   ├── ModelSelector (reads from ModelContext)
│           │   │                   ├── TemplateSelector (reads from TemplateContext)
│           │   │                   ├── SearchDialog (Cmd+K full-text search)
│           │   │                   ├── ExportMenu (Markdown/JSON/PDF export)
│           │   │                   ├── AdminTemplatePanel (admin template CRUD)
│           │   │                   ├── MessageList
│           │   │                   │   ├── MessageBubble[] (lazy-loads MarkdownRenderer)
│           │   │                   │   │   ├── MessageActions (copy, edit, regenerate)
│           │   │                   │   │   └── MessageEditForm (inline edit UI)
│           │   │                   │   └── TypingIndicator (during streaming)
│           │   │                   ├── EmptyState (no conversation selected)
│           │   │                   └── ChatInput
│           │   │                       └── FileAttachment (upload UI)
│           │   └── ConfirmDialog (shared delete confirmation)
│           │   └── Snackbar + Alert (error display, auto-dismiss 4s)
│           └── Loading spinner (during auth session restore)
```

### State Management

Custom hooks with four React Contexts (`ChatAppContext`, `ModelContext`, `TemplateContext`, `ThemeModeContext`). No Redux, Zustand, or other external state library.

| Hook / Context     | Responsibilities                                                    |
|--------------------|---------------------------------------------------------------------|
| `ChatAppContext`   | Shared state (conversations, selection, user info) + action callbacks. Provided by `ChatApp`, consumed by `Sidebar` and `ChatArea` via `useChatApp()`. |
| `ModelContext`     | Model selection state (models list, selectedModel, changeModel). Split from ChatAppContext to prevent full-page re-renders on model change. Consumed via `useModel()`. |
| `TemplateContext`  | Template selection state (templates list, selectedTemplateId, changeTemplate). Syncs template selection with conversations. Consumed via `useTemplate()`. |
| `ThemeModeContext` | Dark/light/system theme mode. Wraps `useThemeMode` hook. Consumed via `useThemeModeContext()`. |
| `useAuth`          | JWT token management (localStorage), login, register, logout, session restore on mount. |
| `useConversations` | Fetch, create, update, delete conversations. Error state. Auto-fetch on mount. |
| `useMessages`      | Fetch messages, send with SSE streaming, optimistic user message insertion, stop streaming. Manages `streaming`, `streamingContent`, abort controller. |
| `useModels`        | Fetch available models on mount. Error state.                       |
| `useTemplates`     | Fetch available templates on mount. Error state.                    |
| `useAdminTemplates`| Admin template CRUD operations (create, update, delete). Used by `AdminTemplatePanel`. |
| `useFocusRevalidation` | Shared hook: refetches data on window focus/visibility change. Throttled (default 30s). Used by `useConversations` and `useModels`. |
| `useOnlineStatus`  | Detects browser online/offline state. Returns `isOnline` boolean. Drives offline Snackbar and ChatInput disabled state. |
| `useSearch`        | Manages search state for Cmd+K dialog. Debounced query, results, loading state. |
| `useThemeMode`     | Dark/light/system theme mode toggle. Persists preference to localStorage. |

State coordination happens in `ChatApp` (within `App.tsx`), which assembles the `ChatAppContext` value from `useConversations` and local state (`selectedId`), and a separate `ModelContext` value from `useModels` and `selectedModel`. `Layout` is a pure layout component with no data props.

### API Layer

Located in `src/api/client.ts`:

- **REST calls** (conversations CRUD, models, upload): `axios` instance with `VITE_API_URL` base URL.
- **SSE streaming** (send message): Native `fetch` with `ReadableStream` reader. Parses `data:` lines, handles `[DONE]` sentinel, JSON error payloads, and abort signals. 5-minute client-side timeout via `AbortController`.
- **File upload**: `FormData` with field name `files`, sent via axios.

### Markdown Rendering

`MessageBubble` lazy-loads a `MarkdownRenderer` component (via `React.lazy`) to render assistant messages as Markdown using:
- `react-markdown` for parsing
- `remark-gfm` for GitHub Flavored Markdown (tables, strikethrough, etc.)
- `rehype-sanitize` for XSS protection
- `react-syntax-highlighter` for code block syntax highlighting

The lazy import splits `react-markdown` and `react-syntax-highlighter` into a separate ~796KB chunk, reducing initial bundle load.

### i18n

Four languages supported via `react-i18next`:
- English (`en`)
- Russian (`ru`)
- Chinese Simplified (`zh-CN`)
- Spanish (`es`)

Language detection order: `localStorage` then `navigator`. Fallback: English. The `LanguageSwitcher` component in the sidebar allows manual language selection.

### Error Handling

- **ErrorBoundary**: Catches render-time exceptions and displays a fallback UI.
- **Hook-level errors**: Each hook exposes an `error` state and `clearError` callback.
- **Snackbar**: `App.tsx` aggregates errors from all hooks and displays them in a bottom-center auto-dismissing Snackbar.
- **Streaming errors**: Displayed inline as an assistant message with `Error: ...` prefix.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable             | Required | Default                                    | Description                        |
|----------------------|----------|--------------------------------------------|------------------------------------|
| `OPENROUTER_API_KEY` | Yes      | --                                         | API key for OpenRouter LLM calls   |
| `JWT_SECRET`         | Yes      | --                                         | Secret key for JWT token signing   |
| `MONGODB_URI`        | No       | `mongodb://localhost:27017/simple-chat`     | MongoDB connection string          |
| `MONGO_POOL_SIZE_MIN`| No       | `2`                                        | Minimum connections in pool        |
| `MONGO_POOL_SIZE_MAX`| No       | `10`                                       | Maximum connections in pool        |
| `PORT`               | No       | `3001`                                     | Backend HTTP port                  |
| `LLM_URL_KEY`        | No       | `https://openrouter.ai/api/v1`             | Override LLM base URL              |
| `OLLAMA_BASE_URL`    | No       | `http://localhost:11434`                   | Ollama server URL for local models |
| `CORS_ORIGIN`        | No       | `http://localhost:5173`                    | Allowed CORS origin                |
| `UPLOAD_TTL_HOURS`   | No       | `24`                                       | Hours before uploaded files are cleaned up |
| `JWT_EXPIRATION_SECONDS` | No   | `900`                                      | JWT token expiration in seconds    |
| `LOG_LEVEL`          | No       | `info`                                     | Pino log level (fatal..trace)      |
| `NODE_ENV`           | No       | `development`                              | Environment mode                   |

### Frontend

| Variable       | Default                        | Description                |
|----------------|--------------------------------|----------------------------|
| `VITE_API_URL` | `http://localhost:3001/api`    | Backend API base URL       |

---

## Technology Stack

### Backend
| Category      | Technology                                          |
|---------------|-----------------------------------------------------|
| Framework     | NestJS 11                                           |
| Language      | TypeScript 5.7, compiled with SWC                   |
| Database      | MongoDB 7 (native driver, no Mongoose)              |
| LLM Client    | OpenAI SDK 6.x (pointed at OpenRouter)              |
| Logging       | Pino (via nestjs-pino) + pino-pretty in dev         |
| Validation    | class-validator + class-transformer (DTOs), Joi (env)|
| Rate Limiting | @nestjs/throttler                                   |
| Health Checks | @nestjs/terminus                                    |
| Scheduling    | @nestjs/schedule (cron)                             |
| File Upload   | Multer (via @nestjs/platform-express)               |
| PDF Parsing   | pdf-parse                                           |
| WebSocket     | Socket.IO (via @nestjs/platform-socket.io)          |
| Testing       | Vitest + unplugin-swc                               |

### Frontend
| Category       | Technology                                          |
|----------------|-----------------------------------------------------|
| Framework      | React 19                                            |
| Build Tool     | Vite 7                                              |
| UI Library     | MUI 7 (@mui/material + @mui/icons-material)         |
| Styling        | Emotion (@emotion/react, @emotion/styled)           |
| HTTP Client    | axios (REST) + native fetch (SSE)                   |
| Markdown       | react-markdown + remark-gfm + rehype-sanitize       |
| Code Highlight | react-syntax-highlighter                            |
| i18n           | react-i18next + i18next-browser-languagedetector    |
| Testing        | Vitest + jsdom + React Testing Library              |

### Tooling
| Category       | Technology                                          |
|----------------|-----------------------------------------------------|
| Monorepo       | concurrently (no npm workspaces, separate package-locks) |
| Linting        | ESLint 9 + typescript-eslint                        |
| Formatting     | Prettier                                            |
| Git Hooks      | Husky + lint-staged                                 |
| Type Checking  | TypeScript (`tsc --noEmit`)                         |

---

## Security Considerations

- **Input validation**: All DTOs validated via class-validator with whitelist mode (strips unknown properties).
- **ObjectId validation**: Custom `ParseObjectIdPipe` rejects malformed IDs before they reach service logic.
- **Path traversal prevention**: File paths are reconstructed from `path.basename()` only, with an additional resolved-path check against the uploads directory boundary.
- **Rate limiting**: Tiered throttling (60/min default, 10/min streaming, 20/min uploads) to prevent abuse.
- **CORS**: Configurable origin (defaults to dev frontend).
- **File upload restrictions**: MIME whitelist, 10MB size limit, max 5 files per request.
- **XSS protection**: Frontend uses `rehype-sanitize` when rendering user/assistant markdown content.
- **Correlation IDs**: UUID format validation prevents header injection via the correlation ID.
