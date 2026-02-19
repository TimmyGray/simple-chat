export interface User {
  _id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface Conversation {
  _id: string;
  title: string;
  model: string;
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
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  attachments: Attachment[];
  createdAt: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  free: boolean;
  contextLength: number;
  supportsVision: boolean;
}
