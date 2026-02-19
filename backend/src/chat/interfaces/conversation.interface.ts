import { ObjectId } from 'mongodb';

export interface ConversationDoc {
  _id?: ObjectId;
  userId: ObjectId;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}
