import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatBroadcastService } from './chat-broadcast.service';
import { ChatGateway } from './chat.gateway';
import { DatabaseService } from '../database/database.service';
import type { StreamEvent } from './interfaces/stream-event.interface';

const MOCK_CONV_ID = '507f1f77bcf86cd799439011';
const MOCK_USER_ID = '607f1f77bcf86cd799439099';

describe('ChatBroadcastService', () => {
  let service: ChatBroadcastService;
  let mockGateway: any;
  let mockMessagesCollection: any;

  const mockAssistantMessage = {
    _id: new ObjectId(),
    conversationId: new ObjectId(MOCK_CONV_ID),
    role: 'assistant' as const,
    content: 'Hello!',
    attachments: [] as never[],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockGateway = {
      emitMessageCreated: vi.fn(),
      emitMessageUpdated: vi.fn(),
      emitMessageDeleted: vi.fn(),
    };

    mockMessagesCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([mockAssistantMessage]),
          }),
        }),
      }),
    };

    const mockDatabaseService = {
      messages: vi.fn().mockReturnValue(mockMessagesCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatBroadcastService,
        { provide: ChatGateway, useValue: mockGateway },
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<ChatBroadcastService>(ChatBroadcastService);
  });

  describe('emitUserMessageCreated', () => {
    it('should delegate to gateway emitMessageCreated', () => {
      const msg = {
        conversationId: new ObjectId(MOCK_CONV_ID),
        role: 'user' as const,
        content: 'Hi',
        attachments: [] as never[],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.emitUserMessageCreated(MOCK_CONV_ID, msg, MOCK_USER_ID);

      expect(mockGateway.emitMessageCreated).toHaveBeenCalledWith(
        MOCK_CONV_ID,
        msg,
        MOCK_USER_ID,
      );
    });
  });

  describe('emitMessageUpdated', () => {
    it('should delegate to gateway emitMessageUpdated', () => {
      service.emitMessageUpdated(
        MOCK_CONV_ID,
        mockAssistantMessage,
        MOCK_USER_ID,
      );

      expect(mockGateway.emitMessageUpdated).toHaveBeenCalledWith(
        MOCK_CONV_ID,
        mockAssistantMessage,
        MOCK_USER_ID,
      );
    });
  });

  describe('wrapStreamWithBroadcast', () => {
    it('should yield all events from the inner stream', async () => {
      const events: StreamEvent[] = [
        { type: 'content', content: 'chunk1' },
        { type: 'content', content: 'chunk2' },
        { type: 'done', usage: undefined },
      ];
      const inner = (async function* () {
        for (const e of events) yield e;
      })();

      const collected: StreamEvent[] = [];
      for await (const event of service.wrapStreamWithBroadcast(
        inner,
        MOCK_CONV_ID,
        MOCK_USER_ID,
      )) {
        collected.push(event);
      }

      expect(collected).toHaveLength(3);
      expect(collected[0]).toEqual({ type: 'content', content: 'chunk1' });
      expect(collected[2]).toEqual({ type: 'done', usage: undefined });
    });

    it('should broadcast assistant message on done event', async () => {
      const events: StreamEvent[] = [
        { type: 'content', content: 'Hello' },
        { type: 'done', usage: undefined },
      ];
      const inner = (async function* () {
        for (const e of events) yield e;
      })();

      const collected: StreamEvent[] = [];
      for await (const event of service.wrapStreamWithBroadcast(
        inner,
        MOCK_CONV_ID,
        MOCK_USER_ID,
      )) {
        collected.push(event);
      }

      // Wait for the async broadcastLatestAssistantMessage to resolve
      await new Promise((r) => setTimeout(r, 10));

      expect(mockGateway.emitMessageCreated).toHaveBeenCalledWith(
        MOCK_CONV_ID,
        mockAssistantMessage,
        MOCK_USER_ID,
      );
    });

    it('should not broadcast on error events', async () => {
      const events: StreamEvent[] = [
        {
          type: 'error',
          code: 'LLM_FAILURE',
          message: 'something went wrong',
        },
      ];
      const inner = (async function* () {
        for (const e of events) yield e;
      })();

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _event of service.wrapStreamWithBroadcast(
        inner,
        MOCK_CONV_ID,
        MOCK_USER_ID,
      )) {
        // consume
      }

      expect(mockGateway.emitMessageCreated).not.toHaveBeenCalled();
    });
  });
});
