import { Injectable, Logger } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import { ConversationDoc } from './interfaces/conversation.interface';
import { SearchConversationsDto } from './dto/search-conversations.dto';

@Injectable()
export class SearchService {
  private static readonly DEFAULT_SEARCH_LIMIT = 20;
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async searchConversations(
    dto: SearchConversationsDto,
    userId: ObjectId,
  ): Promise<ConversationDoc[]> {
    const limit = dto.limit ?? SearchService.DEFAULT_SEARCH_LIMIT;
    const escapedQuery = dto.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');

    // Search conversations by title
    const titleMatches = await this.databaseService
      .conversations()
      .find({ userId, title: { $regex: regex } })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    // Search messages by content to find additional conversations
    const titleMatchIds = new Set(titleMatches.map((c) => String(c._id)));

    const userConversationIds = await this.databaseService
      .conversations()
      .find({ userId }, { projection: { _id: 1 } })
      .toArray();
    const userConvIdObjects = userConversationIds.map((c) => c._id);

    if (userConvIdObjects.length > 0) {
      const messageMatches = await this.databaseService
        .messages()
        .aggregate<{ _id: ObjectId }>([
          {
            $match: {
              conversationId: { $in: userConvIdObjects },
              content: { $regex: regex },
            },
          },
          { $group: { _id: '$conversationId' } },
          { $limit: limit },
        ])
        .toArray();

      const additionalIds = messageMatches
        .map((m) => m._id)
        .filter((id) => !titleMatchIds.has(String(id)));

      if (additionalIds.length > 0) {
        const remaining = limit - titleMatches.length;
        if (remaining > 0) {
          const additionalConvs = await this.databaseService
            .conversations()
            .find({ _id: { $in: additionalIds }, userId })
            .sort({ updatedAt: -1 })
            .limit(remaining)
            .toArray();
          titleMatches.push(...additionalConvs);
        }
      }
    }

    this.logger.debug(
      `Search "${dto.q}" found ${titleMatches.length} conversations for user ${String(userId)}`,
    );
    return titleMatches;
  }
}
