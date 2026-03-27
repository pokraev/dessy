import type { GenerationRequest } from '@/types/generation';

export interface ProviderConfig {
  apiKey: string;
  model: string;
}

export interface AIProvider {
  name: string;
  generate(request: GenerationRequest, systemPrompt: string, userPrompt: string): Promise<string>;
  generateWithVision(request: GenerationRequest, systemPrompt: string, userPrompt: string, imageBase64: string): Promise<string>;
}
