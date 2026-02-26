import { IsEmail, IsIn, IsOptional } from 'class-validator';
import type { ParticipantRole } from '../../types/documents';

export class InviteParticipantDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn(['viewer', 'editor'])
  role?: ParticipantRole;
}
