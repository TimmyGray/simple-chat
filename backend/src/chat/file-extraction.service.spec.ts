import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileExtractionService } from './file-extraction.service';
import type { MessageDoc } from './interfaces/message.interface';
import { ObjectId } from 'mongodb';
vi.mock('fs');
vi.mock('pdf-parse', () => ({
  PDFParse: class MockPDFParse {
    async getText() {
      return { text: 'PDF content here' };
    }
    async destroy() {}
  },
}));

const UPLOADS_DIR = path.resolve('./uploads');

describe('FileExtractionService', () => {
  let service: FileExtractionService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FileExtractionService],
    }).compile();

    service = module.get<FileExtractionService>(FileExtractionService);
  });

  describe('extractFileContent', () => {
    it('should read text files as UTF-8', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('Hello text content');

      const result = await service.extractFileContent({
        filePath: `${UPLOADS_DIR}/test.txt`,
        fileType: 'text/plain',
        fileName: 'test.txt',
      });

      expect(result).toBe('Hello text content');
      expect(fs.readFileSync).toHaveBeenCalledWith(
        path.join(UPLOADS_DIR, 'test.txt'),
        'utf-8',
      );
    });

    it('should read markdown files as UTF-8', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('# Heading');

      const result = await service.extractFileContent({
        filePath: `${UPLOADS_DIR}/readme.md`,
        fileType: 'text/markdown',
        fileName: 'readme.md',
      });

      expect(result).toBe('# Heading');
    });

    it('should read CSV files as UTF-8', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('a,b,c');

      const result = await service.extractFileContent({
        filePath: `${UPLOADS_DIR}/data.csv`,
        fileType: 'text/csv',
        fileName: 'data.csv',
      });

      expect(result).toBe('a,b,c');
    });

    it('should extract PDF content via pdf-parse', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('pdf-bytes'));

      const result = await service.extractFileContent({
        filePath: `${UPLOADS_DIR}/doc.pdf`,
        fileType: 'application/pdf',
        fileName: 'doc.pdf',
      });

      expect(result).toBe('PDF content here');
    });

    it('should return binary placeholder for non-text, non-image file types', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await service.extractFileContent({
        filePath: `${UPLOADS_DIR}/archive.zip`,
        fileType: 'application/zip',
        fileName: 'archive.zip',
      });

      expect(result).toBe('[Binary file: archive.zip]');
    });

    it('should return null when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await service.extractFileContent({
        filePath: `${UPLOADS_DIR}/missing.txt`,
        fileType: 'text/plain',
        fileName: 'missing.txt',
      });

      expect(result).toBeNull();
    });

    it('should block path traversal attempts', async () => {
      // path.basename strips traversal, so the reconstructed path stays inside uploads
      // This test verifies the defense-in-depth startsWith check
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('secret data');

      await service.extractFileContent({
        filePath: '../../etc/passwd',
        fileType: 'text/plain',
        fileName: 'passwd',
      });

      // path.basename('../../etc/passwd') = 'passwd', joined with UPLOADS_DIR stays safe
      // The file is read from uploads/passwd, not /etc/passwd
      const expectedPath = path.join(UPLOADS_DIR, 'passwd');
      expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
    });

    it('should return error placeholder on read failure', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const result = await service.extractFileContent({
        filePath: `${UPLOADS_DIR}/locked.txt`,
        fileType: 'text/plain',
        fileName: 'locked.txt',
      });

      expect(result).toBe('[Could not read file: locked.txt]');
    });

    it('should rethrow ForbiddenException (not swallow it)', async () => {
      // Simulate a scenario where ForbiddenException is thrown
      vi.mocked(fs.existsSync).mockImplementation(() => {
        throw new ForbiddenException('test');
      });

      await expect(
        service.extractFileContent({
          filePath: `${UPLOADS_DIR}/file.txt`,
          fileType: 'text/plain',
          fileName: 'file.txt',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('buildLlmMessages', () => {
    const baseMessage = (overrides: Partial<MessageDoc>): MessageDoc => ({
      _id: new ObjectId(),
      conversationId: new ObjectId(),
      role: 'user',
      content: 'Hello',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    it('should convert user and assistant messages to LLM format', async () => {
      const messages: MessageDoc[] = [
        baseMessage({ role: 'user', content: 'Hi' }),
        baseMessage({ role: 'assistant', content: 'Hello!' }),
      ];

      const result = await service.buildLlmMessages(messages);

      expect(result).toEqual([
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello!' },
      ]);
    });

    it('should append file contents for user messages with attachments', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('file data');

      const messages: MessageDoc[] = [
        baseMessage({
          content: 'Check this file',
          attachments: [
            {
              fileName: 'notes.txt',
              fileType: 'text/plain',
              filePath: `${UPLOADS_DIR}/notes.txt`,
              fileSize: 100,
            },
          ],
        }),
      ];

      const result = await service.buildLlmMessages(messages);

      expect(result).toHaveLength(1);
      expect(result[0].content).toContain('Check this file');
      expect(result[0].content).toContain('[Attached file: notes.txt]');
      expect(result[0].content).toContain('file data');
    });

    it('should not modify assistant messages even with attachments', async () => {
      const messages: MessageDoc[] = [
        baseMessage({
          role: 'assistant',
          content: 'Response',
          attachments: [
            {
              fileName: 'ignored.txt',
              fileType: 'text/plain',
              filePath: `${UPLOADS_DIR}/ignored.txt`,
              fileSize: 50,
            },
          ],
        }),
      ];

      const result = await service.buildLlmMessages(messages);

      expect(result).toEqual([{ role: 'assistant', content: 'Response' }]);
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    it('should build multi-modal content parts for image attachments', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('fake-png'));

      const messages: MessageDoc[] = [
        baseMessage({
          content: 'What is in this image?',
          attachments: [
            {
              fileName: 'photo.png',
              fileType: 'image/png',
              filePath: `${UPLOADS_DIR}/photo.png`,
              fileSize: 1000,
            },
          ],
        }),
      ];

      const result = await service.buildLlmMessages(messages);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('user');
      const content = result[0].content as any[];
      expect(Array.isArray(content)).toBe(true);
      expect(content).toHaveLength(2);
      expect(content[0]).toEqual({
        type: 'text',
        text: 'What is in this image?',
      });
      expect(content[1].type).toBe('image_url');
      expect(content[1].image_url.url).toMatch(/^data:image\/png;base64,/);
    });

    it('should mix text attachments and images in multi-modal content', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation((filePath: any) => {
        if (String(filePath).endsWith('.txt')) return 'text data';
        return Buffer.from('image-bytes');
      });

      const messages: MessageDoc[] = [
        baseMessage({
          content: 'Analyze these',
          attachments: [
            {
              fileName: 'notes.txt',
              fileType: 'text/plain',
              filePath: `${UPLOADS_DIR}/notes.txt`,
              fileSize: 50,
            },
            {
              fileName: 'chart.jpeg',
              fileType: 'image/jpeg',
              filePath: `${UPLOADS_DIR}/chart.jpeg`,
              fileSize: 2000,
            },
          ],
        }),
      ];

      const result = await service.buildLlmMessages(messages);

      expect(result).toHaveLength(1);
      const content = result[0].content as any[];
      expect(Array.isArray(content)).toBe(true);
      expect(content).toHaveLength(2);
      // Text part should include original text + extracted text attachment
      expect(content[0].type).toBe('text');
      expect(content[0].text).toContain('Analyze these');
      expect(content[0].text).toContain('[Attached file: notes.txt]');
      expect(content[0].text).toContain('text data');
      // Image part
      expect(content[1].type).toBe('image_url');
      expect(content[1].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should use plain text format when only non-image attachments', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('file data');

      const messages: MessageDoc[] = [
        baseMessage({
          content: 'Check this',
          attachments: [
            {
              fileName: 'data.csv',
              fileType: 'text/csv',
              filePath: `${UPLOADS_DIR}/data.csv`,
              fileSize: 100,
            },
          ],
        }),
      ];

      const result = await service.buildLlmMessages(messages);

      expect(result).toHaveLength(1);
      // Should be a plain string, not an array
      expect(typeof result[0].content).toBe('string');
      expect(result[0].content).toContain('[Attached file: data.csv]');
    });
  });

  describe('isImageFile', () => {
    it('should return true for image MIME types', () => {
      expect(service.isImageFile('image/png')).toBe(true);
      expect(service.isImageFile('image/jpeg')).toBe(true);
      expect(service.isImageFile('image/gif')).toBe(true);
      expect(service.isImageFile('image/webp')).toBe(true);
    });

    it('should return false for non-image MIME types', () => {
      expect(service.isImageFile('text/plain')).toBe(false);
      expect(service.isImageFile('application/pdf')).toBe(false);
      expect(service.isImageFile('text/csv')).toBe(false);
    });
  });
});
