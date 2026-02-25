// --- Branded types ---
// Prevent accidental mixing of different ID types at compile time.
// Use the `as*` constructor functions at API/creation boundaries.

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type ModelId = Brand<string, 'ModelId'>;

export const asConversationId = (s: string): ConversationId => s as ConversationId;
export const asMessageId = (s: string): MessageId => s as MessageId;
export const asModelId = (s: string): ModelId => s as ModelId;

// --- Domain interfaces ---

export interface User {
  _id: string;
  email: string;
  totalTokensUsed: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

export interface AuthResponse {
  accessToken: string;
}

export interface Conversation {
  _id: ConversationId;
  title: string;
  model: ModelId;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
}

export interface Message {
  _id: MessageId;
  conversationId: ConversationId;
  role: 'user' | 'assistant';
  content: string;
  model?: ModelId;
  attachments: Attachment[];
  isEdited?: boolean;
  createdAt: string;
}

export interface ModelInfo {
  id: ModelId;
  name: string;
  description: string;
  free: boolean;
  contextLength: number;
  supportsVision: boolean;
}
