import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';

export class CreateMcpServerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  command!: string;

  @IsArray()
  @IsString({ each: true })
  args!: string[];

  @IsOptional()
  @IsObject()
  env?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
