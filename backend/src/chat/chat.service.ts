import {
  Injectable,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import { DatabaseService } from '../database/database.service';
import { ConversationDoc } from './interfaces/conversation.interface';
import { MessageDoc } from './interfaces/message.interface';
import { StreamEvent } from './interfaces/stream-event.interface';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

const UPLOADS_DIR = path.resolve('./uploads');

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI;

  constructor(
    private readonly databaseService: DatabaseService,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openrouter.apiKey'),
      baseURL: this.configService.get<string>('openrouter.baseUrl'),
      defaultHeaders: {
        'HTTP-Referer': this.configService.get<string>('corsOrigin'),
        'X-Title': 'Simple Chat',
      },
    });
    this.logger.log(
      `OpenAI client initialized with baseURL: ${this.configService.get<string>('openrouter.baseUrl')}`,
    );
  }

  async createConversation(
    dto: CreateConversationDto,
    userId: ObjectId,
  ): Promise<ConversationDoc> {
    const now = new Date();
    const doc = {
      userId,
      title: dto.title || 'New Chat',
      model: dto.model || 'openrouter/free',
      createdAt: now,
      updatedAt: now,
    };
    const result = await this.databaseService.conversations().insertOne(doc);
    const saved: ConversationDoc = { _id: result.insertedId, ...doc };
    this.logger.log(`Conversation created: ${String(saved._id)}`);
    return saved;
  }

  async getConversations(userId: ObjectId): Promise<ConversationDoc[]> {
    const conversations = await this.databaseService
      .conversations()
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();
    this.logger.debug(`Fetched ${conversations.length} conversations`);
    return conversations;
  }

  async getConversation(
    id: string,
    userId: ObjectId,
  ): Promise<ConversationDoc> {
    const conversation = await this.databaseService
      .conversations()
      .findOne({ _id: new ObjectId(id), userId });
    if (!conversation) {
      this.logger.warn(`Conversation not found: ${id}`);
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async updateConversation(
    id: string,
    dto: UpdateConversationDto,
    userId: ObjectId,
  ): Promise<ConversationDoc> {
    const conversation = await this.databaseService
      .conversations()
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId },
        { $set: { ...dto, updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
    if (!conversation) {
      this.logger.warn(`Conversation not found for update: ${id}`);
      throw new NotFoundException('Conversation not found');
    }
    this.logger.log(`Conversation updated: ${id}`);
    return conversation;
  }

  async deleteConversation(id: string, userId: ObjectId): Promise<void> {
    const conversation = await this.databaseService
      .conversations()
      .findOne({ _id: new ObjectId(id), userId });
    if (!conversation) {
      this.logger.warn(`Conversation not found for deletion: ${id}`);
      throw new NotFoundException('Conversation not found');
    }
    await this.databaseService
      .messages()
      .deleteMany({ conversationId: new ObjectId(id) });
    await this.databaseService
      .conversations()
      .findOneAndDelete({ _id: new ObjectId(id), userId });
    this.logger.log(`Conversation deleted: ${id} (with messages)`);
  }

  async getMessages(
    conversationId: string,
    userId: ObjectId,
  ): Promise<MessageDoc[]> {
    // Verify conversation ownership before returning messages
    await this.getConversation(conversationId, userId);

    const messages = await this.databaseService
      .messages()
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();
    this.logger.debug(
      `Fetched ${messages.length} messages for conversation ${conversationId}`,
    );
    return messages;
  }

  async *sendMessageAndStream(
    conversationId: string,
    dto: SendMessageDto,
    userId: ObjectId,
    abortSignal?: AbortSignal,
  ): AsyncGenerator<StreamEvent> {
    const conversation = await this.getConversation(conversationId, userId);
    const model = dto.model || conversation.model;

    // Save user message
    const now = new Date();
    await this.databaseService.messages().insertOne({
      conversationId: new ObjectId(conversationId),
      role: 'user',
      content: dto.content,
      attachments: dto.attachments || [],
      createdAt: now,
      updatedAt: now,
    });
    this.logger.debug(`User message saved for conversation ${conversationId}`);

    // Auto-title: use first message as conversation title
    const messageCount = await this.databaseService
      .messages()
      .countDocuments({ conversationId: new ObjectId(conversationId) });
    if (messageCount === 1) {
      const title =
        dto.content.length > 50
          ? dto.content.substring(0, 50) + '...'
          : dto.content;
      await this.databaseService
        .conversations()
        .findOneAndUpdate(
          { _id: new ObjectId(conversationId), userId },
          { $set: { title, updatedAt: new Date() } },
        );
      this.logger.debug(
        `Auto-titled conversation ${conversationId}: "${title}"`,
      );
    }

    // Build message history for LLM
    const messages = await this.databaseService
      .messages()
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();
    const llmMessages = await this.buildLlmMessages(messages);

    let fullContent = '';

    try {
      this.logger.log(
        `Starting LLM stream: model="${model}", messages=${llmMessages.length}, conversation=${conversationId}`,
      );
      const stream = await this.openai.chat.completions.create({
        model,
        messages: llmMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        if (abortSignal?.aborted) {
          this.logger.log(
            `Client disconnected during stream for conversation ${conversationId}`,
          );
          stream.controller.abort();
          break;
        }

        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          yield { type: 'content', content };
        }
      }

      // Save assistant message if we got any content
      if (fullContent.length > 0) {
        const assistantNow = new Date();
        await this.databaseService.messages().insertOne({
          conversationId: new ObjectId(conversationId),
          role: 'assistant',
          content: fullContent,
          model,
          attachments: [],
          createdAt: assistantNow,
          updatedAt: assistantNow,
        });
      }

      this.logger.log(
        `Stream complete for conversation ${conversationId}: ${fullContent.length} chars`,
      );
      yield { type: 'done' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `LLM stream failed for conversation ${conversationId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      yield { type: 'error', message: errorMessage };
    }
  }

  private async buildLlmMessages(
    messages: MessageDoc[],
  ): Promise<OpenAI.Chat.ChatCompletionMessageParam[]> {
    const llmMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        let content = msg.content;

        // Append file contents for attachments
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

  private async extractFileContent(attachment: {
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
