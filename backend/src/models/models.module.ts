import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { OllamaService } from './ollama.service';

@Module({
  controllers: [ModelsController],
  providers: [ModelsService, OllamaService],
  exports: [ModelsService, OllamaService],
})
export class ModelsModule {}
