import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MongoServerError, ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplatesService } from './templates.service';
import { DatabaseService } from '../database/database.service';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let mockTemplatesCollection: any;

  const mockTemplateId = new ObjectId('507f1f77bcf86cd799439011');

  const mockTemplate = {
    _id: mockTemplateId,
    name: 'Test Template',
    content: 'You are a test assistant.',
    category: 'general',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockTemplatesCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: mockTemplateId }),
      insertMany: vi.fn().mockResolvedValue({ insertedCount: 10 }),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([mockTemplate]),
        }),
      }),
      findOne: vi.fn().mockResolvedValue(mockTemplate),
      findOneAndUpdate: vi.fn().mockResolvedValue(mockTemplate),
      findOneAndDelete: vi.fn().mockResolvedValue(mockTemplate),
      countDocuments: vi.fn().mockResolvedValue(10),
    };

    const mockDatabaseService = {
      templates: vi.fn().mockReturnValue(mockTemplatesCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  describe('onModuleInit (seeding)', () => {
    it('should skip seeding when templates already exist', async () => {
      mockTemplatesCollection.countDocuments.mockResolvedValue(5);
      await service.onModuleInit();
      expect(mockTemplatesCollection.insertMany).not.toHaveBeenCalled();
    });

    it('should seed defaults when collection is empty', async () => {
      mockTemplatesCollection.countDocuments.mockResolvedValue(0);
      await service.onModuleInit();
      expect(mockTemplatesCollection.insertMany).toHaveBeenCalledOnce();
      const docs = mockTemplatesCollection.insertMany.mock.calls[0][0];
      expect(docs.length).toBe(10);
      expect(docs[0]).toHaveProperty('name');
      expect(docs[0]).toHaveProperty('content');
      expect(docs[0]).toHaveProperty('category');
      expect(docs[0].isDefault).toBe(true);
    });
  });

  describe('getTemplates', () => {
    it('should return all templates sorted by category and name', async () => {
      const result = await service.getTemplates();
      expect(result).toEqual([mockTemplate]);
      expect(mockTemplatesCollection.find).toHaveBeenCalledWith({});
    });
  });

  describe('getTemplate', () => {
    it('should return a template by id', async () => {
      const result = await service.getTemplate(String(mockTemplateId));
      expect(result).toEqual(mockTemplate);
      expect(mockTemplatesCollection.findOne).toHaveBeenCalledWith({
        _id: mockTemplateId,
      });
    });

    it('should throw NotFoundException if template not found', async () => {
      mockTemplatesCollection.findOne.mockResolvedValue(null);
      await expect(service.getTemplate(String(mockTemplateId))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTemplate', () => {
    it('should create a template with defaults', async () => {
      const dto = { name: 'New Template', content: 'Content here' };
      const result = await service.createTemplate(dto);
      expect(result._id).toEqual(mockTemplateId);
      expect(result.name).toBe('New Template');
      expect(result.category).toBe('general');
      expect(result.isDefault).toBe(false);
      expect(mockTemplatesCollection.insertOne).toHaveBeenCalledOnce();
    });

    it('should create a template with explicit category', async () => {
      const dto = {
        name: 'Dev Template',
        content: 'Content',
        category: 'development',
      };
      const result = await service.createTemplate(dto);
      expect(result.category).toBe('development');
    });

    it('should throw ConflictException on duplicate name', async () => {
      const error = new MongoServerError({ message: 'duplicate key' });
      error.code = 11000;
      mockTemplatesCollection.insertOne.mockRejectedValue(error);
      await expect(
        service.createTemplate({ name: 'Dup', content: 'Content' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow non-duplicate errors', async () => {
      mockTemplatesCollection.insertOne.mockRejectedValue(
        new Error('connection failed'),
      );
      await expect(
        service.createTemplate({ name: 'Test', content: 'Content' }),
      ).rejects.toThrow('connection failed');
    });
  });

  describe('updateTemplate', () => {
    it('should update a template', async () => {
      const result = await service.updateTemplate(String(mockTemplateId), {
        name: 'Updated',
      });
      expect(result).toEqual(mockTemplate);
      expect(mockTemplatesCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockTemplateId },
        { $set: expect.objectContaining({ name: 'Updated' }) },
        { returnDocument: 'after' },
      );
    });

    it('should throw NotFoundException if template not found', async () => {
      mockTemplatesCollection.findOneAndUpdate.mockResolvedValue(null);
      await expect(
        service.updateTemplate(String(mockTemplateId), { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate name during update', async () => {
      const error = new MongoServerError({ message: 'duplicate key' });
      error.code = 11000;
      mockTemplatesCollection.findOneAndUpdate.mockRejectedValue(error);
      await expect(
        service.updateTemplate(String(mockTemplateId), { name: 'Dup' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should only update provided fields', async () => {
      await service.updateTemplate(String(mockTemplateId), {
        content: 'New content',
      });
      const setArg =
        mockTemplatesCollection.findOneAndUpdate.mock.calls[0][1].$set;
      expect(setArg).toHaveProperty('content', 'New content');
      expect(setArg).toHaveProperty('updatedAt');
      expect(setArg).not.toHaveProperty('name');
      expect(setArg).not.toHaveProperty('category');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      await service.deleteTemplate(String(mockTemplateId));
      expect(mockTemplatesCollection.findOneAndDelete).toHaveBeenCalledWith({
        _id: mockTemplateId,
      });
    });

    it('should throw NotFoundException if template not found', async () => {
      mockTemplatesCollection.findOneAndDelete.mockResolvedValue(null);
      await expect(
        service.deleteTemplate(String(mockTemplateId)),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
