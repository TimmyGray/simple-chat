import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Collection, Db } from 'mongodb';
import { DATABASE_CONNECTION } from './database.constants';
import { ConversationDoc } from '../chat/interfaces/conversation.interface';
import { MessageDoc } from '../chat/interfaces/message.interface';
import { UserDoc } from '../auth/interfaces/user.interface';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Db) {}

  async onModuleInit() {
    await this.messages().createIndex({ conversationId: 1, createdAt: 1 });
    await this.messages().createIndex({ conversationId: 1 });
    await this.users().createIndex({ email: 1 }, { unique: true });
  }

  conversations(): Collection<ConversationDoc> {
    return this.db.collection<ConversationDoc>('conversations');
  }

  messages(): Collection<MessageDoc> {
    return this.db.collection<MessageDoc>('messages');
  }

  users(): Collection<UserDoc> {
    return this.db.collection<UserDoc>('users');
  }
}
