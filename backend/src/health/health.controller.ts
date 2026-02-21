import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { MongoHealthIndicator } from './mongo.health';
import { SkipTransform } from '../common/interceptors/transform-response.interceptor';

@SkipThrottle()
@SkipTransform()
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
