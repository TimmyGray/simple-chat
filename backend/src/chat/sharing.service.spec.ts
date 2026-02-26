import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SharingService } from './sharing.service';
import { DatabaseService } from '../database/database.service';

describe('SharingService', () => {
  let service: SharingService;
  let mockConversationsCollection: any;
  let mockUsersCollection: any;

  const ownerId = new ObjectId('607f1f77bcf86cd799439099');
  const participantId = new ObjectId('607f1f77bcf86cd799439100');
  const convId = new ObjectId('507f1f77bcf86cd799439011');

  const mockConversation = {
    _id: convId,
    userId: ownerId,
    title: 'Test Chat',
    model: 'openrouter/free',
    participants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    _id: participantId,
    email: 'participant@example.com',
  };

  beforeEach(async () => {
    mockConversationsCollection = {
      findOne: vi.fn().mockResolvedValue(mockConversation),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      updateOne: vi
        .fn()
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
    };

    mockUsersCollection = {
      findOne: vi.fn().mockResolvedValue(mockUser),
    };

    const mockDatabaseService = {
      conversations: vi.fn().mockReturnValue(mockConversationsCollection),
      users: vi.fn().mockReturnValue(mockUsersCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
  });

  describe('inviteParticipant', () => {
    it('should add a participant to the conversation', async () => {
      const result = await service.inviteParticipant(
        convId.toHexString(),
        ownerId,
        'participant@example.com',
      );
      expect(result.userId).toEqual(participantId);
      expect(result.role).toBe('viewer');
      expect(result.addedAt).toBeInstanceOf(Date);
      expect(mockConversationsCollection.updateOne).toHaveBeenCalledWith(
        { _id: convId, userId: ownerId },
        {
          $push: {
            participants: expect.objectContaining({
              userId: participantId,
              role: 'viewer',
            }),
          },
          $set: { updatedAt: expect.any(Date) },
        },
      );
    });

    it('should invite with editor role when specified', async () => {
      const result = await service.inviteParticipant(
        convId.toHexString(),
        ownerId,
        'participant@example.com',
        'editor',
      );
      expect(result.role).toBe('editor');
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);
      await expect(
        service.inviteParticipant(
          convId.toHexString(),
          ownerId,
          'participant@example.com',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when target user not found', async () => {
      mockUsersCollection.findOne = vi.fn().mockResolvedValue(null);
      await expect(
        service.inviteParticipant(
          convId.toHexString(),
          ownerId,
          'unknown@example.com',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when inviting yourself', async () => {
      mockUsersCollection.findOne = vi.fn().mockResolvedValue({
        _id: ownerId,
        email: 'owner@example.com',
      });
      await expect(
        service.inviteParticipant(
          convId.toHexString(),
          ownerId,
          'owner@example.com',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user already a participant', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue({
        ...mockConversation,
        participants: [
          { userId: participantId, role: 'viewer', addedAt: new Date() },
        ],
      });
      await expect(
        service.inviteParticipant(
          convId.toHexString(),
          ownerId,
          'participant@example.com',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when max participants reached', async () => {
      const manyParticipants = Array.from({ length: 50 }, () => ({
        userId: new ObjectId(),
        role: 'viewer' as const,
        addedAt: new Date(),
      }));
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue({
        ...mockConversation,
        participants: manyParticipants,
      });
      await expect(
        service.inviteParticipant(
          convId.toHexString(),
          ownerId,
          'participant@example.com',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('revokeParticipant', () => {
    it('should remove a participant', async () => {
      await service.revokeParticipant(
        convId.toHexString(),
        ownerId,
        participantId.toHexString(),
      );
      expect(mockConversationsCollection.updateOne).toHaveBeenCalledWith(
        { _id: convId, userId: ownerId },
        {
          $pull: { participants: { userId: participantId } },
          $set: { updatedAt: expect.any(Date) },
        },
      );
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockConversationsCollection.updateOne = vi
        .fn()
        .mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });
      await expect(
        service.revokeParticipant(
          convId.toHexString(),
          ownerId,
          participantId.toHexString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when participant not found', async () => {
      mockConversationsCollection.updateOne = vi
        .fn()
        .mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });
      await expect(
        service.revokeParticipant(
          convId.toHexString(),
          ownerId,
          participantId.toHexString(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAccessibleConversation', () => {
    it('should return conversation for owner', async () => {
      const result = await service.findAccessibleConversation(
        convId.toHexString(),
        ownerId,
      );
      expect(result._id).toEqual(convId);
    });

    it('should return conversation for participant', async () => {
      const convWithParticipant = {
        ...mockConversation,
        participants: [
          { userId: participantId, role: 'viewer', addedAt: new Date() },
        ],
      };
      mockConversationsCollection.findOne = vi
        .fn()
        .mockResolvedValue(convWithParticipant);
      const result = await service.findAccessibleConversation(
        convId.toHexString(),
        participantId,
      );
      expect(result._id).toEqual(convId);
    });

    it('should throw NotFoundException when no access', async () => {
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue(null);
      const strangerId = new ObjectId('707f1f77bcf86cd799439200');
      await expect(
        service.findAccessibleConversation(convId.toHexString(), strangerId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertAccess', () => {
    it('should allow owner for any role', async () => {
      const result = await service.assertAccess(
        convId.toHexString(),
        ownerId,
        'editor',
      );
      expect(result._id).toEqual(convId);
    });

    it('should allow editor participant for editor role', async () => {
      const convWithEditor = {
        ...mockConversation,
        participants: [
          { userId: participantId, role: 'editor', addedAt: new Date() },
        ],
      };
      mockConversationsCollection.findOne = vi
        .fn()
        .mockResolvedValue(convWithEditor);
      const result = await service.assertAccess(
        convId.toHexString(),
        participantId,
        'editor',
      );
      expect(result._id).toEqual(convId);
    });

    it('should reject viewer when editor role required', async () => {
      const convWithViewer = {
        ...mockConversation,
        participants: [
          { userId: participantId, role: 'viewer', addedAt: new Date() },
        ],
      };
      mockConversationsCollection.findOne = vi
        .fn()
        .mockResolvedValue(convWithViewer);
      await expect(
        service.assertAccess(convId.toHexString(), participantId, 'editor'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow viewer when no specific role required', async () => {
      const convWithViewer = {
        ...mockConversation,
        participants: [
          { userId: participantId, role: 'viewer', addedAt: new Date() },
        ],
      };
      mockConversationsCollection.findOne = vi
        .fn()
        .mockResolvedValue(convWithViewer);
      const result = await service.assertAccess(
        convId.toHexString(),
        participantId,
      );
      expect(result._id).toEqual(convId);
    });
  });

  describe('getSharedConversations', () => {
    it('should return conversations where user is a participant (excluding owned)', async () => {
      const sharedConv = {
        _id: new ObjectId(),
        userId: new ObjectId(),
        title: 'Shared Chat',
      };
      mockConversationsCollection.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([sharedConv]),
        }),
      });
      const result = await service.getSharedConversations(participantId);
      expect(result).toHaveLength(1);
      expect(mockConversationsCollection.find).toHaveBeenCalledWith(
        {
          'participants.userId': participantId,
          userId: { $ne: participantId },
        },
        { projection: { participants: 0 } },
      );
    });
  });

  describe('getParticipants', () => {
    it('should return participants for accessible conversation', async () => {
      const participants = [
        { userId: participantId, role: 'editor', addedAt: new Date() },
      ];
      mockConversationsCollection.findOne = vi.fn().mockResolvedValue({
        ...mockConversation,
        participants,
      });
      const result = await service.getParticipants(
        convId.toHexString(),
        ownerId,
      );
      expect(result).toEqual(participants);
    });

    it('should return empty array when no participants', async () => {
      const result = await service.getParticipants(
        convId.toHexString(),
        ownerId,
      );
      expect(result).toEqual([]);
    });
  });

  describe('isOwner', () => {
    it('should return true for owner', () => {
      expect(service.isOwner(mockConversation, ownerId)).toBe(true);
    });

    it('should return false for non-owner', () => {
      expect(service.isOwner(mockConversation, participantId)).toBe(false);
    });
  });
});
