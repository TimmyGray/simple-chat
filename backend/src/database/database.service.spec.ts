import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from './database.service';
import { DATABASE_CONNECTION } from './database.constants';
import {
  conversationsSchema,
  messagesSchema,
  usersSchema,
} from './database.schemas';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockDb: any;
  let mockCollection: any;

  beforeEach(async () => {
    mockCollection = {
      createIndex: vi.fn().mockResolvedValue('index_name'),
    };

    mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection),
      command: vi.fn().mockResolvedValue({ ok: 1 }),
      createCollection: vi.fn().mockResolvedValue(mockCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  describe('onModuleInit', () => {
    it('should create indexes on startup', async () => {
      await service.onModuleInit();

      expect(mockCollection.createIndex).toHaveBeenCalledWith({
        conversationId: 1,
        createdAt: 1,
      });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({
        conversationId: 1,
      });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({
        userId: 1,
        updatedAt: -1,
      });
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { email: 1 },
        { unique: true },
      );
    });

    it('should apply schema validation to all collections', async () => {
      await service.onModuleInit();

      expect(mockDb.command).toHaveBeenCalledWith({
        collMod: 'conversations',
        validator: conversationsSchema,
        validationLevel: 'moderate',
        validationAction: 'error',
      });
      expect(mockDb.command).toHaveBeenCalledWith({
        collMod: 'messages',
        validator: messagesSchema,
        validationLevel: 'moderate',
        validationAction: 'error',
      });
      expect(mockDb.command).toHaveBeenCalledWith({
        collMod: 'users',
        validator: usersSchema,
        validationLevel: 'moderate',
        validationAction: 'error',
      });
    });

    it('should create collection with validator if collMod fails', async () => {
      mockDb.command.mockRejectedValue(new Error('ns not found'));

      await service.onModuleInit();

      expect(mockDb.createCollection).toHaveBeenCalledWith('conversations', {
        validator: conversationsSchema,
        validationLevel: 'moderate',
        validationAction: 'error',
      });
      expect(mockDb.createCollection).toHaveBeenCalledWith('messages', {
        validator: messagesSchema,
        validationLevel: 'moderate',
        validationAction: 'error',
      });
      expect(mockDb.createCollection).toHaveBeenCalledWith('users', {
        validator: usersSchema,
        validationLevel: 'moderate',
        validationAction: 'error',
      });
    });
  });

  describe('collection accessors', () => {
    it('should return conversations collection', () => {
      service.conversations();
      expect(mockDb.collection).toHaveBeenCalledWith('conversations');
    });

    it('should return messages collection', () => {
      service.messages();
      expect(mockDb.collection).toHaveBeenCalledWith('messages');
    });

    it('should return users collection', () => {
      service.users();
      expect(mockDb.collection).toHaveBeenCalledWith('users');
    });
  });
});
