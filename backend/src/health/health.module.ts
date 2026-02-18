import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from '../database/database.module';
import { HealthController } from './health.controller';
import { MongoHealthIndicator } from './mongo.health';

@Module({
  imports: [TerminusModule, DatabaseModule],
  controllers: [HealthController],
  providers: [MongoHealthIndicator],
})
export class HealthModule {}
