import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ModelsService } from './models.service';
import { OllamaService } from './ollama.service';

function createConfigService(
  overrides: Record<string, string> = {},
): ConfigService {
  const defaults: Record<string, string> = {
    'openrouter.baseUrl': 'https://openrouter.ai/api/v1',
    'openrouter.apiKey': 'test-key',
    ...overrides,
  };
  return { get: (key: string) => defaults[key] } as unknown as ConfigService;
}

function createMockOllamaService(): OllamaService {
  return {
    getModels: () => [],
    isAvailable: () => false,
    getBaseUrl: () => 'http://localhost:11434',
    isOllamaModel: () => false,
    refreshModels: vi.fn(),
    onModuleInit: vi.fn(),
  } as unknown as OllamaService;
}

function makeOpenRouterResponse(models: Record<string, unknown>[]) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: models }),
  };
}

const sampleOpenRouterModel = {
  id: 'google/gemma-3n-e2b-it:free',
  name: 'Gemma 3n 2B',
  description: 'Lightweight Google model',
  pricing: { prompt: '0', completion: '0' },
  context_length: 32768,
  architecture: { modality: 'text->text' },
};

const nonWhitelistedFreeModel = {
  id: 'unknown-provider/random-model:free',
  name: 'Random Free Model',
  description: 'A free model not in the whitelist',
  pricing: { prompt: '0', completion: '0' },
  context_length: 16384,
  architecture: { modality: 'text->text' },
};

const sampleVisionModel = {
  id: 'test/vision-model',
  name: 'Vision Model',
  description: 'Supports images',
  pricing: { prompt: '0.001', completion: '0.002' },
  context_length: 128000,
  architecture: { modality: 'text+image->text' },
};

const anotherWhitelistedFreeModel = {
  id: 'nvidia/nemotron-nano-9b-v2:free',
  name: 'Nemotron Nano 9B',
  description: 'NVIDIA lightweight model',
  pricing: { prompt: '0', completion: '0' },
  context_length: 128000,
  architecture: { modality: 'text->text' },
};

