import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { ParticipantRole } from '../../types/documents';

export class InviteParticipantDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(['viewer', 'editor'])
  role?: ParticipantRole;
}
