import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  private readonly logger = new Logger(TemplatesController.name);

  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  getTemplates() {
    this.logger.debug('GET /api/templates');
    return this.templatesService.getTemplates();
  }

  @Get(':id')
  getTemplate(@Param('id', ParseObjectIdPipe) id: string) {
    this.logger.debug(`GET /api/templates/${id}`);
    return this.templatesService.getTemplate(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTemplate(@Body() dto: CreateTemplateDto) {
    this.logger.log(`Creating template: name="${dto.name}"`);
    return this.templatesService.createTemplate(dto);
  }

  @Patch(':id')
  updateTemplate(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    this.logger.log(`Updating template ${id}`);
    return this.templatesService.updateTemplate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTemplate(@Param('id', ParseObjectIdPipe) id: string) {
    this.logger.log(`Deleting template ${id}`);
    return this.templatesService.deleteTemplate(id);
  }
}
