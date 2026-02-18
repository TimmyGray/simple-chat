import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { MongoHealthIndicator } from './mongo.health';

describe('HealthController', () => {
  let controller: HealthController;
  let mockHealthCheckService: any;
  let mockMongoHealth: any;

  beforeEach(async () => {
    mockMongoHealth = {
      isHealthy: vi.fn().mockResolvedValue({ mongodb: { status: 'up' } }),
    };

    mockHealthCheckService = {
      check: vi.fn().mockImplementation(async (indicators) => {
        const results = await Promise.all(indicators.map((fn: any) => fn()));
        return {
          status: 'ok',
          info: Object.assign({}, ...results),
        };
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: MongoHealthIndicator, useValue: mockMongoHealth },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return health status', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.info.mongodb.status).toBe('up');
  });

  it('should call mongo health indicator', async () => {
    await controller.check();
    expect(mockMongoHealth.isHealthy).toHaveBeenCalledWith('mongodb');
  });
});
