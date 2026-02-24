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

/**
 * Curated list of free model IDs known to work reliably on OpenRouter.
 * Free models NOT in this set are filtered out to avoid 429 rate-limit errors.
 * Paid models are never filtered. Last verified: 2026-02-24.
 */
const FREE_MODEL_WHITELIST: ReadonlySet<string> = new Set([
  'deepseek/deepseek-r1-0528:free',
  'google/gemma-3-27b-it:free',
  'google/gemma-3n-e2b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'openai/gpt-oss-120b:free',
  'openrouter/free',
  'stepfun/step-3.5-flash:free',
]);

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
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1',
    description: 'DeepSeek reasoning model',
    free: true,
    contextLength: 128000,
    supportsVision: false,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    description: 'Meta Llama 3.3 instruct model',
    free: true,
    contextLength: 128000,
    supportsVision: false,
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
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nemotron Nano 12B VL',
    description: 'NVIDIA vision-language model',
    free: true,
    contextLength: 32768,
    supportsVision: true,
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

      const all = body.data.map(mapToModelInfo);
      const models = all.filter(isAllowedModel).sort(compareModels);

      if (all.some((m) => m.free) && !models.some((m) => m.free)) {
        this.logger.warn(
          'No free models matched whitelist — whitelist may be stale',
        );
      }

      this.cachedModels = models;
      this.logger.log(
        `Loaded ${models.length} models from OpenRouter (${all.length} total)`,
      );
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

/** Paid models always pass; free models must be in the curated whitelist. */
function isAllowedModel(m: ModelInfo): boolean {
  return !m.free || FREE_MODEL_WHITELIST.has(m.id);
}

function compareModels(a: ModelInfo, b: ModelInfo): number {
  if (a.free !== b.free) return a.free ? -1 : 1;
  return a.name.localeCompare(b.name);
}
