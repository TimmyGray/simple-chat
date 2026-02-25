import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { UploadController } from './upload.controller';
import { ChatService } from './chat.service';
import { LlmStreamService } from './llm-stream.service';
import { SearchService } from './search.service';
import { ExportService } from './export.service';
import { FileExtractionService } from './file-extraction.service';

@Module({
  imports: [AuthModule],
  controllers: [ChatController, UploadController],
  providers: [
    ChatService,
    LlmStreamService,
    SearchService,
    ExportService,
    FileExtractionService,
  ],
})
export class ChatModule {}
