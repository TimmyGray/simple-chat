# Database Schema

> Auto-generated from MongoDB collection interfaces. Last updated: 2026-02-21.

## Database: simple-chat

### Collection: conversations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | auto | Primary key |
| userId | ObjectId | yes | Reference to users._id (owner) |
| title | string | yes | Conversation title (auto-generated from first message, max 50 chars + "...") |
| model | string | yes | LLM model identifier (default: "openrouter/free") |
| createdAt | Date | yes | Creation timestamp |
| updatedAt | Date | yes | Last update timestamp |

**Indexes:**
- `{ userId: 1, updatedAt: -1 }` — list user's conversations sorted by recent activity

**Source:** `backend/src/chat/interfaces/conversation.interface.ts`

### Collection: messages

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | auto | Primary key |
| conversationId | ObjectId | yes | Reference to conversations._id |
| role | enum | yes | "user" or "assistant" |
| content | string | yes | Message text content |
| model | string | no | LLM model used (assistant messages only) |
| idempotencyKey | string | no | Client-generated UUID to prevent duplicate message creation (user messages only) |
| attachments | AttachmentDoc[] | yes | File attachments (can be empty array) |
| promptTokens | number | no | LLM prompt tokens consumed (assistant messages only) |
| completionTokens | number | no | LLM completion tokens consumed (assistant messages only) |
| totalTokens | number | no | Total tokens consumed (assistant messages only) |
| createdAt | Date | yes | Creation timestamp |
| updatedAt | Date | yes | Last update timestamp |

**Indexes:**
- `{ conversationId: 1, createdAt: 1 }` — query messages by conversation, sorted by time
- `{ conversationId: 1 }` — cascade deletes
- `{ idempotencyKey: 1 }` (unique, sparse) — prevents duplicate message creation

**Source:** `backend/src/chat/interfaces/message.interface.ts`

### Embedded: AttachmentDoc

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fileName | string | yes | Original file name |
| fileType | string | yes | MIME type |
| filePath | string | yes | Server-side file path |
| fileSize | number | yes | File size in bytes |

**Source:** `backend/src/chat/interfaces/message.interface.ts`

### Collection: users

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | auto | Primary key |
| email | string | yes | User email (unique) |
| password | string | yes | bcrypt-hashed password |
| totalTokensUsed | number | no | Cumulative total tokens consumed (for billing) |
| totalPromptTokens | number | no | Cumulative prompt tokens consumed |
| totalCompletionTokens | number | no | Cumulative completion tokens consumed |
| createdAt | Date | yes | Creation timestamp |
| updatedAt | Date | yes | Last update timestamp |

**Indexes:**
- `{ email: 1 }` (unique) — fast lookup by email, enforces uniqueness

**Source:** `backend/src/auth/interfaces/user.interface.ts`

## Schema Validation

MongoDB JSON Schema validators are applied to all collections at startup via `collMod` commands in `DatabaseService.onModuleInit()`.

- **Validation level:** `moderate` — validates inserts and updates to documents that already satisfy the schema (safe for existing data)
- **Validation action:** `error` — rejects documents that fail validation
- **Additional properties:** disallowed on all collections (strict schema)
- **Schema source:** `backend/src/database/database.schemas.ts`

## Notes
- Database module: `backend/src/database/database.module.ts`
- Service: `backend/src/database/database.service.ts`
