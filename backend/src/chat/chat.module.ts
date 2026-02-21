import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { FileExtractionService } from './file-extraction.service';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, FileExtractionService],
})
export class ChatModule {}
