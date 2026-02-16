import { Injectable } from '@nestjs/common';

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  free: boolean;
  contextLength: number;
  supportsVision: boolean;
}

@Injectable()
export class ModelsService {
  private readonly models: ModelInfo[] = [
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

  getModels(): ModelInfo[] {
    return this.models;
  }

  getModelById(id: string): ModelInfo | undefined {
    return this.models.find((m) => m.id === id);
  }
}
