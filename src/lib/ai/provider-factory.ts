import type { AIProvider } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { GeminiProvider } from './providers/gemini';

export function getProvider(): AIProvider {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const preferredProvider = process.env.AI_PROVIDER ?? 'anthropic';

  if (preferredProvider === 'anthropic' && anthropicKey) {
    return new AnthropicProvider({
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
    });
  }
  if (preferredProvider === 'gemini' && geminiKey) {
    return new GeminiProvider({
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    });
  }
  // Fallback: use whichever key is available
  if (anthropicKey) {
    return new AnthropicProvider({ apiKey: anthropicKey, model: 'claude-sonnet-4-20250514' });
  }
  if (geminiKey) {
    return new GeminiProvider({ apiKey: geminiKey, model: 'gemini-2.5-flash' });
  }

  throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env.local');
}
