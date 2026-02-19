# Chat Features Specification

## Current Features

### Conversation Management
- Create new conversations with default title "New Chat"
- Auto-title from first message (truncated to 50 chars)
- Rename conversations
- Delete conversations (cascades to messages)
- Sort by most recently updated

### Messaging
- Send text messages
- Receive streamed AI responses (SSE)
- Markdown rendering with syntax highlighting
- XSS protection via rehype-sanitize

### File Attachments
- Upload up to 5 files per message (10MB each)
- Supported: text, PDF, CSV, markdown
- File content extracted and appended to LLM context
- Binary files show placeholder
- Uploads auto-cleaned after configurable TTL

### Model Selection
- Per-conversation model selection
- Model list served from backend (hardcoded)
- Default model: openrouter/free

### i18n
- 4 languages: English, Russian, Chinese (Simplified), Spanish (Mexican)
- Auto-detect browser language
- Manual toggle in sidebar
- All strings translatable

## Planned Features
See `docs/PRODUCT_SENSE.md` for prioritized backlog.

## Acceptance Criteria Template
For each new feature, define:
1. User story: "As a [persona], I want to [action] so that [benefit]"
2. Happy path: step-by-step expected behavior
3. Error cases: what happens when things go wrong
4. Edge cases: empty state, max limits, concurrent access
5. i18n: all new strings in 4 languages
