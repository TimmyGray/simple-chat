import { describe, it, expect, beforeEach } from 'vitest';
import { ModelsService } from './models.service';

describe('ModelsService', () => {
  let service: ModelsService;

  beforeEach(() => {
    service = new ModelsService();
  });

  describe('getModels', () => {
    it('should return a list of available models', () => {
      const models = service.getModels();
      expect(models).toBeDefined();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include at least one free model', () => {
      const models = service.getModels();
      const freeModels = models.filter((m) => m.free);
      expect(freeModels.length).toBeGreaterThan(0);
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

  describe('getModelById', () => {
    it('should return a model by id', () => {
      const model = service.getModelById('openrouter/free');
      expect(model).toBeDefined();
      expect(model!.name).toBe('Free Models Router');
    });

    it('should return undefined for non-existent model', () => {
      const model = service.getModelById('nonexistent-model');
      expect(model).toBeUndefined();
    });
  });
});
