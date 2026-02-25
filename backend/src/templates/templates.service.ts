import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ObjectId, MongoServerError } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import type { TemplateDoc } from './interfaces/template.interface';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { DEFAULT_TEMPLATES } from './templates.seed';

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  private async seedDefaults(): Promise<void> {
    const count = await this.databaseService.templates().countDocuments();
    if (count > 0) {
      this.logger.debug('Templates already seeded, skipping');
      return;
    }

    const now = new Date();
    const docs = DEFAULT_TEMPLATES.map((t) => ({
      name: t.name,
      content: t.content,
      category: t.category,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    }));

    await this.databaseService.templates().insertMany(docs);
    this.logger.log(`Seeded ${docs.length} default templates`);
  }

  async getTemplates(): Promise<TemplateDoc[]> {
    return this.databaseService
      .templates()
      .find({})
      .sort({ category: 1, name: 1 })
      .toArray();
  }

  async getTemplate(id: string): Promise<TemplateDoc> {
    const template = await this.databaseService
      .templates()
      .findOne({ _id: new ObjectId(id) });
    if (!template) {
      this.logger.warn(`Template not found: ${id}`);
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async createTemplate(dto: CreateTemplateDto): Promise<TemplateDoc> {
    const now = new Date();
    const doc = {
      name: dto.name,
      content: dto.content,
      category: dto.category || 'general',
      isDefault: dto.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await this.databaseService.templates().insertOne(doc);
      const saved: TemplateDoc = { _id: result.insertedId, ...doc };
      this.logger.log(`Template created: ${String(saved._id)}`);
      return saved;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new ConflictException(
          `Template with name "${dto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async updateTemplate(
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<TemplateDoc> {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) updateFields.name = dto.name;
    if (dto.content !== undefined) updateFields.content = dto.content;
    if (dto.category !== undefined) updateFields.category = dto.category;
    if (dto.isDefault !== undefined) updateFields.isDefault = dto.isDefault;

    try {
      const template = await this.databaseService
        .templates()
        .findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updateFields },
          { returnDocument: 'after' },
        );
      if (!template) {
        this.logger.warn(`Template not found for update: ${id}`);
        throw new NotFoundException('Template not found');
      }
      this.logger.log(`Template updated: ${id}`);
      return template;
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new ConflictException(
          `Template with name "${dto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.databaseService
      .templates()
      .findOne({ _id: new ObjectId(id) });
    if (!template) {
      this.logger.warn(`Template not found for deletion: ${id}`);
      throw new NotFoundException('Template not found');
    }
    await this.databaseService
      .templates()
      .findOneAndDelete({ _id: new ObjectId(id) });
    this.logger.log(`Template deleted: ${id}`);
  }
}
