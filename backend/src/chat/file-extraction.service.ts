import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import type OpenAI from 'openai';
import type { MessageDoc } from './interfaces/message.interface';

const UPLOADS_DIR = path.resolve('./uploads');

@Injectable()
export class FileExtractionService {
  private readonly logger = new Logger(FileExtractionService.name);

  async buildLlmMessages(
    messages: MessageDoc[],
  ): Promise<OpenAI.Chat.ChatCompletionMessageParam[]> {
    const llmMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        let content = msg.content;

        if (msg.attachments && msg.attachments.length > 0) {
          for (const attachment of msg.attachments) {
            const fileContent = await this.extractFileContent(attachment);
            if (fileContent) {
              content += `\n\n[Attached file: ${attachment.fileName}]\n${fileContent}`;
            }
          }
        }

        llmMessages.push({ role: 'user', content });
      } else {
        llmMessages.push({ role: 'assistant', content: msg.content });
      }
    }

    return llmMessages;
  }

  async extractFileContent(attachment: {
    filePath: string;
    fileType: string;
    fileName: string;
  }): Promise<string | null> {
    try {
      // Reconstruct path from basename only to prevent path traversal
      const fileName = path.basename(attachment.filePath);
      const fullPath = path.join(UPLOADS_DIR, fileName);

      // Defense-in-depth: resolved path must still be inside the uploads directory
      if (!fullPath.startsWith(UPLOADS_DIR + path.sep)) {
        this.logger.warn(
          `Path traversal attempt blocked: "${attachment.filePath}" → "${fullPath}"`,
        );
        throw new ForbiddenException(
          'Access denied: file path outside uploads directory',
        );
      }

      if (!fs.existsSync(fullPath)) {
        this.logger.warn(`File not found: "${fullPath}"`);
        return null;
      }

      this.logger.debug(
        `Extracting content from "${attachment.fileName}" (${attachment.fileType})`,
      );

      if (
        attachment.fileType === 'text/plain' ||
        attachment.fileName.endsWith('.txt') ||
        attachment.fileName.endsWith('.md') ||
        attachment.fileName.endsWith('.csv')
      ) {
        return fs.readFileSync(fullPath, 'utf-8');
      }

      if (
        attachment.fileType === 'application/pdf' ||
        attachment.fileName.endsWith('.pdf')
      ) {
        const buffer = fs.readFileSync(fullPath);
        const parser = new PDFParse({ data: buffer });
        try {
          const result = await parser.getText();
          return result.text;
        } finally {
          await parser.destroy();
        }
      }

      return `[Binary file: ${attachment.fileName}]`;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(
        `Failed to extract content from "${attachment.fileName}": ${error instanceof Error ? error.message : error}`,
      );
      return `[Could not read file: ${attachment.fileName}]`;
    }
  }
}
