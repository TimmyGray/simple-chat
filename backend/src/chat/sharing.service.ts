import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import type {
  ConversationDoc,
  ParticipantRef,
  ParticipantRole,
} from '../types/documents';

const MAX_PARTICIPANTS = 50;

@Injectable()
export class SharingService {
  private readonly logger = new Logger(SharingService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async inviteParticipant(
    conversationId: string,
    ownerUserId: ObjectId,
    targetEmail: string,
    role: ParticipantRole = 'viewer',
  ): Promise<ParticipantRef> {
    const convId = new ObjectId(conversationId);
    const conversation = await this.databaseService
      .conversations()
      .findOne({ _id: convId, userId: ownerUserId });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const targetUser = await this.databaseService
      .users()
      .findOne({ email: targetEmail }, { projection: { _id: 1, email: 1 } });
    if (!targetUser || !targetUser._id) {
      throw new NotFoundException('User not found');
    }

    if (targetUser._id.equals(ownerUserId)) {
      throw new ForbiddenException('Cannot invite yourself');
    }

    const targetId = targetUser._id;
    const existing = conversation.participants?.find((p) =>
      p.userId.equals(targetId),
    );
    if (existing) {
      throw new ForbiddenException('User is already a participant');
    }

    if ((conversation.participants?.length ?? 0) >= MAX_PARTICIPANTS) {
      throw new ForbiddenException(
        `Maximum ${MAX_PARTICIPANTS} participants allowed`,
      );
    }

    const participant: ParticipantRef = {
      userId: targetId,
      role,
      addedAt: new Date(),
    };

    await this.databaseService.conversations().updateOne(
      { _id: convId, userId: ownerUserId },
      {
        $push: { participants: participant },
        $set: { updatedAt: new Date() },
      },
    );

    this.logger.log(
      `Participant ${targetEmail} added to conversation ${conversationId} as ${role}`,
    );
    return participant;
  }

  async revokeParticipant(
    conversationId: string,
    ownerUserId: ObjectId,
    targetUserId: string,
  ): Promise<void> {
    const convId = new ObjectId(conversationId);
    const targetObjId = new ObjectId(targetUserId);

    const result = await this.databaseService.conversations().updateOne(
      { _id: convId, userId: ownerUserId },
      {
        $pull: { participants: { userId: targetObjId } },
        $set: { updatedAt: new Date() },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Conversation not found');
    }
    if (result.modifiedCount === 0) {
      throw new NotFoundException('Participant not found');
    }

    this.logger.log(
      `Participant ${targetUserId} removed from conversation ${conversationId}`,
    );
  }

  async getParticipants(
    conversationId: string,
    userId: ObjectId,
  ): Promise<ParticipantRef[]> {
    const conversation = await this.findAccessibleConversation(
      conversationId,
      userId,
    );
    return conversation.participants ?? [];
  }

  async getSharedConversations(userId: ObjectId): Promise<ConversationDoc[]> {
    return this.databaseService
      .conversations()
      .find({ 'participants.userId': userId })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  async findAccessibleConversation(
    conversationId: string,
    userId: ObjectId,
  ): Promise<ConversationDoc> {
    const convId = new ObjectId(conversationId);
    const conversation = await this.databaseService.conversations().findOne({
      _id: convId,
      $or: [{ userId }, { 'participants.userId': userId }],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  async assertAccess(
    conversationId: string,
    userId: ObjectId,
    requiredRole?: ParticipantRole,
  ): Promise<ConversationDoc> {
    const conversation = await this.findAccessibleConversation(
      conversationId,
      userId,
    );

    if (conversation.userId.equals(userId)) {
      return conversation;
    }

    if (requiredRole) {
      const participant = conversation.participants?.find((p) =>
        p.userId.equals(userId),
      );
      if (!participant) {
        throw new ForbiddenException('Access denied');
      }
      if (requiredRole === 'editor' && participant.role === 'viewer') {
        throw new ForbiddenException('Editor access required');
      }
    }

    return conversation;
  }

  isOwner(conversation: ConversationDoc, userId: ObjectId): boolean {
    return conversation.userId.equals(userId);
  }
}
