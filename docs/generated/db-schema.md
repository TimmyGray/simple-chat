# Database Schema

> Auto-generated from MongoDB collection interfaces. Last updated: 2026-02-19.

## Database: simple-chat

### Collection: conversations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | auto | Primary key |
| title | string | yes | Conversation title (auto-generated from first message, max 50 chars + "...") |
| model | string | yes | LLM model identifier (default: "openrouter/free") |
| createdAt | Date | yes | Creation timestamp |
| updatedAt | Date | yes | Last update timestamp |

**Source:** `backend/src/chat/interfaces/conversation.interface.ts`

### Collection: messages

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | auto | Primary key |
| conversationId | ObjectId | yes | Reference to conversations._id |
| role | enum | yes | "user" or "assistant" |
| content | string | yes | Message text content |
| model | string | no | LLM model used (assistant messages only) |
| attachments | AttachmentDoc[] | yes | File attachments (can be empty array) |
| createdAt | Date | yes | Creation timestamp |
| updatedAt | Date | yes | Last update timestamp |

**Indexes:**
- `{ conversationId: 1, createdAt: 1 }` — query messages by conversation, sorted by time
- `{ conversationId: 1 }` — cascade deletes

**Source:** `backend/src/chat/interfaces/message.interface.ts`

### Embedded: AttachmentDoc

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fileName | string | yes | Original file name |
| fileType | string | yes | MIME type |
| filePath | string | yes | Server-side file path |
| fileSize | number | yes | File size in bytes |

**Source:** `backend/src/chat/interfaces/message.interface.ts`

## Notes
- No schema validation enforced at MongoDB level (uses native driver, not Mongoose)
- TypeScript interfaces provide compile-time safety only
- Database module: `backend/src/database/database.module.ts`
- Service: `backend/src/database/database.service.ts`
