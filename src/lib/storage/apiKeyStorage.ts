const GEMINI_KEY = 'dessy-gemini-api-key';
const CLAUDE_KEY = 'dessy-claude-api-key';
const PROVIDER_KEY = 'dessy-ai-provider';

export type AIProvider = 'gemini' | 'claude';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GEMINI_KEY);
}

export function setApiKey(key: string): void {
  localStorage.setItem(GEMINI_KEY, key);
}

export function getClaudeApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CLAUDE_KEY);
}

export function setClaudeApiKey(key: string): void {
  localStorage.setItem(CLAUDE_KEY, key);
}

export function getProvider(): AIProvider {
  if (typeof window === 'undefined') return 'gemini';
  return (localStorage.getItem(PROVIDER_KEY) as AIProvider) || 'gemini';
}

export function setProvider(provider: AIProvider): void {
  localStorage.setItem(PROVIDER_KEY, provider);
}

export function clearApiKey(): void {
  localStorage.removeItem(GEMINI_KEY);
}

export function clearClaudeApiKey(): void {
  localStorage.removeItem(CLAUDE_KEY);
}
