import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SharingController } from './sharing.controller';
import { SharingService } from './sharing.service';

describe('SharingController', () => {
  let controller: SharingController;
  let sharingService: any;

  const mockUserId = new ObjectId('607f1f77bcf86cd799439099');
  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    isAdmin: false,
    totalTokensUsed: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
  };

  const mockConversation = {
    _id: '507f1f77bcf86cd799439011',
    userId: mockUserId,
    title: 'Test Chat',
    model: 'openrouter/free',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    sharingService = {
      getSharedConversations: vi.fn().mockResolvedValue([]),
      getParticipants: vi.fn().mockResolvedValue([]),
      inviteParticipant: vi.fn().mockResolvedValue({
        userId: new ObjectId(),
        role: 'viewer',
        addedAt: new Date(),
      }),
      revokeParticipant: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharingController],
      providers: [
        {
          provide: SharingService,
          useValue: sharingService,
        },
      ],
    }).compile();

    controller = module.get<SharingController>(SharingController);
  });

  describe('getSharedConversations', () => {
    it('should delegate to sharingService with userId', async () => {
      sharingService.getSharedConversations.mockResolvedValue([
        mockConversation,
      ]);

      const result = await controller.getSharedConversations(mockUser);

      expect(result).toEqual([mockConversation]);
      expect(sharingService.getSharedConversations).toHaveBeenCalledWith(
        mockUserId,
      );
    });
  });

  describe('getParticipants', () => {
    it('should delegate to sharingService with id and userId', async () => {
      const mockParticipants = [
        { userId: new ObjectId(), role: 'viewer', addedAt: new Date() },
      ];
      sharingService.getParticipants.mockResolvedValue(mockParticipants);

      const result = await controller.getParticipants(
        mockUser,
        '507f1f77bcf86cd799439011',
      );

      expect(result).toEqual(mockParticipants);
      expect(sharingService.getParticipants).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockUserId,
      );
    });
  });

  describe('inviteParticipant', () => {
    it('should delegate to sharingService with correct params', async () => {
      const dto = { email: 'invited@example.com', role: 'editor' as const };

      await controller.inviteParticipant(
        mockUser,
        '507f1f77bcf86cd799439011',
        dto,
      );

      expect(sharingService.inviteParticipant).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockUserId,
        'invited@example.com',
        'editor',
      );
    });
  });

  describe('revokeParticipant', () => {
    it('should delegate to sharingService with correct params', async () => {
      const targetUserId = new ObjectId().toHexString();

      await controller.revokeParticipant(
        mockUser,
        '507f1f77bcf86cd799439011',
        targetUserId,
      );

      expect(sharingService.revokeParticipant).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockUserId,
        targetUserId,
      );
    });
  });
});
