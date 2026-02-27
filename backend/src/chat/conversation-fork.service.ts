import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import { SharingService } from './sharing.service';
import { ConversationDoc } from './interfaces/conversation.interface';

@Injectable()
export class ConversationForkService {
  private readonly logger = new Logger(ConversationForkService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly sharingService: SharingService,
  ) {}

  async forkConversation(
    sourceConversationId: string,
    messageId: string,
    userId: ObjectId,
  ): Promise<ConversationDoc> {
    const sourceConv = await this.sharingService.findAccessibleConversation(
      sourceConversationId,
      userId,
    );
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
}
