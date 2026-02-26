import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import type { ModelInfo } from './models.service';

interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}

const REFRESH_INTERVAL_MS = 3_600_000; // 1 hour
const DETECTION_TIMEOUT_MS = 5_000;

/** Ollama model families known to support vision/multimodal input. */
const VISION_FAMILIES: ReadonlySet<string> = new Set([
  'llava',
  'llava-llama3',
  'bakllava',
  'moondream',
  'minicpm-v',
]);

@Injectable()
export class OllamaService implements OnModuleInit {
  private readonly logger = new Logger(OllamaService.name);
  private cachedModels: ModelInfo[] = [];
  private available = false;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('ollama.baseUrl')!;
  }

  async onModuleInit(): Promise<void> {
    await this.refreshModels();
  }

  isAvailable(): boolean {
    return this.available;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getModels(): ModelInfo[] {
    return this.cachedModels;
  }

  isOllamaModel(modelId: string): boolean {
    return this.cachedModels.some((m) => m.id === modelId);
  }

  @Interval(REFRESH_INTERVAL_MS)
  async refreshModels(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(DETECTION_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.debug(
          `Ollama returned ${response.status}, marking as unavailable`,
        );
        this.available = false;
        this.cachedModels = [];
        return;
      }

      const body = (await response.json()) as { models: OllamaModel[] };

      if (!Array.isArray(body.models)) {
        this.available = false;
        this.cachedModels = [];
        return;
      }

      this.available = true;
      this.cachedModels = body.models.map(mapOllamaModel);
      this.logger.log(
        `Ollama detected: ${this.cachedModels.length} local models available`,
      );
    } catch {
      if (this.available) {
        this.logger.log('Ollama is no longer reachable, clearing local models');
      }
      this.available = false;
      this.cachedModels = [];
    }
  }
}

function mapOllamaModel(m: OllamaModel): ModelInfo {
  const families = m.details?.families ?? [];
  const supportsVision = families.some((f) => VISION_FAMILIES.has(f));
  const paramSize = m.details?.parameter_size ?? '';

  return {
    id: `ollama/${m.name}`,
    name: `${m.name} ${paramSize}`.trim(),
    description:
      `Local model (${m.details?.family ?? 'unknown'}, ${m.details?.quantization_level ?? ''})`.trim(),
    free: true,
    contextLength: 0,
    supportsVision,
    provider: 'ollama',
  };
}
