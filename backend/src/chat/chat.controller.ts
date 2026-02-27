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
import { ConversationForkService } from './conversation-fork.service';
import { SearchService } from './search.service';
import { ExportService } from './export.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { SearchConversationsDto } from './dto/search-conversations.dto';
import { ExportConversationDto } from './dto/export-conversation.dto';
import { handleSseStream } from './sse-stream.helper';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly conversationForkService: ConversationForkService,
    private readonly searchService: SearchService,
    private readonly exportService: ExportService,
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
    return this.conversationForkService.forkConversation(
      id,
      messageId,
      user._id,
    );
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
    await handleSseStream(
      req,
      res,
      this.logger,
      `conversation ${id}`,
      (signal) =>
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
    await handleSseStream(
      req,
      res,
      this.logger,
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
    await handleSseStream(
      req,
      res,
      this.logger,
      `regenerate message ${messageId}`,
      (signal) =>
        this.chatService.regenerateAndStream(id, messageId, user._id, signal),
    );
  }
}
