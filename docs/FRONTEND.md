# Frontend Architecture

Reference document for the React frontend of Simple Chat. Use this when implementing new features, fixing bugs, or onboarding.

## Component Architecture

### Component Tree

```
App (src/App.tsx)
  state: selectedId, selectedModel, localError
  hooks: useConversations(), useModels()
  renders: ErrorBoundary > ThemeProvider > CssBaseline > Layout + Snackbar
|
+-- ErrorBoundary (src/components/ErrorBoundary.tsx)
|     Class component. Catches render errors, shows fallback UI with
|     "Try Again" (resets state) and "Reload Page" (window.location.reload).
|     Uses i18n.t() directly (not useTranslation, since it is a class).
|
+-- Layout (src/components/Layout.tsx)
|     props: conversations, models, selectedConversation, selectedModel, callbacks
|     Responsive split: persistent sidebar on desktop, temporary Drawer on mobile.
|     Breakpoint: theme.breakpoints.down('md') (< 900px).
|     SIDEBAR_WIDTH = 280px.
|
|   +-- Sidebar (src/components/Sidebar/Sidebar.tsx)
|   |     props: conversations, loading, selectedId, onSelect, onNewChat, onDelete
|   |     Manages deleteTarget state for confirmation dialog.
|   |
|   |   +-- LanguageSwitcher (src/components/common/LanguageSwitcher.tsx)
|   |   |     ToggleButtonGroup: EN | RU | ZH (zh-CN) | ES
|   |   |     Calls i18n.changeLanguage() on selection.
|   |   |
|   |   +-- NewChatButton (src/components/Sidebar/NewChatButton.tsx)
|   |   |     MUI Button with purple gradient background.
|   |   |
|   |   +-- ConversationItem[] (src/components/Sidebar/ConversationItem.tsx)
|   |   |     ListItemButton: click to select, hover reveals delete icon.
|   |   |     Shows title (truncated) + localized date.
|   |   |     Selected state uses purple highlight (rgba(124, 77, 255, 0.12)).
|   |   |
|   |   +-- ConfirmDialog (src/components/common/ConfirmDialog.tsx)
|   |         MUI Dialog for delete confirmation. Receives title/message as props.
|   |
|   +-- ChatArea (src/components/Chat/ChatArea.tsx)
|         props: conversation, models, selectedModel, onModelChange, onConversationUpdate
|         hook: useMessages()
|         Shows EmptyState when conversation is null.
|         Fetches messages on conversation change.
|
|       +-- MessageList (src/components/Chat/MessageList.tsx)
|       |     Scrollable container. Auto-scrolls on new messages/streaming content.
|       |     Shows CircularProgress while loading.
|       |     Responsive horizontal padding: xs=16px, md=32px.
|       |
|       |   +-- MessageBubble[] (src/components/Chat/MessageBubble.tsx)
|       |   |     User: right-aligned, purple tint background, pre-wrap text.
|       |   |     Assistant: left-aligned, dark background, full Markdown rendering.
|       |   |     Avatars: user = purple-blue gradient, assistant = cyan-green gradient.
|       |   |     Max width: 75%. Asymmetric border-radius for speech-bubble effect.
|       |   |     Markdown stack: ReactMarkdown + remarkGfm + rehypeSanitize + Prism (oneDark).
|       |   |     Shows model name as caption below assistant messages.
|       |   |     Renders attachment chips when present.
|       |   |
|       |   +-- TypingIndicator (src/components/Chat/TypingIndicator.tsx)
|       |         Three bouncing dots (8px circles, primary color).
|       |         Shown when streaming=true AND streamingContent is empty.
|       |
|       +-- EmptyState (src/components/common/EmptyState.tsx)
|       |     Centered icon + text. Shown when no conversation is selected.
|       |
|       +-- ChatInput (src/components/Chat/ChatInput.tsx)
|             Compound input area with border glow on focus.
|             TextField: multiline (3-8 rows), Enter to send, Shift+Enter for newline.
|             Toolbar row: ModelSelector + FileAttachment (left), Send button (right).
|             Manages own input, attachments[], uploading state.
|             Disabled during streaming.
|
|           +-- ModelSelector (src/components/Chat/ModelSelector.tsx)
|           |     MUI Select dropdown. Shows model name + "Free" chip badge.
|           |     Min width: 140px.
|           |
|           +-- FileAttachment (src/components/Chat/FileAttachment.tsx)
|                 Hidden file input + attach icon button.
|                 Validation: max 5 files, max 10MB each.
|                 Allowed types: pdf, txt, md, csv, png, jpg, jpeg, gif, webp.
|                 Shows alert() on validation errors.
```

