import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectId, MongoServerError } from 'mongodb';
import OpenAI from 'openai';
import { DatabaseService } from '../database/database.service';
import type { TokenUsage } from '../types/documents';
import { FileExtractionService } from './file-extraction.service';
import { ConversationDoc } from './interfaces/conversation.interface';
import { MessageDoc } from './interfaces/message.interface';
import { StreamEvent } from './interfaces/stream-event.interface';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fileExtractionService: FileExtractionService,
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
    idempotencyKey?: string,
  ): AsyncGenerator<StreamEvent> {
    const conversation = await this.getConversation(conversationId, userId);
    const model = dto.model || conversation.model;

    // Save user message (with optional idempotency key for duplicate detection)
    const now = new Date();
    try {
      await this.databaseService.messages().insertOne({
        conversationId: new ObjectId(conversationId),
        role: 'user' as const,
        content: dto.content,
        attachments: dto.attachments || [],
        createdAt: now,
        updatedAt: now,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      });
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000 &&
        idempotencyKey
      ) {
        this.logger.warn(
          `Duplicate message rejected (idempotencyKey=${idempotencyKey})`,
        );
        throw new ConflictException('Duplicate message');
      }
      throw error;
    }
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
    const llmMessages =
      await this.fileExtractionService.buildLlmMessages(messages);

    let fullContent = '';
    let usage: TokenUsage | undefined;

    try {
      this.logger.log(
        `Starting LLM stream: model="${model}", messages=${llmMessages.length}, conversation=${conversationId}`,
      );
      const stream = await this.openai.chat.completions.create({
        model,
        messages: llmMessages,
        stream: true,
        stream_options: { include_usage: true },
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

        // Extract token usage from the final chunk
        if (chunk.usage) {
          usage = {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          };
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
          ...(usage
            ? {
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens,
              }
            : {}),
          createdAt: assistantNow,
          updatedAt: assistantNow,
        });
      }

      // Update user cumulative token usage
      if (usage) {
        await this.databaseService.users().updateOne(
          { _id: userId },
          {
            $inc: {
              totalTokensUsed: usage.totalTokens,
              totalPromptTokens: usage.promptTokens,
              totalCompletionTokens: usage.completionTokens,
            },
          },
        );
        this.logger.debug(
          `Token usage for conversation ${conversationId}: prompt=${usage.promptTokens}, completion=${usage.completionTokens}, total=${usage.totalTokens}`,
        );
      }

      this.logger.log(
        `Stream complete for conversation ${conversationId}: ${fullContent.length} chars`,
      );
      yield { type: 'done', usage };
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
}
