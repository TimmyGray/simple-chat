import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import PDFDocument from 'pdfkit';
import { DatabaseService } from '../database/database.service';
import { getErrorMessage } from '../common/utils/get-error-message';
import type { ConversationDoc } from './interfaces/conversation.interface';
import type { MessageDoc } from './interfaces/message.interface';
// SYNC: Keep ExportFormat in sync with frontend/src/api/client.ts
import type { ExportFormat } from './dto/export-conversation.dto';

const MAX_EXPORT_MESSAGES = 10_000;

const PDF_COLORS = {
  metadata: '#666666',
  separator: '#cccccc',
  userRole: '#7c4dff',
  assistantRole: '#00bfa5',
  timestamp: '#999999',
  content: '#333333',
  attachment: '#888888',
} as const;

interface ExportResult {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async exportConversation(
    conversationId: string,
    userId: ObjectId,
    format: ExportFormat,
  ): Promise<ExportResult> {
    const conversation = await this.getConversation(conversationId, userId);
    const messages = await this.getMessages(conversationId);

    const safeTitle = this.sanitizeFileName(conversation.title);

    switch (format) {
      case 'markdown':
        return this.toMarkdown(conversation, messages, safeTitle);
      case 'json':
        return this.toJson(conversation, messages, safeTitle);
      case 'pdf':
        return this.toPdf(conversation, messages, safeTitle);
    }
  }

  private async getConversation(
    id: string,
    userId: ObjectId,
  ): Promise<ConversationDoc> {
    const conversation = await this.databaseService
      .conversations()
      .findOne({ _id: new ObjectId(id), userId });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  private async getMessages(conversationId: string): Promise<MessageDoc[]> {
    return this.databaseService
      .messages()
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .limit(MAX_EXPORT_MESSAGES)
      .toArray();
  }

  private sanitizeFileName(title: string): string {
    const sanitized = title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
      .toLowerCase()
      .replace(/^-+|-+$/g, '');
    return sanitized || 'conversation';
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  private toMarkdown(
    conversation: ConversationDoc,
    messages: MessageDoc[],
    safeTitle: string,
  ): ExportResult {
    const lines: string[] = [];
    lines.push(`# ${conversation.title}`);
    lines.push('');
    lines.push(`**Model:** ${conversation.model}`);
    lines.push(`**Created:** ${this.formatDate(conversation.createdAt)}`);
    lines.push(`**Messages:** ${messages.length}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const msg of messages) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const time = this.formatDate(msg.createdAt);
      lines.push(`### ${role}`);
      lines.push(`*${time}*`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');

      if (msg.attachments?.length) {
        lines.push(
          `**Attachments:** ${msg.attachments.map((a) => a.fileName).join(', ')}`,
        );
        lines.push('');
      }
    }

    const content = lines.join('\n');

    return {
      buffer: Buffer.from(content, 'utf-8'),
      contentType: 'text/markdown; charset=utf-8',
      fileName: `${safeTitle}.md`,
    };
  }

  private toJson(
    conversation: ConversationDoc,
    messages: MessageDoc[],
    safeTitle: string,
  ): ExportResult {
    const data = {
      exportedAt: new Date().toISOString(),
      conversation: {
        id: String(conversation._id),
        title: conversation.title,
        model: conversation.model,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages: messages.map((msg) => ({
        id: String(msg._id),
        role: msg.role,
        content: msg.content,
        model: msg.model,
        isEdited: msg.isEdited ?? false,
        attachments:
          msg.attachments?.map((a) => ({
            fileName: a.fileName,
            fileType: a.fileType,
            fileSize: a.fileSize,
          })) ?? [],
        tokenUsage: msg.promptTokens
          ? {
              promptTokens: msg.promptTokens,
              completionTokens: msg.completionTokens,
              totalTokens: msg.totalTokens,
            }
          : undefined,
        createdAt: msg.createdAt.toISOString(),
      })),
      totalMessages: messages.length,
    };

    const content = JSON.stringify(data, null, 2);

    return {
      buffer: Buffer.from(content, 'utf-8'),
      contentType: 'application/json; charset=utf-8',
      fileName: `${safeTitle}.json`,
    };
  }

  private async toPdf(
    conversation: ConversationDoc,
    messages: MessageDoc[],
    safeTitle: string,
  ): Promise<ExportResult> {
    return new Promise<ExportResult>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        this.logger.debug(
          `PDF generated for conversation ${String(conversation._id)}: ${buffer.length} bytes`,
        );
        resolve({
          buffer,
          contentType: 'application/pdf',
          fileName: `${safeTitle}.pdf`,
        });
      });
      doc.on('error', reject);

      try {
        // Title
        doc.fontSize(20).text(conversation.title, { align: 'center' });
        doc.moveDown(0.5);

        // Metadata
        doc
          .fontSize(10)
          .fillColor(PDF_COLORS.metadata)
          .text(`Model: ${conversation.model}`, { align: 'center' });
        doc.text(`Created: ${this.formatDate(conversation.createdAt)}`, {
          align: 'center',
        });
        doc.text(`Messages: ${messages.length}`, { align: 'center' });
        doc.moveDown(1);

        // Separator
        doc
          .strokeColor(PDF_COLORS.separator)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();
        doc.moveDown(0.5);

        // Messages
        for (const msg of messages) {
          const isUser = msg.role === 'user';
          const role = isUser ? 'User' : 'Assistant';
          const time = this.formatDate(msg.createdAt);

          // Role header
          doc
            .fontSize(12)
            .fillColor(isUser ? PDF_COLORS.userRole : PDF_COLORS.assistantRole)
            .text(role, { continued: true });
          doc.fontSize(8).fillColor(PDF_COLORS.timestamp).text(`  ${time}`);

          // Content
          doc.fontSize(10).fillColor(PDF_COLORS.content).text(msg.content, {
            width: 495,
            lineGap: 2,
          });

          // Attachments
          if (msg.attachments?.length) {
            doc
              .fontSize(8)
              .fillColor(PDF_COLORS.attachment)
              .text(
                `Attachments: ${msg.attachments.map((a) => a.fileName).join(', ')}`,
              );
          }

          doc.moveDown(0.5);
        }

        doc.end();
      } catch (err) {
        reject(new Error(getErrorMessage(err)));
      }
    });
  }
}
