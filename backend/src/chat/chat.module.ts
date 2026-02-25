import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SearchService } from './search.service';
import { FileExtractionService } from './file-extraction.service';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, SearchService, FileExtractionService],
})
export class ChatModule {}
