import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SharingService } from './sharing.service';
import { InviteParticipantDto } from './dto/invite-participant.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class SharingController {
  private readonly logger = new Logger(SharingController.name);

  constructor(private readonly sharingService: SharingService) {}

  @Get('conversations/shared')
  getSharedConversations(@CurrentUser() user: AuthUser) {
    this.logger.debug('GET /conversations/shared');
    return this.sharingService.getSharedConversations(user._id);
  }

  @Get('conversations/:id/participants')
  getParticipants(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    this.logger.debug(`GET /conversations/${id}/participants`);
    return this.sharingService.getParticipants(id, user._id);
  }

  @Post('conversations/:id/participants')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  inviteParticipant(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: InviteParticipantDto,
  ) {
    this.logger.log(`Inviting ${dto.email} to conversation ${id}`);
    return this.sharingService.inviteParticipant(
      id,
      user._id,
      dto.email,
      dto.role,
    );
  }

  @Delete('conversations/:id/participants/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeParticipant(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) userId: string,
  ) {
    this.logger.log(`Revoking participant ${userId} from conversation ${id}`);
    return this.sharingService.revokeParticipant(id, user._id, userId);
  }
}
