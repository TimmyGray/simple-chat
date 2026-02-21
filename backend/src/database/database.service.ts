import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Collection, Db, Document, MongoServerError } from 'mongodb';
import { DATABASE_CONNECTION } from './database.constants';
import { ConversationDoc, MessageDoc, UserDoc } from '../types/documents';
import {
  conversationsSchema,
  messagesSchema,
  usersSchema,
} from './database.schemas';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Db) {}

  async onModuleInit() {
    await this.ensureIndexes();
    await this.applySchemaValidation();
  }

  private async ensureIndexes() {
    await this.messages().createIndex({ conversationId: 1, createdAt: 1 });
    await this.messages().createIndex({ conversationId: 1 });
    await this.messages().createIndex(
      { idempotencyKey: 1 },
      { unique: true, sparse: true },
    );
    await this.conversations().createIndex({ userId: 1, updatedAt: -1 });
    await this.users().createIndex({ email: 1 }, { unique: true });
  }

  private async applySchemaValidation() {
    const schemas: Array<{ name: string; validator: Document }> = [
      { name: 'conversations', validator: conversationsSchema },
      { name: 'messages', validator: messagesSchema },
      { name: 'users', validator: usersSchema },
    ];

    for (const { name, validator } of schemas) {
      await this.applyValidator(name, validator);
    }
  }

  private async applyValidator(
    collectionName: string,
    validator: Document,
  ): Promise<void> {
    try {
      await this.db.command({
        collMod: collectionName,
        validator,
        validationLevel: 'moderate',
        validationAction: 'error',
      });
      this.logger.log(
        `Schema validation applied to "${collectionName}" collection`,
      );
    } catch (error: unknown) {
      // MongoDB error code 26 = NamespaceNotFound (collection doesn't exist)
      if (error instanceof MongoServerError && error.code === 26) {
        await this.db.createCollection(collectionName, {
          validator,
          validationLevel: 'moderate',
          validationAction: 'error',
        });
        this.logger.log(
          `Created "${collectionName}" collection with schema validation`,
        );
        return;
      }
      throw error;
    }
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