### Key Observations

- **No context providers** for app state. State lives in `App` and is threaded through props.
- **useMessages** lives inside `ChatArea`, not `App`. Each conversation change triggers a fresh fetch.
- **Optimistic updates**: user messages are added to state immediately before the stream begins.
- **Streaming messages** are rendered as a temporary `MessageBubble` with `_id: 'streaming'` until the stream completes.

---

## State Management Pattern

Three custom hooks in `src/hooks/`. No Redux, Zustand, or other external state library.

### useConversations()

**File:** `src/hooks/useConversations.ts`

```typescript
// Returns
{
  conversations: Conversation[];  // All conversations, newest first
  loading: boolean;               // True during initial fetch
  error: string | null;           // Last error message
  clearError: () => void;
  refresh: () => Promise<void>;   // Re-fetch all conversations
  create: (model?: string) => Promise<Conversation>;
  update: (id: string, body: { title?: string; model?: string }) => Promise<Conversation>;
  remove: (id: string) => Promise<void>;
}
```

- Fetches on mount via `useEffect`.
- `create` prepends to state. `update` replaces in-place. `remove` filters out.
- Uses `tRef` pattern (ref to `t` function) to avoid stale closures in memoized callbacks.

### useMessages()

**File:** `src/hooks/useMessages.ts`

```typescript
// Returns
{
  messages: Message[];            // All messages for current conversation
  loading: boolean;               // True during message fetch
  streaming: boolean;             // True during SSE stream
  streamingContent: string;       // Accumulated assistant response during stream
  error: string | null;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, model?: string, attachments?: Attachment[]) => Promise<void>;
  stopStreaming: () => void;       // Aborts the stream via AbortController
  clear: () => void;              // Resets all state (used on conversation change)
}
```

- `sendMessage` adds user message optimistically, then starts SSE stream.
- On stream completion, adds final assistant message to state.
- On stream error, adds an error message as an assistant message bubble.
- `abortRef` holds the AbortController for cancellation support.
- Uses `crypto.randomUUID()` for temporary message IDs.

### useModels()

**File:** `src/hooks/useModels.ts`

```typescript
// Returns
{
  models: ModelInfo[];   // Available LLM models
  loading: boolean;
  error: string | null;
  clearError: () => void;
}
```

- Fetches once on mount. Read-only, no mutations.

### Pattern Summary

All hooks follow: **state + operations + error + clearError**. Data is fetched on mount or when a dependency changes. Errors are surfaced as strings. The `tRef` pattern prevents unnecessary re-renders from `useTranslation`.

---

## API Layer

**File:** `src/api/client.ts`

### REST Client (axios)

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});
```

**Functions:**

| Function | Method | Endpoint | Returns |
|---|---|---|---|
| `getConversations()` | GET | `/conversations` | `Conversation[]` |
| `createConversation(body?)` | POST | `/conversations` | `Conversation` |
| `updateConversation(id, body)` | PATCH | `/conversations/:id` | `Conversation` |
| `deleteConversation(id)` | DELETE | `/conversations/:id` | `void` |
| `getMessages(conversationId)` | GET | `/conversations/:id/messages` | `Message[]` |
| `uploadFiles(files)` | POST | `/upload` | `Attachment[]` |
| `getModels()` | GET | `/models` | `ModelInfo[]` |

### SSE Streaming (native fetch)

```typescript
sendMessageStream(
  conversationId: string,
  content: string,
  model?: string,
  attachments?: Attachment[],
  onChunk?: (text: string) => void,
  onDone?: () => void,
  onError?: (error: string) => void,
  abortSignal?: AbortSignal,
): Promise<void>
```

- Uses `fetch` (not axios) to get a `ReadableStream`.
- Parses SSE `data:` lines. Skips malformed JSON silently.
- `data: [DONE]` signals completion.
- `data: {"error": "..."}` signals a server-side error.
- Internal `AbortController` with 5-minute timeout (`STREAM_TIMEOUT_MS`).
- External abort signal support for "stop generation" UX.
- Reader is cancelled in `finally` block to prevent leaks.

---

## TypeScript Types

**File:** `src/types/index.ts`

```typescript
interface Conversation {
  _id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
}

