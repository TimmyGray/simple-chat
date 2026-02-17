import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Inject } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { MONGO_CLIENT } from '../database/database.constants';

@Injectable()
export class MongoHealthIndicator extends HealthIndicator {
  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.client.db().command({ ping: 1 });
      return this.getStatus(key, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HealthCheckError(
        'MongoDB check failed',
        this.getStatus(key, false, { message }),
      );
    }
  }
}
