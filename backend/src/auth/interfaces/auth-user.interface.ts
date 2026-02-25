import { ObjectId } from 'mongodb';

export interface AuthUser {
  _id: ObjectId;
  email: string;
  isAdmin: boolean;
  totalTokensUsed: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}