interface Message {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  attachments: Attachment[];
  createdAt: string;
}

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  free: boolean;
  contextLength: number;
  supportsVision: boolean;
}
```

---

## i18n System

**Configuration:** `src/i18n/index.ts`

- Library: `react-i18next` with `i18next-browser-languagedetector`
- Fallback language: `en`
- Detection order: `localStorage` then `navigator`
- Cache: `localStorage`

### Supported Languages

| Code | Label | Locale file |
|---|---|---|
| `en` | EN | `src/i18n/locales/en.json` |
| `ru` | RU | `src/i18n/locales/ru.json` |
| `zh-CN` | ZH (Chinese) | `src/i18n/locales/zh.json` |
| `es` | ES | `src/i18n/locales/es.json` |

### Key Namespaces

All keys are in a flat `translation` namespace:

- **`sidebar.*`** -- title, newChat, noConversations
- **`chat.*`** -- placeholder, filesAttached, sendTooltip, noConversation, noConversationHint, attachFiles
- **`dialog.*`** -- deleteTitle, deleteMessage
- **`common.*`** -- cancel, delete, tryAgain, reloadPage
- **`models.*`** -- free
- **`errors.*`** -- createConversation, deleteConversation, fetchConversations, updateConversation, fetchMessages, streamingFailed, somethingWrong, unexpected, maxFileCount, fileTooLarge, unsupportedType, fetchModels, filesNotAttached

### Interpolation Examples

```
errors.maxFileCount    -> "You can attach up to {{count}} files at a time."
errors.fileTooLarge    -> "\"{{name}}\" exceeds the 10MB size limit."
errors.unsupportedType -> "\"{{name}}\" has an unsupported file type ({{type}})."
```

### Usage Rules

1. **All user-facing strings** must use `t()` from `useTranslation()`.
2. In class components (ErrorBoundary), use `i18n.t()` directly from the imported `i18n` instance.
3. The `tRef` pattern is used in hooks to avoid stale closures: store `t` in a ref, update it on each render, use `tRef.current` inside callbacks.
4. When adding new strings, add them to **all four** locale files (`en.json`, `ru.json`, `zh.json`, `es.json`).
5. The `LanguageSwitcher` component in the sidebar provides the UI for switching.

---

## Testing Approach

**Framework:** Vitest + jsdom + React Testing Library

**Config:** `vitest.config.ts` with `environment: 'jsdom'`

**Setup:** `src/setupTests.ts` -- initializes i18n for test environment.

### Test Files

| File | Component | What it tests |
|---|---|---|
| `ChatInput.test.tsx` | ChatInput | Input handling, send on Enter, Shift+Enter newline, disabled state |
| `MessageBubble.test.tsx` | MessageBubble | User vs assistant rendering, markdown, attachments |
| `ModelSelector.test.tsx` | ModelSelector | Dropdown rendering, model selection, free badge |
| `Sidebar.test.tsx` | Sidebar | Conversation list, selection, delete flow |
| `EmptyState.test.tsx` | EmptyState | Renders placeholder text and icon |
| `ConfirmDialog.test.tsx` | ConfirmDialog | Open/close, confirm/cancel callbacks |

### Running Tests

```bash
# All frontend tests
npm run test:frontend

# Single test file
cd frontend && npx vitest run src/__tests__/ChatInput.test.tsx

