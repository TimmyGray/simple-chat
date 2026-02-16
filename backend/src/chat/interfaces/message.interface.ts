import { ObjectId } from 'mongodb';

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
  attachments: AttachmentDoc[];
  createdAt: Date;
  updatedAt: Date;
}
