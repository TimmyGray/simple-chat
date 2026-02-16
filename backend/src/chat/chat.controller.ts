import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Res,
  Logger,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

const uploadLogger = new Logger('FileUpload');

@Controller('api')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  // Conversations
  @Get('conversations')
  getConversations() {
    this.logger.debug('GET /conversations');
    return this.chatService.getConversations();
  }

  @Post('conversations')
  createConversation(@Body() dto: CreateConversationDto) {
    this.logger.log(
      `Creating conversation: title="${dto.title || 'New Chat'}", model="${dto.model || 'default'}"`,
    );
    return this.chatService.createConversation(dto);
  }

  @Patch('conversations/:id')
  updateConversation(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    this.logger.log(`Updating conversation ${id}: ${JSON.stringify(dto)}`);
    return this.chatService.updateConversation(id, dto);
  }

  @Delete('conversations/:id')
  deleteConversation(@Param('id', ParseObjectIdPipe) id: string) {
    this.logger.log(`Deleting conversation ${id}`);
    return this.chatService.deleteConversation(id);
  }

  // Messages
  @Get('conversations/:id/messages')
  getMessages(@Param('id', ParseObjectIdPipe) id: string) {
    this.logger.debug(`GET /conversations/${id}/messages`);
    return this.chatService.getMessages(id);
  }

  @Post('conversations/:id/messages')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  sendMessage(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logger.log(
      `Starting SSE stream for conversation ${id}, model="${dto.model || 'default'}", attachments=${dto.attachments?.length || 0}`,
    );
    return this.chatService.sendMessageAndStream(id, dto, req, res);
  }

  // File upload
  @Post('upload')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'text/csv',
          'image/png',
          'image/jpeg',
          'image/gif',
          'image/webp',
        ];
        const allowed = allowedMimes.includes(file.mimetype);
        if (!allowed) {
          uploadLogger.warn(
            `Rejected file "${file.originalname}" with mime type "${file.mimetype}"`,
          );
        }
        cb(null, allowed);
      },
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    this.logger.log(
      `Uploaded ${files.length} file(s): ${files.map((f) => `${f.originalname} (${(f.size / 1024).toFixed(1)}KB)`).join(', ')}`,
    );
    return files.map((file) => ({
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: file.path,
      fileSize: file.size,
    }));
  }
}
