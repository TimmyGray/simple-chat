import { Document } from 'mongodb';

/**
 * MongoDB JSON Schema validators for all collections.
 * Applied at database level via collMod command in DatabaseService.onModuleInit().
 *
 * These schemas enforce runtime document structure as a safety net
 * beyond TypeScript compile-time checks.
 */

export const conversationsSchema: Document = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['userId', 'title', 'model', 'createdAt', 'updatedAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      userId: { bsonType: 'objectId' },
      title: { bsonType: 'string' },
      model: { bsonType: 'string' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
    additionalProperties: false,
  },
};

export const messagesSchema: Document = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'conversationId',
      'role',
      'content',
      'attachments',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      _id: { bsonType: 'objectId' },
      conversationId: { bsonType: 'objectId' },
      role: { bsonType: 'string', enum: ['user', 'assistant'] },
      content: { bsonType: 'string' },
      model: { bsonType: 'string' },
      attachments: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['fileName', 'fileType', 'filePath', 'fileSize'],
          properties: {
            fileName: { bsonType: 'string' },
            fileType: { bsonType: 'string' },
            filePath: { bsonType: 'string' },
            fileSize: { bsonType: ['int', 'long', 'double'] },
          },
          additionalProperties: false,
        },
      },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
    additionalProperties: false,
  },
};

export const usersSchema: Document = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['email', 'password', 'createdAt', 'updatedAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      email: { bsonType: 'string' },
      password: { bsonType: 'string' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
    additionalProperties: false,
  },
};
