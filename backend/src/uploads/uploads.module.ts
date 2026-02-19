import { Module } from '@nestjs/common';
import { UploadsCleanupService } from './uploads-cleanup.service';

@Module({
  providers: [UploadsCleanupService],
})
export class UploadsModule {}