describe('ModelsService', () => {
  let service: ModelsService;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with successful OpenRouter fetch', () => {
    beforeEach(async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          sampleOpenRouterModel,
          anotherWhitelistedFreeModel,
          sampleVisionModel,
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
    });

    it('should load only free whitelisted models from OpenRouter', () => {
      const models = service.getModels();
      expect(models).toHaveLength(2);
      expect(models.every((m) => m.free)).toBe(true);
    });

    it('should map model fields correctly', () => {
      const model = service.getModelById('google/gemma-3n-e2b-it:free');
      expect(model).toBeDefined();
      expect(model!.name).toBe('Gemma 3n 2B');
      expect(model!.description).toBe('Lightweight Google model');
      expect(model!.free).toBe(true);
      expect(model!.contextLength).toBe(32768);
      expect(model!.supportsVision).toBe(false);
    });

    it('should exclude paid models', () => {
      const model = service.getModelById('test/vision-model');
      expect(model).toBeUndefined();
    });

    it('should sort models by name', () => {
      const models = service.getModels();
      expect(models[0].name.localeCompare(models[1].name)).toBeLessThanOrEqual(
        0,
      );
    });

    it('should have required fields on each model', () => {
      const models = service.getModels();
      for (const model of models) {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.description).toBeDefined();
        expect(typeof model.free).toBe('boolean');
        expect(typeof model.contextLength).toBe('number');
        expect(typeof model.supportsVision).toBe('boolean');
      }
    });
  });

  describe('with failed OpenRouter fetch', () => {
    beforeEach(async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
    });

    it('should fall back to default models on fetch failure', () => {
      const models = service.getModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include fallback free model', () => {
      const model = service.getModelById('openrouter/free');
      expect(model).toBeDefined();
      expect(model!.name).toBe('Free Models Router');
    });
  });

  describe('with non-OK response', () => {
    beforeEach(async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
      } as unknown as Response);
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
    });

    it('should fall back to default models on non-OK response', () => {
      const models = service.getModels();
      expect(models.length).toBeGreaterThan(0);
      expect(service.getModelById('openrouter/free')).toBeDefined();
    });
  });

  describe('with missing config', () => {
    beforeEach(async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      service = new ModelsService(
        createConfigService({
          'openrouter.baseUrl': '',
          'openrouter.apiKey': '',
        }),
        createMockOllamaService(),
      );
      await service.onModuleInit();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should use fallback models when config is missing', () => {
      const models = service.getModels();
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('getModelById', () => {
    beforeEach(async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([sampleOpenRouterModel]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
    });

    it('should return a model by id', () => {
      const model = service.getModelById('google/gemma-3n-e2b-it:free');
      expect(model).toBeDefined();
      expect(model!.name).toBe('Gemma 3n 2B');
    });

    it('should return undefined for non-existent model', () => {
      const model = service.getModelById('nonexistent-model');
      expect(model).toBeUndefined();
    });
  });

  describe('refreshModels', () => {
    it('should update cached models on refresh', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([sampleOpenRouterModel]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      expect(service.getModels()).toHaveLength(1);

      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          sampleOpenRouterModel,
          anotherWhitelistedFreeModel,
        ]) as unknown as Response,
      );
      await service.refreshModels();
      expect(service.getModels()).toHaveLength(2);
    });

    it('should keep cached models when refresh fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([sampleOpenRouterModel]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      expect(service.getModels()).toHaveLength(1);

      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      await service.refreshModels();
      expect(service.getModels()).toHaveLength(1);
    });
  });

  describe('free model whitelist filtering', () => {
    it('should include whitelisted free models', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([sampleOpenRouterModel]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      expect(service.getModelById('google/gemma-3n-e2b-it:free')).toBeDefined();
    });

    it('should filter out non-whitelisted free models', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          nonWhitelistedFreeModel,
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      expect(service.getModels()).toHaveLength(0);
    });

    it('should exclude paid models', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([sampleVisionModel]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      expect(service.getModelById('test/vision-model')).toBeUndefined();
      expect(service.getModels()).toHaveLength(0);
    });

    it('should keep whitelisted free, drop non-whitelisted free and paid', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          sampleOpenRouterModel,
          nonWhitelistedFreeModel,
          sampleVisionModel,
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      const models = service.getModels();
      expect(models).toHaveLength(1);
      expect(service.getModelById('google/gemma-3n-e2b-it:free')).toBeDefined();
      expect(service.getModelById('test/vision-model')).toBeUndefined();
      expect(
        service.getModelById('unknown-provider/random-model:free'),
      ).toBeUndefined();
    });
  });

  describe('zero-pricing models without :free suffix', () => {
    it('should include whitelisted zero-pricing models without :free suffix', async () => {
      const qwenModel = {
        id: 'qwen/qwen3-235b-a22b-thinking-2507',
        name: 'Qwen3 235B A22B Thinking',
        description: 'Large Qwen model',
        pricing: { prompt: '0', completion: '0' },
        context_length: 131072,
        architecture: { modality: 'text->text' },
      };
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([qwenModel]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      const model = service.getModelById('qwen/qwen3-235b-a22b-thinking-2507');
      expect(model).toBeDefined();
      expect(model!.free).toBe(true);
    });
  });

  describe('edge cases in mapping', () => {
    it('should handle null context_length', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          { ...sampleOpenRouterModel, context_length: null },
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      expect(service.getModels()[0].contextLength).toBe(0);
    });

    it('should handle null architecture', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          { ...sampleOpenRouterModel, architecture: null },
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      expect(service.getModels()[0].supportsVision).toBe(false);
    });

    it('should handle missing name', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          { ...sampleOpenRouterModel, name: '' },
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      expect(service.getModels()[0].name).toBe('google/gemma-3n-e2b-it:free');
    });

    it('should handle missing pricing', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          { ...sampleOpenRouterModel, pricing: null },
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService(), createMockOllamaService());
      await service.onModuleInit();
      expect(service.getModels()[0].free).toBe(true);
    });
  });
});
