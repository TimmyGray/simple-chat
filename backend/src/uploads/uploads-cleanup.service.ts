import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsCleanupService {
  private readonly logger = new Logger(UploadsCleanupService.name);
  private readonly uploadsDir = path.resolve('./uploads');
  private readonly ttlMs: number;

  constructor(private readonly configService: ConfigService) {
    const ttlHours = this.configService.get<number>('uploads.ttlHours', 24);
    this.ttlMs = ttlHours * 60 * 60 * 1000;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup() {
    this.logger.log('Starting upload cleanup...');
    let deleted = 0;

    try {
      if (!fs.existsSync(this.uploadsDir)) {
        return;
      }

      const files = fs.readdirSync(this.uploadsDir);
      const now = Date.now();

      for (const file of files) {
        // Guard against path traversal from unexpected directory entries
        if (file.includes('..') || file.includes(path.sep)) continue;

        const filePath = path.join(this.uploadsDir, file);

        try {
          const stat = fs.statSync(filePath);
          if (!stat.isFile()) continue;

          const age = now - stat.mtimeMs;
          if (age > this.ttlMs) {
            try {
              fs.unlinkSync(filePath);
              deleted++;
            } catch (unlinkErr) {
              // File may have been deleted between stat and unlink (TOCTOU)
              if ((unlinkErr as NodeJS.ErrnoException).code !== 'ENOENT') throw unlinkErr;
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          this.logger.warn(`Failed to process file ${file}: ${message}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Cleanup failed: ${message}`, stack);
    }

    this.logger.log(`Upload cleanup complete: ${deleted} file(s) removed`);
  }
}
