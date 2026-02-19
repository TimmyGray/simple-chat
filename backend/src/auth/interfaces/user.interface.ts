import { ObjectId } from 'mongodb';

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
