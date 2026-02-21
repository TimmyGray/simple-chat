import { ObjectId } from 'mongodb';

export interface ConversationDoc {
  _id?: ObjectId;
  userId: ObjectId;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentDoc {
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface MessageDoc {
  _id?: ObjectId;
  conversationId: ObjectId;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  idempotencyKey?: string;
  attachments: AttachmentDoc[];
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  password: string;
  totalTokensUsed: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  createdAt: Date;
  updatedAt: Date;
}
