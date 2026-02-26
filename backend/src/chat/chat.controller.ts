import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { SearchService } from './search.service';
import { ExportService } from './export.service';
import { SharingService } from './sharing.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { SearchConversationsDto } from './dto/search-conversations.dto';
import { ExportConversationDto } from './dto/export-conversation.dto';
import { InviteParticipantDto } from './dto/invite-participant.dto';
import {
  SSE_ERROR_CODE,
  type StreamEvent,
} from './interfaces/stream-event.interface';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { getErrorMessage } from '../common/utils/get-error-message';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly searchService: SearchService,
    private readonly exportService: ExportService,
    private readonly sharingService: SharingService,
  ) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: AuthUser) {
    this.logger.debug('GET /conversations');
    return this.chatService.getConversations(user._id);
  }

  @Get('conversations/search')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  searchConversations(
    @CurrentUser() user: AuthUser,
    @Query() dto: SearchConversationsDto,
  ) {
    this.logger.debug(`GET /conversations/search?q=${dto.q}`);
    return this.searchService.searchConversations(dto, user._id);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  createConversation(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateConversationDto,
  ) {
    this.logger.log(
      `Creating conversation: title="${dto.title || 'New Chat'}", model="${dto.model || 'default'}"`,
    );
    return this.chatService.createConversation(dto, user._id);
  }

  @Patch('conversations/:id')
  updateConversation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    this.logger.log(`Updating conversation ${id}: ${JSON.stringify(dto)}`);
    return this.chatService.updateConversation(id, dto, user._id);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteConversation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    this.logger.log(`Deleting conversation ${id}`);
    return this.chatService.deleteConversation(id, user._id);
  }

  @Post('conversations/:id/fork/:messageId')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  forkConversation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('messageId', ParseObjectIdPipe) messageId: string,
  ) {
    this.logger.log(`Forking conversation ${id} at message ${messageId}`);
    return this.chatService.forkConversation(id, messageId, user._id);
  }

  @Get('conversations/shared')
  getSharedConversations(@CurrentUser() user: AuthUser) {
    this.logger.debug('GET /conversations/shared');
    return this.sharingService.getSharedConversations(user._id);
  }

  @Get('conversations/:id/participants')
  getParticipants(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    this.logger.debug(`GET /conversations/${id}/participants`);
    return this.sharingService.getParticipants(id, user._id);
  }

  @Post('conversations/:id/participants')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  inviteParticipant(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: InviteParticipantDto,
  ) {
    this.logger.log(`Inviting ${dto.email} to conversation ${id}`);
    return this.sharingService.inviteParticipant(
      id,
      user._id,
      dto.email,
      dto.role,
    );
  }

  @Delete('conversations/:id/participants/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeParticipant(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) userId: string,
  ) {
    this.logger.log(`Revoking participant ${userId} from conversation ${id}`);
    return this.sharingService.revokeParticipant(id, user._id, userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    this.logger.debug(`GET /conversations/${id}/messages`);
    return this.chatService.getMessages(id, user._id);
  }

  @Get('conversations/:id/export')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async exportConversation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() dto: ExportConversationDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Exporting conversation ${id} as ${dto.format}`);
    const result = await this.exportService.exportConversation(
      id,
      user._id,
      dto.format,
    );
    const encoded = encodeURIComponent(result.fileName);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"; filename*=UTF-8''${encoded}`,
    );
    res.setHeader('Content-Length', result.buffer.length);
    res.end(result.buffer);
  }

  private static readonly STREAM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  @Post('conversations/:id/messages')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const rawKey = req.headers['idempotency-key'] as string;
    const idempotencyKey = rawKey && rawKey.length <= 64 ? rawKey : undefined;
    this.logger.log(
      `Starting SSE stream for conversation ${id}, model="${dto.model || 'default'}", attachments=${dto.attachments?.length || 0}`,
    );
    await this.handleSseStream(req, res, `conversation ${id}`, (signal) =>
      this.chatService.sendMessageAndStream(
        id,
        dto,
        user._id,
        signal,
        idempotencyKey,
      ),
    );
  }

  @Post('conversations/:id/messages/:messageId/edit')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async editMessage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('messageId', ParseObjectIdPipe) messageId: string,
    @Body() dto: EditMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log(`Editing message ${messageId} in conversation ${id}`);
    await this.handleSseStream(
      req,
      res,
      `edit message ${messageId}`,
      (signal) =>
        this.chatService.editMessageAndStream(
          id,
          messageId,
          dto,
          user._id,
          signal,
        ),
    );
  }

  @Post('conversations/:id/messages/:messageId/regenerate')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async regenerateMessage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('messageId', ParseObjectIdPipe) messageId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log(`Regenerating message ${messageId} in conversation ${id}`);
    await this.handleSseStream(
      req,
      res,
      `regenerate message ${messageId}`,
      (signal) =>
        this.chatService.regenerateAndStream(id, messageId, user._id, signal),
    );
  }

  private async handleSseStream(
    req: Request,
    res: Response,
    logContext: string,
    createStream: (signal: AbortSignal) => AsyncGenerator<StreamEvent>,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    const streamTimeout = setTimeout(() => {
      this.logger.warn(`Stream timeout for ${logContext}`);
      if (!res.writableEnded) {
        this.writeSseError(
          res,
          'Stream timeout',
          SSE_ERROR_CODE.STREAM_TIMEOUT,
        );
        res.end();
      }
      abortController.abort();
    }, ChatController.STREAM_TIMEOUT_MS);

    try {
      const stream = createStream(abortController.signal);
      await this.consumeStreamAsSSE(stream, res);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(`SSE stream failed for ${logContext}: ${errorMessage}`);
      if (!res.writableEnded) {
        this.writeSseError(res, errorMessage, SSE_ERROR_CODE.INTERNAL_ERROR);
      }
    } finally {
      clearTimeout(streamTimeout);
      if (!res.writableEnded) {
        res.end();
      }
    }
  }

  private async consumeStreamAsSSE(
    stream: AsyncGenerator<StreamEvent>,
    res: Response,
  ): Promise<void> {
    for await (const event of stream) {
      if (res.writableEnded) break;

      switch (event.type) {
        case 'content':
          res.write(`data: ${JSON.stringify({ content: event.content })}\n\n`);
          break;
        case 'tool_call':
          res.write(
            `data: ${JSON.stringify({ tool_call: { name: event.name, arguments: event.arguments } })}\n\n`,
          );
          break;
        case 'tool_result':
          res.write(
            `data: ${JSON.stringify({ tool_result: { name: event.name, content: event.content, isError: event.isError } })}\n\n`,
          );
          break;
        case 'done':
          if (event.usage) {
            res.write(`data: ${JSON.stringify({ usage: event.usage })}\n\n`);
          }
          res.write('data: [DONE]\n\n');
          break;
        case 'error':
          this.writeSseError(res, event.message, event.code);
          break;
      }
    }
  }

  private writeSseError(res: Response, msg: string, code: string): void {
    const payload = { error: msg, code };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
}
