import { Injectable, Logger, Optional } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import { ChatGateway } from './chat.gateway';
import type { MessageDoc } from '../types/documents';
import type { StreamEvent } from './interfaces/stream-event.interface';

@Injectable()
export class ChatBroadcastService {
  private readonly logger = new Logger(ChatBroadcastService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    @Optional() private readonly chatGateway?: ChatGateway,
  ) {}

  /** Broadcast a user message creation to other clients in the room */
  emitUserMessageCreated(
    conversationId: string,
    message: MessageDoc,
    excludeUserId: string,
  ): void {
    this.chatGateway?.emitMessageCreated(
      conversationId,
      message,
      excludeUserId,
    );
  }

  /** Broadcast a message update to other clients in the room */
  emitMessageUpdated(
    conversationId: string,
    message: MessageDoc,
    excludeUserId: string,
  ): void {
    this.chatGateway?.emitMessageUpdated(
      conversationId,
      message,
      excludeUserId,
    );
  }

  /**
   * Wraps an LLM stream generator, intercepting the `done` event
   * to broadcast the saved assistant message to other clients.
   */
  async *wrapStreamWithBroadcast(
    stream: AsyncGenerator<StreamEvent>,
    conversationId: string,
    excludeUserId: string,
  ): AsyncGenerator<StreamEvent> {
    for await (const event of stream) {
      yield event;
      if (event.type === 'done') {
        this.broadcastLatestAssistantMessage(conversationId, excludeUserId);
      }
    }
  }

  private broadcastLatestAssistantMessage(
    conversationId: string,
    excludeUserId: string,
  ): void {
    if (!this.chatGateway) return;
    this.databaseService
      .messages()
      .find({ conversationId: new ObjectId(conversationId), role: 'assistant' })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()
      .then((messages) => {
        if (messages[0]) {
          this.chatGateway!.emitMessageCreated(
            conversationId,
            messages[0],
            excludeUserId,
          );
        }
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `Failed to broadcast assistant message: ${String(err)}`,
        );
      });
  }
}
