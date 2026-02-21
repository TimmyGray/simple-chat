import { ObjectId } from 'mongodb';

export interface AuthUser {
  _id: ObjectId;
  email: string;
  totalTokensUsed: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}
