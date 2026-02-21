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

    it('should allow optional token usage fields', () => {
      const schema = messagesSchema.$jsonSchema;
      expect(schema.required).not.toContain('promptTokens');
      expect(schema.required).not.toContain('completionTokens');
      expect(schema.required).not.toContain('totalTokens');
      expect(schema.properties.promptTokens).toBeDefined();
      expect(schema.properties.completionTokens).toBeDefined();
      expect(schema.properties.totalTokens).toBeDefined();
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

    it('should disallow additional properties', () => {
      expect(messagesSchema.$jsonSchema.additionalProperties).toBe(false);
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

    it('should allow optional token usage fields', () => {
      const schema = usersSchema.$jsonSchema;
      expect(schema.required).not.toContain('totalTokensUsed');
      expect(schema.required).not.toContain('totalPromptTokens');
      expect(schema.required).not.toContain('totalCompletionTokens');
      expect(schema.properties.totalTokensUsed).toBeDefined();
      expect(schema.properties.totalPromptTokens).toBeDefined();
      expect(schema.properties.totalCompletionTokens).toBeDefined();
    });

    it('should disallow additional properties', () => {
      expect(usersSchema.$jsonSchema.additionalProperties).toBe(false);
    });
  });
});
