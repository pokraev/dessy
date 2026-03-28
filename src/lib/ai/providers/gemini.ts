import type { AIProvider, ProviderConfig } from '../types';
import type { GenerationRequest } from '@/types/generation';

function getEndpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-2.5-flash',
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
      const response = await fetch(getEndpoint(this.config.model, this.config.apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as {
        candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      };
      return data.candidates[0]?.content?.parts[0]?.text ?? '';
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
      const response = await fetch(getEndpoint(this.config.model, this.config.apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Data,
                  },
                },
                { text: userPrompt },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as {
        candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      };
      return data.candidates[0]?.content?.parts[0]?.text ?? '';
    } finally {
      clearTimeout(timeout);
    }
  }
}
