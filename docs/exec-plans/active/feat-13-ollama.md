# FEAT-13: Ollama / Local Model Support

## Task Description
Add direct Ollama connection (OpenAI-compatible API) for fully offline, zero-cost local LLM usage. Auto-detect available models.

## Acceptance Criteria
- Backend auto-detects if Ollama is running and fetches available models
- Ollama models appear in the model selector alongside OpenRouter models
- Chat completions route to Ollama when an Ollama model is selected
- Streaming works identically to OpenRouter
- `OLLAMA_BASE_URL` env var configurable (default: `http://localhost:11434`)
- Frontend shows provider badge (Local/Cloud) on models
- Graceful degradation: if Ollama is not running, only OpenRouter models show

## Implementation Phases

### Phase A: Backend Configuration (0.25d)
- Add `OLLAMA_BASE_URL` to config/configuration.ts
- Add env validation for `OLLAMA_BASE_URL` (optional, valid URI)
- Update backend/.env.example
- **Files**: `configuration.ts`, `env.validation.ts`, `.env.example`

### Phase B: Backend Ollama Service (0.5d)
- Create `OllamaService` in models module
- Auto-detect Ollama availability via `GET /api/tags`
- Fetch and map Ollama models to `ModelInfo` (with `provider: 'ollama'` field)
- Periodic refresh (same 1-hour interval as OpenRouter)
- **Files**: New `ollama.service.ts` in `backend/src/models/`

### Phase C: ModelInfo Enhancement (0.25d)
- Add `provider` field to `ModelInfo` interface (backend + frontend)
- Set `provider: 'openrouter'` for all OpenRouter models
- Set `provider: 'ollama'` for all Ollama models
- Update fallback models with provider field
- **Files**: `models.service.ts`, frontend `types/index.ts`

### Phase D: Models Integration (0.25d)
- Merge Ollama models into ModelsService.getModels()
- Inject OllamaService into ModelsService
- **Files**: `models.service.ts`, `models.module.ts`

### Phase E: LLM Stream Routing (0.5d)
- Create second OpenAI client for Ollama in LlmStreamService
- Route based on model provider: check if model is Ollama, use Ollama client
- Inject ModelsService into LlmStreamService (or pass provider info)
- **Files**: `llm-stream.service.ts`, `chat.module.ts`

### Phase F: Frontend Changes (0.25d)
- Add provider badge to ModelSelector (Local chip for Ollama)
- Add i18n strings for "Local", "Cloud" in all 4 locales
- **Files**: `ModelSelector.tsx`, all 4 locale files, `constants.ts`

### Phase G: Tests (0.5d)
- OllamaService unit tests
- Updated ModelsService tests
- LlmStreamService routing tests
- Frontend ModelSelector test update

## Decision Log
- Using OpenAI SDK for Ollama too (Ollama supports OpenAI-compatible API at `/v1/`)
- No API key needed for Ollama (empty string)
- Provider field is a simple string, not enum, for future extensibility
- Ollama models get `free: true` since they're local
- Vision detection: check Ollama model details for multimodal support
