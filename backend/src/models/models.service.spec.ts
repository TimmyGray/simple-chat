import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ModelsService } from './models.service';

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

function makeOpenRouterResponse(models: Record<string, unknown>[]) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: models }),
  };
}

const sampleOpenRouterModel = {
  id: 'test/model-a',
  name: 'Model A',
  description: 'A test model',
  pricing: { prompt: '0', completion: '0' },
  context_length: 32768,
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
          sampleVisionModel,
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService());
      await service.onModuleInit();
    });

    it('should load models from OpenRouter', () => {
      const models = service.getModels();
      expect(models).toHaveLength(2);
    });

    it('should map model fields correctly', () => {
      const model = service.getModelById('test/model-a');
      expect(model).toBeDefined();
      expect(model!.name).toBe('Model A');
      expect(model!.description).toBe('A test model');
      expect(model!.free).toBe(true);
      expect(model!.contextLength).toBe(32768);
      expect(model!.supportsVision).toBe(false);
    });

    it('should detect paid models from pricing', () => {
      const model = service.getModelById('test/vision-model');
      expect(model).toBeDefined();
      expect(model!.free).toBe(false);
    });

    it('should detect vision support from modality', () => {
      const model = service.getModelById('test/vision-model');
      expect(model).toBeDefined();
      expect(model!.supportsVision).toBe(true);
    });

    it('should sort free models first', () => {
      const models = service.getModels();
      expect(models[0].free).toBe(true);
      expect(models[1].free).toBe(false);
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
      service = new ModelsService(createConfigService());
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
      service = new ModelsService(createConfigService());
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
      service = new ModelsService(createConfigService());
      await service.onModuleInit();
    });

    it('should return a model by id', () => {
      const model = service.getModelById('test/model-a');
      expect(model).toBeDefined();
      expect(model!.name).toBe('Model A');
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
      service = new ModelsService(createConfigService());
      await service.onModuleInit();
      expect(service.getModels()).toHaveLength(1);

      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          sampleOpenRouterModel,
          sampleVisionModel,
        ]) as unknown as Response,
      );
      await service.refreshModels();
      expect(service.getModels()).toHaveLength(2);
    });

    it('should keep cached models when refresh fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([sampleOpenRouterModel]) as unknown as Response,
      );
      service = new ModelsService(createConfigService());
      await service.onModuleInit();
      expect(service.getModels()).toHaveLength(1);

      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      await service.refreshModels();
      expect(service.getModels()).toHaveLength(1);
    });
  });

  describe('edge cases in mapping', () => {
    it('should handle null context_length', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          { ...sampleOpenRouterModel, context_length: null },
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService());
      await service.onModuleInit();
      expect(service.getModels()[0].contextLength).toBe(0);
    });

    it('should handle null architecture', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          { ...sampleOpenRouterModel, architecture: null },
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService());
      await service.onModuleInit();
      expect(service.getModels()[0].supportsVision).toBe(false);
    });

    it('should handle missing name', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          { ...sampleOpenRouterModel, name: '' },
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService());
      await service.onModuleInit();
      expect(service.getModels()[0].name).toBe('test/model-a');
    });

    it('should handle missing pricing', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue(
        makeOpenRouterResponse([
          { ...sampleOpenRouterModel, pricing: null },
        ]) as unknown as Response,
      );
      service = new ModelsService(createConfigService());
      await service.onModuleInit();
      expect(service.getModels()[0].free).toBe(true);
    });
  });
});
