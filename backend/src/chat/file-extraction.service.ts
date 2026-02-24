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
      const fullPath = this.resolveUploadPath(attachment.filePath);
      if (!fullPath) return null;

      this.logger.debug(
        `Extracting content from "${attachment.fileName}" (${attachment.fileType})`,
      );

      if (this.isTextFile(attachment.fileType, attachment.fileName)) {
        return fs.readFileSync(fullPath, 'utf-8');
      }

      if (this.isPdfFile(attachment.fileType, attachment.fileName)) {
        return await this.readPdfContent(fullPath);
      }

      return `[Binary file: ${attachment.fileName}]`;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(
        `Failed to extract content from "${attachment.fileName}": ${error instanceof Error ? error.message : String(error)}`,
      );
      return `[Could not read file: ${attachment.fileName}]`;
    }
  }

  private resolveUploadPath(filePath: string): string | null {
    const fileName = path.basename(filePath);
    const fullPath = path.join(UPLOADS_DIR, fileName);

    if (!fullPath.startsWith(UPLOADS_DIR + path.sep)) {
      this.logger.warn(
        `Path traversal attempt blocked: "${filePath}" → "${fullPath}"`,
      );
      throw new ForbiddenException(
        'Access denied: file path outside uploads directory',
      );
    }

    if (!fs.existsSync(fullPath)) {
      this.logger.warn(`File not found: "${fullPath}"`);
      return null;
    }

    return fullPath;
  }

  private isTextFile(fileType: string, fileName: string): boolean {
    return (
      fileType === 'text/plain' ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.csv')
    );
  }

  private isPdfFile(fileType: string, fileName: string): boolean {
    return fileType === 'application/pdf' || fileName.endsWith('.pdf');
  }

  private async readPdfContent(fullPath: string): Promise<string> {
    const buffer = fs.readFileSync(fullPath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }
}
