import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AttachmentDto {
  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsString()
  filePath: string;

  @IsNumber()
  fileSize: number;
}

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
