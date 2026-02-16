import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  mkdirSync('./uploads', { recursive: true });

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({ origin: corsOrigin });
  logger.log(`CORS enabled for origin: ${corsOrigin}`);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
}
bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.fatal('Failed to start application', err.stack);
  process.exit(1);
});
