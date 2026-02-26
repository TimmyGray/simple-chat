import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  ArrayMaxSize,
  IsObject,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStringRecord', async: false })
class IsStringRecordConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    return Object.values(value).every((v) => typeof v === 'string');
  }
  defaultMessage(): string {
    return 'env must be an object with string values only';
  }
}

export class CreateMcpServerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Matches(/^[a-zA-Z0-9_\-./]+$/, {
    message:
      'command must contain only alphanumeric characters, hyphens, underscores, dots, and slashes',
  })
  command!: string;

  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(1000, { each: true })
  args!: string[];

  @IsOptional()
  @IsObject()
  @Validate(IsStringRecordConstraint)
  env?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
