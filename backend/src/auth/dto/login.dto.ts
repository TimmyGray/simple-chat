import { IsString, MaxLength } from 'class-validator';
import { BaseAuthDto } from './base-auth.dto';

export class LoginDto extends BaseAuthDto {
  @IsString()
  @MaxLength(128)
  password: string;
}
