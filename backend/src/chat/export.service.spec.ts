import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportService } from './export.service';
import { DatabaseService } from '../database/database.service';

describe('ExportService', () => {
  let service: ExportService;
  let dbService: any;

  const mockUserId = new ObjectId('607f1f77bcf86cd799439099');
  const mockConvId = '507f1f77bcf86cd799439011';

  const mockConversation = {
    _id: new ObjectId(mockConvId),
    userId: mockUserId,
    title: 'Test Chat',
    model: 'openrouter/free',
    createdAt: new Date('2026-01-15T10:00:00Z'),
    updatedAt: new Date('2026-01-15T11:00:00Z'),
  };

  const mockMessages = [
    {
      _id: new ObjectId('507f1f77bcf86cd799439012'),
      conversationId: new ObjectId(mockConvId),
      role: 'user' as const,
      content: 'Hello, how are you?',
      attachments: [],
      createdAt: new Date('2026-01-15T10:01:00Z'),
      updatedAt: new Date('2026-01-15T10:01:00Z'),
    },
    {
      _id: new ObjectId('507f1f77bcf86cd799439013'),
      conversationId: new ObjectId(mockConvId),
      role: 'assistant' as const,
      content: 'I am doing well, thank you!',
      model: 'openrouter/free',
      attachments: [
        {
          fileName: 'doc.pdf',
          fileType: 'application/pdf',
          filePath: '/uploads/doc.pdf',
          fileSize: 1024,
        },
      ],
      promptTokens: 10,
      completionTokens: 8,
      totalTokens: 18,
      createdAt: new Date('2026-01-15T10:01:05Z'),
      updatedAt: new Date('2026-01-15T10:01:05Z'),
    },
  ];

  beforeEach(async () => {
    const mockConversationsCollection = {
      findOne: vi.fn().mockResolvedValue(mockConversation),
    };
    const mockMessagesCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(mockMessages),
          }),
        }),
      }),
    };

    dbService = {
      conversations: vi.fn().mockReturnValue(mockConversationsCollection),
      messages: vi.fn().mockReturnValue(mockMessagesCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: DatabaseService, useValue: dbService },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
  });

  it('should throw NotFoundException when conversation not found', async () => {
    dbService.conversations().findOne.mockResolvedValue(null);
    await expect(
      service.exportConversation(mockConvId, mockUserId, 'markdown'),
    ).rejects.toThrow(NotFoundException);
  });

  describe('markdown export', () => {
    it('should return markdown with correct content type and extension', async () => {
      const result = await service.exportConversation(
        mockConvId,
        mockUserId,
        'markdown',
      );
      expect(result.contentType).toBe('text/markdown; charset=utf-8');
      expect(result.fileName).toMatch(/\.md$/);
    });

    it('should include conversation title and messages', async () => {
      const result = await service.exportConversation(
        mockConvId,
        mockUserId,
        'markdown',
      );
      const content = result.buffer.toString('utf-8');
      expect(content).toContain('# Test Chat');
      expect(content).toContain('### User');
      expect(content).toContain('Hello, how are you?');
      expect(content).toContain('### Assistant');
      expect(content).toContain('I am doing well, thank you!');
    });

    it('should include attachment names', async () => {
      const result = await service.exportConversation(
        mockConvId,
        mockUserId,
        'markdown',
      );
      const content = result.buffer.toString('utf-8');
      expect(content).toContain('doc.pdf');
    });
  });

  describe('json export', () => {
    it('should return valid JSON with correct content type', async () => {
      const result = await service.exportConversation(
        mockConvId,
        mockUserId,
        'json',
      );
      expect(result.contentType).toBe('application/json; charset=utf-8');
      expect(result.fileName).toMatch(/\.json$/);
      const data = JSON.parse(result.buffer.toString('utf-8'));
      expect(data.conversation.title).toBe('Test Chat');
      expect(data.messages).toHaveLength(2);
      expect(data.totalMessages).toBe(2);
    });

    it('should include token usage when present', async () => {
      const result = await service.exportConversation(
        mockConvId,
        mockUserId,
        'json',
      );
      const data = JSON.parse(result.buffer.toString('utf-8'));
      expect(data.messages[1].tokenUsage).toEqual({
        promptTokens: 10,
        completionTokens: 8,
        totalTokens: 18,
      });
    });

    it('should omit token usage when not present', async () => {
      const result = await service.exportConversation(
        mockConvId,
        mockUserId,
        'json',
      );
      const data = JSON.parse(result.buffer.toString('utf-8'));
      expect(data.messages[0].tokenUsage).toBeUndefined();
    });
  });

  describe('pdf export', () => {
    it('should return PDF buffer with correct content type', async () => {
      const result = await service.exportConversation(
        mockConvId,
        mockUserId,
        'pdf',
      );
      expect(result.contentType).toBe('application/pdf');
      expect(result.fileName).toMatch(/\.pdf$/);
      expect(result.buffer.length).toBeGreaterThan(0);
      // PDF files start with %PDF
      expect(result.buffer.toString('utf-8', 0, 5)).toBe('%PDF-');
    });
  });
});
