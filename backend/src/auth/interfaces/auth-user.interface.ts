import { ObjectId } from 'mongodb';

export interface AuthUser {
  _id: ObjectId;
  email: string;
}