# Watch mode
cd frontend && npx vitest src/__tests__/ChatInput.test.tsx
```

### Testing Conventions

- Mock API calls with `vi.mock('../api/client')`.
- Use `screen.getByRole`, `screen.getByText` for queries (accessible selectors first).
- i18n is auto-initialized in setupTests.ts, so `t()` calls return English strings in tests.
- Use `userEvent` for interaction testing, `fireEvent` only when `userEvent` does not support the interaction.

---

## File Structure

```
frontend/src/
  App.tsx                          # Root component, state orchestration
  main.tsx                         # Entry point, renders App
  theme.ts                         # MUI dark theme configuration
  setupTests.ts                    # Vitest setup (i18n init)
  types/
    index.ts                       # Conversation, Message, Attachment, ModelInfo
  api/
    client.ts                      # REST + SSE API functions
  hooks/
    useConversations.ts            # Conversations CRUD state
    useMessages.ts                 # Messages + streaming state
    useModels.ts                   # Available models state
  i18n/
    index.ts                       # i18next configuration
    locales/
      en.json                      # English strings
      ru.json                      # Russian strings
      zh.json                      # Chinese strings
      es.json                      # Spanish strings
  components/
    ErrorBoundary.tsx              # Class component error boundary
    Layout.tsx                     # Responsive sidebar/chat split
    Sidebar/
      Sidebar.tsx                  # Sidebar container
      NewChatButton.tsx            # Gradient "New Chat" button
      ConversationItem.tsx         # Single conversation list item
    Chat/
      ChatArea.tsx                 # Chat container, manages useMessages
      MessageList.tsx              # Scrollable message list
      MessageBubble.tsx            # Individual message with markdown
      ChatInput.tsx                # Multiline input + toolbar
      ModelSelector.tsx            # LLM model dropdown
      FileAttachment.tsx           # File upload button + validation
      TypingIndicator.tsx          # Bouncing dots animation
    common/
      EmptyState.tsx               # "No conversation selected" placeholder
      ConfirmDialog.tsx            # Reusable confirmation modal
      LanguageSwitcher.tsx         # Language toggle buttons
  __tests__/
    ChatInput.test.tsx
    MessageBubble.test.tsx
    ModelSelector.test.tsx
    Sidebar.test.tsx
    EmptyState.test.tsx
    ConfirmDialog.test.tsx
```

---

## Patterns to Follow

### 1. Always use `t()` for user-facing strings

```typescript
// Correct
<Typography>{t('sidebar.title')}</Typography>

// Wrong -- hardcoded string
<Typography>Simple Chat</Typography>
```

### 2. Use MUI components, not raw HTML

```typescript
// Correct
<Box sx={{ display: 'flex', gap: 1 }}>
  <Typography variant="body2">Text</Typography>
</Box>

// Wrong
<div style={{ display: 'flex', gap: 8 }}>
  <p>Text</p>
</div>
```

### 3. Use theme tokens for colors and spacing

```typescript
// Correct -- references theme
sx={{ color: 'text.secondary', backgroundColor: 'background.paper' }}

// Wrong -- hardcoded values
sx={{ color: '#9090a0', backgroundColor: '#12121a' }}
```

Exception: rgba values for transparency overlays are acceptable (e.g., `rgba(124, 77, 255, 0.12)`).

### 4. Handle loading and error states

Every component that fetches data must show:
- A `CircularProgress` spinner during loading.
- An error message or Snackbar alert on failure.
- An empty state when the data set is empty.

### 5. Use `crypto.randomUUID()` for temporary IDs

For optimistic updates, use `crypto.randomUUID()` to generate placeholder IDs. These get replaced by server-generated MongoDB `_id` values after a successful response.

### 6. Use the `tRef` pattern in hooks

When a hook callback needs `t()` but should not re-create on language change:

```typescript
const { t } = useTranslation();
const tRef = useRef(t);
tRef.current = t;

const someCallback = useCallback(() => {
  setError(tRef.current('errors.something'));
}, []); // No t in dependency array
```

### 7. Component prop threading over context

This codebase passes data through props from `App` down the tree. Do not introduce context providers without discussion. This keeps data flow explicit and traceable.

### 8. Streaming pattern

When adding new streaming features, follow the existing pattern:
1. Create an `AbortController`.
2. Start with `setStreaming(true)` and `setStreamingContent('')`.
3. Accumulate chunks into a local variable AND call `setStreamingContent`.
4. On done, create the final message from the accumulated content.
5. Always clean up in `finally`: `setStreaming(false)`, `setStreamingContent('')`, cancel reader.
