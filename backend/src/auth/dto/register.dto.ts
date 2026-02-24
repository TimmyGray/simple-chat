import { IsString, MinLength, MaxLength } from 'class-validator';
import { BaseAuthDto } from './base-auth.dto';

export class RegisterDto extends BaseAuthDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
