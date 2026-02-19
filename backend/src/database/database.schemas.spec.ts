import { describe, it, expect } from 'vitest';
import {
  conversationsSchema,
  messagesSchema,
  usersSchema,
} from './database.schemas';

describe('Database Schemas', () => {
  describe('conversationsSchema', () => {
    it('should require userId, title, model, createdAt, updatedAt', () => {
      const schema = conversationsSchema.$jsonSchema;
      expect(schema.required).toEqual([
        'userId',
        'title',
        'model',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('should define all ConversationDoc fields', () => {
      const props = conversationsSchema.$jsonSchema.properties;
      expect(Object.keys(props)).toEqual([
        '_id',
        'userId',
        'title',
        'model',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('should disallow additional properties', () => {
      expect(conversationsSchema.$jsonSchema.additionalProperties).toBe(false);
    });
  });

  describe('messagesSchema', () => {
    it('should require conversationId, role, content, attachments, createdAt, updatedAt', () => {
      const schema = messagesSchema.$jsonSchema;
      expect(schema.required).toEqual([
        'conversationId',
        'role',
        'content',
        'attachments',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('should restrict role to user or assistant', () => {
      const roleSchema = messagesSchema.$jsonSchema.properties.role;
      expect(roleSchema.enum).toEqual(['user', 'assistant']);
    });

    it('should allow optional model field', () => {
      const schema = messagesSchema.$jsonSchema;
      expect(schema.required).not.toContain('model');
      expect(schema.properties.model).toBeDefined();
    });

    it('should define attachment sub-schema with required fields', () => {
      const attachmentSchema =
        messagesSchema.$jsonSchema.properties.attachments.items;
      expect(attachmentSchema.required).toEqual([
        'fileName',
        'fileType',
        'filePath',
        'fileSize',
      ]);
    });
  });

  describe('usersSchema', () => {
    it('should require email, password, createdAt, updatedAt', () => {
      const schema = usersSchema.$jsonSchema;
      expect(schema.required).toEqual([
        'email',
        'password',
        'createdAt',
        'updatedAt',
      ]);
    });

    it('should disallow additional properties', () => {
      expect(usersSchema.$jsonSchema.additionalProperties).toBe(false);
    });
  });
});
