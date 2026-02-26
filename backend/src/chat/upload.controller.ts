import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { basename, extname, join, resolve } from 'path';
import { existsSync } from 'fs';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const uploadLogger = new Logger('FileUpload');
const UPLOADS_DIR = resolve('./uploads');

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
};

@Controller('api')
@UseGuards(JwtAuthGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'text/csv',
          'image/png',
          'image/jpeg',
          'image/gif',
          'image/webp',
        ];
        const allowed = allowedMimes.includes(file.mimetype);
        if (!allowed) {
          uploadLogger.warn(
            `Rejected file "${file.originalname}" with mime type "${file.mimetype}"`,
          );
        }
        cb(null, allowed);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    this.logger.log(
      `Uploaded ${files.length} file(s): ${files.map((f) => `${f.originalname} (${(f.size / 1024).toFixed(1)}KB)`).join(', ')}`,
    );
    return files.map((file) => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path,
      fileSize: file.size,
    }));
  }

  @Get('uploads/:filename')
  serveUploadedFile(@Param('filename') filename: string, @Res() res: Response) {
    const safeName = basename(filename);
    const fullPath = join(UPLOADS_DIR, safeName);

    if (!fullPath.startsWith(UPLOADS_DIR)) {
      throw new ForbiddenException('Access denied');
    }
    if (!existsSync(fullPath)) {
      throw new NotFoundException('File not found');
    }

    const ext = extname(safeName).toLowerCase();
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=86400',
    });
    createReadStream(fullPath).pipe(res);
  }
}
