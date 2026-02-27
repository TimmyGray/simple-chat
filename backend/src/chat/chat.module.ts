import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { McpModule } from '../mcp/mcp.module';
import { ChatController } from './chat.controller';
import { UploadController } from './upload.controller';
import { ChatService } from './chat.service';
import { ConversationForkService } from './conversation-fork.service';
import { ChatGateway } from './chat.gateway';
import { ChatBroadcastService } from './chat-broadcast.service';
import { LlmStreamService } from './llm-stream.service';
import { SearchService } from './search.service';
import { ExportService } from './export.service';
import { FileExtractionService } from './file-extraction.service';
import { SharingService } from './sharing.service';

@Module({
  imports: [AuthModule, McpModule],
  controllers: [ChatController, UploadController],
  providers: [
    ChatService,
    ConversationForkService,
    ChatGateway,
    ChatBroadcastService,
    LlmStreamService,
    SearchService,
    ExportService,
    FileExtractionService,
    SharingService,
  ],
})
export class ChatModule {}
