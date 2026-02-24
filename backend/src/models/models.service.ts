import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { getErrorMessage } from '../common/utils/get-error-message';

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
 * Only models in this set are shown — paid models are excluded.
 *
 * Models WITHOUT `:free` suffix have zero pricing but may revert to paid.
 * Re-verify periodically with: `curl -s https://openrouter.ai/api/v1/models`
 *
 * Last verified: 2026-02-24 (tested each model with a completion request).
 */
const FREE_MODEL_WHITELIST: ReadonlySet<string> = new Set([
  // Arcee — lightweight, fast
  'arcee-ai/trinity-large-preview:free',
  'arcee-ai/trinity-mini:free',
  // Google Gemma 3 — vision-capable (12b, 4b), efficient (3n variants)
  'google/gemma-3-12b-it:free',
  'google/gemma-3-4b-it:free',
  'google/gemma-3n-e2b-it:free',
  'google/gemma-3n-e4b-it:free',
  // Liquid — small but fast
  'liquid/lfm-2.5-1.2b-instruct:free',
  'liquid/lfm-2.5-1.2b-thinking:free',
  // NVIDIA Nemotron — large context, reliable
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'nvidia/nemotron-nano-9b-v2:free',
  // OpenRouter meta-model — picks best available free model
  'openrouter/free',
  // Qwen 3 — high quality, zero pricing (no :free suffix, may revert)
  'qwen/qwen3-235b-a22b-thinking-2507',
  'qwen/qwen3-vl-235b-a22b-thinking',
  'qwen/qwen3-vl-30b-a3b-thinking',
  // StepFun — large context, reliable
  'stepfun/step-3.5-flash:free',
  // Upstage Solar — reliable
  'upstage/solar-pro-3:free',
  // Z-AI GLM — large context
  'z-ai/glm-4.5-air:free',
]);

const FALLBACK_MODELS: ModelInfo[] = [
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    description: 'Automatically picks from available free models',
    free: true,
    contextLength: 200000,
    supportsVision: true,
  },
  {
    id: 'google/gemma-3-12b-it:free',
    name: 'Gemma 3 12B',
    description: 'Google Gemma 3 with vision support',
    free: true,
    contextLength: 32768,
    supportsVision: true,
  },
  {
    id: 'google/gemma-3-4b-it:free',
    name: 'Gemma 3 4B',
    description: 'Lightweight Google Gemma model',
    free: true,
    contextLength: 32768,
    supportsVision: true,
  },
  {
    id: 'arcee-ai/trinity-large-preview:free',
    name: 'Trinity Large Preview',
    description: 'Arcee AI fast model',
    free: true,
    contextLength: 131000,
    supportsVision: false,
  },
  {
    id: 'stepfun/step-3.5-flash:free',
    name: 'Step 3.5 Flash',
    description: 'StepFun fast model with large context',
    free: true,
    contextLength: 256000,
    supportsVision: false,
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

      if (models.length === 0) {
        this.logger.warn(
          'No models matched whitelist — whitelist may be stale',
        );
      }

      this.cachedModels = models;
      this.logger.log(
        `Loaded ${models.length} free models from OpenRouter (${all.length} total, ${all.filter((m) => m.free).length} free)`,
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to fetch models from OpenRouter: ${getErrorMessage(err)}`,
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

/** Only whitelisted free models are shown; paid models excluded for now. */
function isAllowedModel(m: ModelInfo): boolean {
  return m.free && FREE_MODEL_WHITELIST.has(m.id);
}

function compareModels(a: ModelInfo, b: ModelInfo): number {
  if (a.free !== b.free) return a.free ? -1 : 1;
  return a.name.localeCompare(b.name);
}
