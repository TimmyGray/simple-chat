import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { MongoHealthIndicator } from './mongo.health';

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
