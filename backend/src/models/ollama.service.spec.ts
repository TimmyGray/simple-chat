import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from './ollama.service';

const OLLAMA_BASE_URL = 'http://localhost:11434';

const mockOllamaResponse = {
  models: [
    {
      name: 'llama3:latest',
      model: 'llama3:latest',
      modified_at: '2026-02-20T10:00:00Z',
      size: 4_000_000_000,
      details: {
        parent_model: '',
        format: 'gguf',
        family: 'llama',
        families: ['llama'],
        parameter_size: '8B',
        quantization_level: 'Q4_0',
      },
    },
    {
      name: 'llava:latest',
      model: 'llava:latest',
      modified_at: '2026-02-20T10:00:00Z',
      size: 4_500_000_000,
      details: {
        parent_model: '',
        format: 'gguf',
        family: 'llava',
        families: ['llava'],
        parameter_size: '7B',
        quantization_level: 'Q4_0',
      },
    },
  ],
};

describe('OllamaService', () => {
  let service: OllamaService;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const module = await Test.createTestingModule({
      providers: [
        OllamaService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'ollama.baseUrl') return OLLAMA_BASE_URL;
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get(OllamaService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects Ollama and fetches models', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockOllamaResponse),
    });

    await service.refreshModels();

    expect(service.isAvailable()).toBe(true);
    expect(service.getModels()).toHaveLength(2);
  });

  it('maps model IDs with ollama/ prefix', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockOllamaResponse),
    });

    await service.refreshModels();

    const models = service.getModels();
    expect(models[0].id).toBe('ollama/llama3:latest');
    expect(models[1].id).toBe('ollama/llava:latest');
  });

  it('sets provider to ollama for all models', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockOllamaResponse),
    });

    await service.refreshModels();

    for (const model of service.getModels()) {
      expect(model.provider).toBe('ollama');
      expect(model.free).toBe(true);
    }
  });

  it('detects vision-capable models', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockOllamaResponse),
    });

    await service.refreshModels();

    const models = service.getModels();
    const llama = models.find((m) => m.id === 'ollama/llama3:latest');
    const llava = models.find((m) => m.id === 'ollama/llava:latest');

    expect(llama?.supportsVision).toBe(false);
    expect(llava?.supportsVision).toBe(true);
  });

  it('marks unavailable when Ollama is not reachable', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await service.refreshModels();

    expect(service.isAvailable()).toBe(false);
    expect(service.getModels()).toHaveLength(0);
  });

  it('marks unavailable on non-ok response', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 500 });

    await service.refreshModels();

    expect(service.isAvailable()).toBe(false);
    expect(service.getModels()).toHaveLength(0);
  });

  it('identifies Ollama models by ID', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockOllamaResponse),
    });

    await service.refreshModels();

    expect(service.isOllamaModel('ollama/llama3:latest')).toBe(true);
    expect(service.isOllamaModel('openrouter/free')).toBe(false);
  });

  it('returns correct base URL', () => {
    expect(service.getBaseUrl()).toBe(OLLAMA_BASE_URL);
  });

  it('handles empty models array gracefully', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ models: [] }),
    });

    await service.refreshModels();

    expect(service.isAvailable()).toBe(true);
    expect(service.getModels()).toHaveLength(0);
  });
});
