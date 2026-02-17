import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { MongoHealthIndicator } from './mongo.health';

@SkipThrottle()
@Controller('api/health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongo: MongoHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.mongo.isHealthy('mongodb')]);
  }
}
