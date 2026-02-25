import { IsIn } from 'class-validator';

export type ExportFormat = 'markdown' | 'pdf' | 'json';

export class ExportConversationDto {
  @IsIn(['markdown', 'pdf', 'json'])
  format!: ExportFormat;
}
