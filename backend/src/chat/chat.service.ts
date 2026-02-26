import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ObjectId, MongoServerError } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import { LlmStreamService } from './llm-stream.service';
import { ChatBroadcastService } from './chat-broadcast.service';
import { ConversationDoc } from './interfaces/conversation.interface';
import { MessageDoc } from './interfaces/message.interface';
import type { StreamEvent } from './interfaces/stream-event.interface';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly llmStreamService: LlmStreamService,
    private readonly broadcastService: ChatBroadcastService,
  ) {}

  async createConversation(
    dto: CreateConversationDto,
    userId: ObjectId,
  ): Promise<ConversationDoc> {
    const now = new Date();
    const doc = {
      userId,
      title: dto.title || 'New Chat',
      model: dto.model || 'openrouter/free',
      ...(dto.templateId ? { templateId: new ObjectId(dto.templateId) } : {}),
      createdAt: now,
      updatedAt: now,
    };
    const result = await this.databaseService.conversations().insertOne(doc);
    const saved: ConversationDoc = { _id: result.insertedId, ...doc };
    this.logger.log(`Conversation created: ${String(saved._id)}`);
    return saved;
  }

  async getConversations(userId: ObjectId): Promise<ConversationDoc[]> {
    return this.databaseService
      .conversations()
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();
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
    await this.getConversation(conversationId, userId);
    return this.databaseService
      .messages()
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();
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
    this.broadcastService.emitUserMessageCreated(
      conversationId,
      {
        conversationId: new ObjectId(conversationId),
        role: 'user',
        content: dto.content,
        attachments: dto.attachments || [],
        createdAt: now,
        updatedAt: now,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      },
      userId.toHexString(),
    );
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
    yield* this.broadcastService.wrapStreamWithBroadcast(
      this.llmStreamService.stream(
        conversationId,
        model,
        userId,
        abortSignal,
        conversation.templateId,
      ),
      conversationId,
      userId.toHexString(),
    );
  }

  async forkConversation(
    sourceConversationId: string,
    messageId: string,
    userId: ObjectId,
  ): Promise<ConversationDoc> {
    const sourceConv = await this.getConversation(sourceConversationId, userId);
    const convObjId = new ObjectId(sourceConversationId);
    const msgObjId = new ObjectId(messageId);

    const forkMessage = await this.databaseService.messages().findOne({
      _id: msgObjId,
      conversationId: convObjId,
    });
    if (!forkMessage) throw new NotFoundException('Message not found');

    const MAX_FORK_MESSAGES = 1000;
    const messagesToCopy = await this.databaseService
      .messages()
      .find({
        conversationId: convObjId,
        $or: [
          { createdAt: { $lt: forkMessage.createdAt } },
          { createdAt: forkMessage.createdAt, _id: { $lte: msgObjId } },
        ],
      })
      .sort({ createdAt: 1, _id: 1 })
      .limit(MAX_FORK_MESSAGES + 1)
      .toArray();

    if (messagesToCopy.length > MAX_FORK_MESSAGES) {
      throw new BadRequestException(
        `Cannot fork: conversation exceeds ${MAX_FORK_MESSAGES} messages`,
      );
    }

    const now = new Date();
    const newConv: ConversationDoc = {
      userId,
      title: sourceConv.title,
      model: sourceConv.model,
      ...(sourceConv.templateId ? { templateId: sourceConv.templateId } : {}),
      forkedFrom: { conversationId: convObjId, messageId: msgObjId },
      createdAt: now,
      updatedAt: now,
    };
    const result = await this.databaseService
      .conversations()
      .insertOne(newConv);
    const savedConv: ConversationDoc = { _id: result.insertedId, ...newConv };

    if (messagesToCopy.length > 0) {
      const copiedMessages = messagesToCopy.map((msg) => ({
        conversationId: result.insertedId,
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments,
        ...(msg.model ? { model: msg.model } : {}),
        createdAt: msg.createdAt,
        updatedAt: now,
      }));
      try {
        await this.databaseService.messages().insertMany(copiedMessages);
      } catch (error) {
        await this.databaseService
          .conversations()
          .deleteOne({ _id: result.insertedId });
        throw error;
      }
    }

    this.logger.log(
      `Conversation forked: ${String(savedConv._id)} from ${sourceConversationId} at message ${messageId}`,
    );
    return savedConv;
  }

  async *editMessageAndStream(
    conversationId: string,
    messageId: string,
    dto: EditMessageDto,
    userId: ObjectId,
    abortSignal?: AbortSignal,
  ): AsyncGenerator<StreamEvent> {
    const conversation = await this.getConversation(conversationId, userId);
    const convId = new ObjectId(conversationId);
    const message = await this.databaseService.messages().findOne({
      _id: new ObjectId(messageId),
      conversationId: convId,
      role: 'user',
    });
    if (!message) throw new NotFoundException('Message not found');
    const updatedMsg = await this.databaseService.messages().findOneAndUpdate(
      { _id: new ObjectId(messageId) },
      {
        $set: { content: dto.content, isEdited: true, updatedAt: new Date() },
      },
      { returnDocument: 'after' },
    );
    if (updatedMsg) {
      this.broadcastService.emitMessageUpdated(
        conversationId,
        updatedMsg,
        userId.toHexString(),
      );
    }
    await this.databaseService.messages().deleteMany({
      conversationId: convId,
      createdAt: { $gt: message.createdAt },
    });
    const model = dto.model || conversation.model;
    yield* this.broadcastService.wrapStreamWithBroadcast(
      this.llmStreamService.stream(
        conversationId,
        model,
        userId,
        abortSignal,
        conversation.templateId,
      ),
      conversationId,
      userId.toHexString(),
    );
  }

  async *regenerateAndStream(
    conversationId: string,
    messageId: string,
    userId: ObjectId,
    abortSignal?: AbortSignal,
  ): AsyncGenerator<StreamEvent> {
    const conversation = await this.getConversation(conversationId, userId);
    const convId = new ObjectId(conversationId);
    const message = await this.databaseService.messages().findOne({
      _id: new ObjectId(messageId),
      conversationId: convId,
      role: 'assistant',
    });
    if (!message) throw new NotFoundException('Message not found');
    await this.databaseService.messages().deleteMany({
      conversationId: convId,
      createdAt: { $gte: message.createdAt },
    });
    yield* this.broadcastService.wrapStreamWithBroadcast(
      this.llmStreamService.stream(
        conversationId,
        conversation.model,
        userId,
        abortSignal,
        conversation.templateId,
      ),
      conversationId,
      userId.toHexString(),
    );
  }
}
