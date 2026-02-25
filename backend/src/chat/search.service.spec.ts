import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from './search.service';
import { DatabaseService } from '../database/database.service';

describe('SearchService', () => {
  let service: SearchService;
  let mockConversationsCollection: any;
  let mockMessagesCollection: any;

  const mockObjectId = new ObjectId('507f1f77bcf86cd799439011');
  const mockUserId = new ObjectId('607f1f77bcf86cd799439099');

  const mockConversation = {
    _id: mockObjectId,
    userId: mockUserId,
    title: 'Test Chat',
    model: 'openrouter/free',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockConversationsCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
          toArray: vi.fn().mockResolvedValue([]),
        }),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    };

    mockMessagesCollection = {
      aggregate: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    };

    const mockDatabaseService = {
      conversations: vi.fn().mockReturnValue(mockConversationsCollection),
      messages: vi.fn().mockReturnValue(mockMessagesCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should search conversations by title', async () => {
    const matchedConv = { ...mockConversation, title: 'My Test Chat' };

    mockConversationsCollection.find = vi
      .fn()
      .mockImplementation((filter: any) => {
        if (filter.title) {
          return {
            sort: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([matchedConv]),
              }),
            }),
          };
        }
        return {
          toArray: vi.fn().mockResolvedValue([{ _id: mockObjectId }]),
        };
      });

    const result = await service.searchConversations({ q: 'Test' }, mockUserId);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('My Test Chat');
  });

  it('should return empty array when no matches found', async () => {
    mockConversationsCollection.find = vi
      .fn()
      .mockImplementation((filter: any) => {
        if (filter.title) {
          return {
            sort: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
              }),
            }),
          };
        }
        return {
          toArray: vi.fn().mockResolvedValue([{ _id: mockObjectId }]),
        };
      });

    const result = await service.searchConversations(
      { q: 'nonexistent' },
      mockUserId,
    );
    expect(result).toHaveLength(0);
  });

  it('should escape regex special characters in query', async () => {
    mockConversationsCollection.find = vi
      .fn()
      .mockImplementation((filter: any) => {
        if (filter.title) {
          return {
            sort: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
              }),
            }),
          };
        }
        return {
          toArray: vi.fn().mockResolvedValue([]),
        };
      });

    await service.searchConversations({ q: 'test.*+?' }, mockUserId);

    const titleFilter = mockConversationsCollection.find.mock.calls[0][0];
    expect(titleFilter.title.$regex).toBeInstanceOf(RegExp);
    expect(titleFilter.title.$regex.source).toContain('\\.');
    expect(titleFilter.title.$regex.source).toContain('\\*');
  });

  it('should include message content matches', async () => {
    const otherConvId = new ObjectId('507f1f77bcf86cd799439022');
    const otherConv = {
      ...mockConversation,
      _id: otherConvId,
      title: 'Other Chat',
    };

    mockConversationsCollection.find = vi
      .fn()
      .mockImplementation((filter: any) => {
        if (filter.title) {
          return {
            sort: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
              }),
            }),
          };
        }
        if (filter._id) {
          return {
            sort: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([otherConv]),
              }),
            }),
          };
        }
        return {
          toArray: vi
            .fn()
            .mockResolvedValue([{ _id: mockObjectId }, { _id: otherConvId }]),
        };
      });

    mockMessagesCollection.aggregate = vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ _id: otherConvId }]),
    });

    const result = await service.searchConversations(
      { q: 'hello' },
      mockUserId,
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Other Chat');
  });
});
