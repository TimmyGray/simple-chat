import { Controller, Get } from '@nestjs/common';
import { ModelsService } from './models.service';

@Controller('api/models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  getModels() {
    return this.modelsService.getModels();
  }
}
