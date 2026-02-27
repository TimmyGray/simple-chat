// --- Branded types ---
// Prevent accidental mixing of different ID types at compile time.
// Use the `as*` constructor functions at API/creation boundaries.

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type ModelId = Brand<string, 'ModelId'>;
export type TemplateId = Brand<string, 'TemplateId'>;

export const asConversationId = (s: string): ConversationId => s as ConversationId;
export const asMessageId = (s: string): MessageId => s as MessageId;
export const asModelId = (s: string): ModelId => s as ModelId;
export const asTemplateId = (s: string): TemplateId => s as TemplateId;

// --- Domain interfaces ---

export interface User {
  _id: string;
  email: string;
  isAdmin?: boolean;
  totalTokensUsed: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

export interface CreateTemplateDto {
  name: string;
  content: string;
  category?: string;
}

export interface UpdateTemplateDto {
  name?: string;
  content?: string;
  category?: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface ForkedFromRef {
  conversationId: ConversationId;
  messageId: MessageId;
}

export type ParticipantRole = 'viewer' | 'editor';

export interface Participant {
  userId: string;
  email: string;
  role: ParticipantRole;
  addedAt: string;
}

export interface Conversation {
  _id: ConversationId;
  title: string;
  model: ModelId;
  templateId?: TemplateId;
  forkedFrom?: ForkedFromRef;
  participants?: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  _id: TemplateId;
  name: string;
  content: string;
  category: string;
  isDefault: boolean;
}

export interface Attachment {
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
}

export interface ToolCallEvent {
  name: string;
  arguments: string;
}

export interface ToolResultEvent {
  name: string;
  content: string;
  isError: boolean;
}

export interface ToolCallEntry {
  name: string;
  arguments: string;
  result?: { content: string; isError: boolean };
}

export interface Message {
  _id: MessageId;
  conversationId: ConversationId;
  role: 'user' | 'assistant';
  content: string;
  model?: ModelId;
  attachments: Attachment[];
  isEdited?: boolean;
  toolCalls?: ToolCallEntry[];
  createdAt: string;
}

export interface ModelInfo {
  id: ModelId;
  name: string;
  description: string;
  free: boolean;
  contextLength: number;
  supportsVision: boolean;
  provider: 'openrouter' | 'ollama';
}
