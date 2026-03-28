import type { AIProvider, ProviderConfig } from '../types';
import type { GenerationRequest } from '@/types/generation';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

function extractJSON(text: string): string {
  // Extract JSON from markdown code fences if present
  const fenceMatch = text.match(/```json?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return text.trim();
}

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4-20250514',
    };
  }

  async generate(
    _request: GenerationRequest,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as { content: Array<{ text: string }> };
      const rawText = data.content[0]?.text ?? '';
      return extractJSON(rawText);
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateWithVision(
    _request: GenerationRequest,
    systemPrompt: string,
    userPrompt: string,
    imageBase64: string
  ): Promise<string> {
    // Strip data:image/...;base64, prefix
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 8192,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64Data,
                  },
                },
                { type: 'text', text: userPrompt },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as { content: Array<{ text: string }> };
      const rawText = data.content[0]?.text ?? '';
      return extractJSON(rawText);
    } finally {
      clearTimeout(timeout);
    }
  }
}
