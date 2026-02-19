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
1. **Authentication** — Can't deploy without user isolation
2. **System Prompts** — Core LLM UX, users expect this

### Should Have (P1) — High impact, moderate effort
3. **Conversation Search** — Essential at scale (Cmd+K)
4. **Message Regeneration** — Standard in all AI chat UIs
5. **Stop Generation** — Already partially implemented (AbortController exists)
6. **Keyboard Shortcuts** — Power user productivity

### Nice to Have (P2) — Polish and delight
7. **Token/Cost Tracking** — Important for team deployments
8. **Conversation Export** — Data portability
9. **Dark/Light Theme Toggle** — Accessibility
10. **Real-time Collaboration** — Future team feature

## Design Principles
1. **Simple first** — Don't build features users haven't asked for
2. **Self-hosted friendly** — Easy Docker deployment, no external service dependencies beyond LLM API
3. **Model agnostic** — Support any OpenRouter-compatible provider
4. **Privacy by default** — All data stored locally, no telemetry
5. **Keyboard first** — Every action should be accessible via keyboard
