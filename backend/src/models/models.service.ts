import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  free: boolean;
  contextLength: number;
  supportsVision: boolean;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: { prompt: string; completion: string };
  context_length: number | null;
  architecture: { modality: string } | null;
}

const REFRESH_INTERVAL_MS = 3_600_000; // 1 hour

const FALLBACK_MODELS: ModelInfo[] = [
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    description: 'Automatically picks from available free models',
    free: true,
    contextLength: 128000,
    supportsVision: true,
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT-OSS 120B',
    description: 'OpenAI open-source 120B model',
    free: true,
    contextLength: 128000,
    supportsVision: false,
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder 480B',
    description: 'Large coding-focused model by Qwen',
    free: true,
    contextLength: 65536,
    supportsVision: false,
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nemotron Nano 12B VL',
    description: 'NVIDIA vision-language model',
    free: true,
    contextLength: 32768,
    supportsVision: true,
  },
  {
    id: 'google/gemma-3n-e2b-it:free',
    name: 'Gemma 3n 2B',
    description: 'Lightweight Google model',
    free: true,
    contextLength: 32768,
    supportsVision: false,
  },
  {
    id: 'openrouter/auto',
    name: 'Auto (Smart Routing)',
    description: 'Picks the best model (may cost credits)',
    free: false,
    contextLength: 128000,
    supportsVision: true,
  },
];

@Injectable()
export class ModelsService implements OnModuleInit {
  private readonly logger = new Logger(ModelsService.name);
  private cachedModels: ModelInfo[] = FALLBACK_MODELS;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.refreshModels();
  }

  getModels(): ModelInfo[] {
    return this.cachedModels;
  }

  getModelById(id: string): ModelInfo | undefined {
    return this.cachedModels.find((m) => m.id === id);
  }

  @Interval(REFRESH_INTERVAL_MS)
  async refreshModels(): Promise<void> {
    const baseUrl = this.configService.get<string>('openrouter.baseUrl');
    const apiKey = this.configService.get<string>('openrouter.apiKey');

    if (!baseUrl || !apiKey) {
      this.logger.warn('OpenRouter config missing, using fallback model list');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        this.logger.warn(
          `OpenRouter /models returned ${response.status}, using cached list`,
        );
        return;
      }

      const body = (await response.json()) as {
        data: OpenRouterModel[];
      };

      if (!Array.isArray(body.data) || body.data.length === 0) {
        this.logger.warn(
          'OpenRouter /models returned empty data, using cached list',
        );
        return;
      }

      const models = body.data.map(mapToModelInfo).sort(compareModels);

      this.cachedModels = models;
      this.logger.log(`Loaded ${models.length} models from OpenRouter`);
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to fetch models from OpenRouter: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

function mapToModelInfo(m: OpenRouterModel): ModelInfo {
  const promptFree = !m.pricing?.prompt || parseFloat(m.pricing.prompt) === 0;
  const completionFree =
    !m.pricing?.completion || parseFloat(m.pricing.completion) === 0;

  return {
    id: m.id,
    name: m.name || m.id,
    description: m.description || '',
    free: promptFree && completionFree,
    contextLength: m.context_length ?? 0,
    supportsVision: m.architecture?.modality?.includes('image') ?? false,
  };
}

function compareModels(a: ModelInfo, b: ModelInfo): number {
  if (a.free !== b.free) return a.free ? -1 : 1;
  return a.name.localeCompare(b.name);
}
