import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { ChatModule } from './chat/chat.module';
import { ModelsModule } from './models/models.module';
import { HealthModule } from './health/health.module';
import { UploadsModule } from './uploads/uploads.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>('LOG_LEVEL', 'info'),
          transport:
            config.get<string>('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true } }
              : undefined,
          customProps: (req: any) => ({
            correlationId: req.headers['x-correlation-id'],
          }),
        },
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 60,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ChatModule,
    ModelsModule,
    HealthModule,
    UploadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
