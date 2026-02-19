import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { UploadsCleanupService } from './uploads-cleanup.service';

vi.mock('fs');

describe('UploadsCleanupService', () => {
  let service: UploadsCleanupService;

  const uploadsDir = path.resolve('./uploads');

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([] as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsCleanupService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string, defaultValue?: any) => {
              if (key === 'uploads.ttlHours') return 24;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadsCleanupService>(UploadsCleanupService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should skip if uploads directory does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    service.handleCleanup();
    expect(fs.readdirSync).not.toHaveBeenCalled();
  });

  it('should delete files older than TTL', () => {
    const now = Date.now();
    const oldTime = now - 25 * 60 * 60 * 1000; // 25 hours ago

    vi.mocked(fs.readdirSync).mockReturnValue(['old-file.txt'] as any);
    vi.mocked(fs.statSync).mockReturnValue({
      isFile: () => true,
      mtimeMs: oldTime,
    } as any);
    vi.mocked(fs.unlinkSync).mockReturnValue(undefined);

    service.handleCleanup();

    expect(fs.unlinkSync).toHaveBeenCalledWith(
      path.join(uploadsDir, 'old-file.txt'),
    );
  });

  it('should keep files newer than TTL', () => {
    const now = Date.now();
    const recentTime = now - 1 * 60 * 60 * 1000; // 1 hour ago

    vi.mocked(fs.readdirSync).mockReturnValue(['new-file.txt'] as any);
    vi.mocked(fs.statSync).mockReturnValue({
      isFile: () => true,
      mtimeMs: recentTime,
    } as any);

    service.handleCleanup();

    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });

  it('should skip directories', () => {
    vi.mocked(fs.readdirSync).mockReturnValue(['some-dir'] as any);
    vi.mocked(fs.statSync).mockReturnValue({
      isFile: () => false,
      mtimeMs: 0,
    } as any);

    service.handleCleanup();

    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
});
