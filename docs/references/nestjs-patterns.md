# NestJS Patterns Reference

Patterns used in this project. Follow these when adding new modules or features.

## Module Pattern

Every feature gets its own module:
```typescript
@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
})
export class FeatureModule {}
```

Register in `AppModule.imports[]`.

## Controller Pattern

```typescript
@Controller('api/feature')
export class FeatureController {
  constructor(private readonly service: FeatureService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateFeatureDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateFeatureDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.delete(id);
  }
}
```

Key points:
- All routes under `/api` prefix
- `ParseObjectIdPipe` on all `:id` params
- DTOs for all request bodies
- Rate limiting via `@Throttle()` on sensitive endpoints

## DTO Pattern

```typescript
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

Global `ValidationPipe({ whitelist: true, transform: true })` strips unknown fields.

## Database Access Pattern

Use `DatabaseService` to get typed collections:
```typescript
@Injectable()
export class FeatureService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<FeatureDoc[]> {
    return this.db.features().find().sort({ createdAt: -1 }).toArray();
  }
}
```

Add new collection methods to `DatabaseService`. Use native MongoDB driver (no Mongoose).

## Testing Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FeatureService', () => {
  let service: FeatureService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      features: vi.fn().mockReturnValue({
        find: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
        insertOne: vi.fn().mockResolvedValue({ insertedId: 'test-id' }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    service = module.get(FeatureService);
  });

  it('should return features', async () => {
    const result = await service.findAll();
    expect(result).toEqual([]);
  });
});
```

Test files: `*.spec.ts` next to source. Use Vitest (not Jest).

## SSE Streaming Pattern

For endpoints returning streamed responses:
```typescript
// Controller
@Post(':id/messages')
@Throttle({ default: { limit: 10, ttl: 60000 } })
async sendMessage(
  @Param('id', ParseObjectIdPipe) id: string,
  @Body() dto: SendMessageDto,
  @Req() req: Request,
  @Res() res: Response,
) {
  return this.service.sendMessageAndStream(id, dto, req, res);
}

// Service sets SSE headers and writes chunks:
res.setHeader('Content-Type', 'text/event-stream');
res.write(`data: ${JSON.stringify({ content })}\n\n`);
res.write(`data: [DONE]\n\n`);
res.end();
```

Always include:
- Client disconnect detection (`req.on('close')`)
- Stream timeout (5 minutes)
- Cleanup in `finally` block

## Error Handling Pattern

- Throw NestJS exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`
- Global `AllExceptionsFilter` catches everything
- Use `Logger` from `@nestjs/common` for structured logging
- Include correlation IDs for request tracing

## Configuration Pattern

Add new env vars to:
1. `config/configuration.ts` — default values
2. `config/env.validation.ts` — Joi schema
3. `backend/.env.example` — documentation
