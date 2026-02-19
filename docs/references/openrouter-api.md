# OpenRouter API Reference

How this project integrates with OpenRouter for LLM calls.

## Configuration

```
OPENROUTER_API_KEY=sk-or-...   # Required
LLM_URL_KEY=https://openrouter.ai/api/v1  # Default base URL
```

## Client Setup

Uses the OpenAI SDK pointed at OpenRouter:
```typescript
new OpenAI({
  apiKey: config.get('openrouter.apiKey'),
  baseURL: config.get('openrouter.baseUrl'),
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'Simple Chat',
  },
});
```

## Streaming Chat Completion

```typescript
const stream = await openai.chat.completions.create({
  model: 'openrouter/free',  // or any supported model
  messages: [
    { role: 'user', content: 'Hello' },
  ],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  // Write SSE chunk
}
```

## Available Models

Served from `ModelsService` (hardcoded list). Each model has:
- id: OpenRouter model identifier
- name: Display name
- description: Short description
- free: boolean
- contextLength: number
- supportsVision: boolean

## Rate Limits
- OpenRouter has its own rate limits per API key
- App-level: 10 req/min on streaming endpoint
- Consider token budgets for team deployments

## Error Handling
- Invalid API key → 401 from OpenRouter → caught by AllExceptionsFilter
- Model not found → error in stream → caught and written as SSE error event
- Network timeout → AbortController + 5-min stream timeout
