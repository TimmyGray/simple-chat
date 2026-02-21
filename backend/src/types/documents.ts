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

export interface MessageDoc {
  _id?: ObjectId;
  conversationId: ObjectId;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  idempotencyKey?: string;
  attachments: AttachmentDoc[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
