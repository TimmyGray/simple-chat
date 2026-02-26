# Product Sense

## Vision
Simple Chat is a self-hosted, privacy-first AI chat application that gives users full control over their LLM interactions. Unlike cloud-hosted alternatives (ChatGPT, Claude.ai), it connects to any OpenRouter-compatible model provider, keeping all data local.

## User Personas

### Developer Dan
- Self-hosts the app on their machine or home server
- Wants to use various LLM models through a single interface
- Values: flexibility, control, open-source
- Pain points: switching between multiple AI chat UIs, losing conversation history

### Team Lead Tanya
- Deploys for a small team to share LLM access
- Wants multi-user support with conversation isolation
- Values: cost tracking, access control
- Pain points: ungoverned API key usage, no visibility into team LLM costs

### Power User Pat
- Heavy daily user with 50+ conversations
- Wants keyboard shortcuts, search, conversation export
- Values: speed, organization, customization
- Pain points: slow UI with many conversations, can't find past chats

## Feature Prioritization (Impact vs Effort)

### Must Have (P0) — Blocking production use
No remaining P0 items.

### Should Have (P1) — High impact, moderate effort
No remaining P1 items.

### Nice to Have (P2) — Polish and delight
1. **Real-time Collaboration** — WebSocket-based shared conversations for teams
2. **MCP Frontend UI** — Inline tool-call display with collapsible results (FEAT-14b, backend done)

### Shipped
- **Authentication** — JWT auth + userId-scoped data (FEAT-1)
- **Conversation Search** — Cmd+K full-text search (FEAT-2)
- **Message Editing & Regeneration** — Edit messages, regenerate responses (FEAT-3)
- **Conversation Export** — Markdown/PDF/JSON export (FEAT-4)
- **System Prompt Templates** — Reusable prompt library with admin CRUD, 10 seed templates (FEAT-5)
- **Token/Cost Tracking** — Per-message + cumulative usage tracking (FEAT-6)
- **Streaming Response Controls** — Stop/copy/retry buttons (FEAT-7)
- **Dark/Light Theme Toggle** — Light/dark/system modes (FEAT-8)
- **Keyboard Shortcuts** — Cmd+N (new chat), Cmd+K (search), Escape (stop/blur) (FEAT-9)
- **Image Input (Multi-modal Chat)** — Paste/upload images to vision-capable models (FEAT-11)
- **Conversation Branching** — Fork conversations from any message to explore alternatives (FEAT-12)
- **Ollama / Local Model Support** — Direct Ollama connection for fully offline, zero-cost usage (FEAT-13)
- **MCP Tool Integration (Backend)** — Connect to MCP servers for external tools with admin CRUD and tool-use streaming (FEAT-14)

## Design Principles
1. **Simple first** — Don't build features users haven't asked for
2. **Self-hosted friendly** — Easy Docker deployment, no external service dependencies beyond LLM API
3. **Model agnostic** — Support any OpenRouter-compatible provider
4. **Privacy by default** — All data stored locally, no telemetry
5. **Keyboard first** — Every action should be accessible via keyboard
