// src/lib/ai/generate-leaflet.ts
import type { GenerationRequest, GenerationResponse, FoldType } from '@/types/generation';
import type { AIProvider } from '@/lib/storage/apiKeyStorage';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompts/system-prompt';
import { validateCanvasJSON, repairCanvasJSON } from '@/lib/ai/schema-validator';
import { FORMATS } from '@/constants/formats';
import { mmToPx } from '@/lib/units';

const FOLD_TO_FORMAT_ID: Record<FoldType, string> = {
  single: 'A4',
  bifold: 'bifold',
  tripanel: 'A4',
  trifold: 'trifold',
  zfold: 'trifold',
};

const FOLD_PAGE_LABELS: Record<FoldType, string[]> = {
  single: ['Page 1'],
  bifold: ['Front', 'Back', 'Inside Left', 'Inside Right'],
  tripanel: ['Panel 1', 'Panel 2', 'Panel 3'],
  trifold: ['Front Panel', 'Back Panel', 'Inside Left', 'Inside Center', 'Inside Right', 'Flap'],
  zfold: ['Front Panel', 'Back Panel', 'Inside Left', 'Inside Center', 'Inside Right', 'Flap'],
};

// --- Gemini ---

function getGeminiEndpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  imageBase64?: string,
  maxOutputTokens = 32768
): Promise<string> {
  const model = 'gemini-2.5-flash';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const parts: Array<Record<string, unknown>> = [];

    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({ inline_data: { mime_type: 'image/jpeg', data: base64Data } });
    }

    parts.push({ text: userPrompt });

    const response = await fetch(getGeminiEndpoint(model, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{
        finishReason?: string;
        content: {
          parts: Array<{ text?: string; thought?: boolean }>;
        };
      }>;
    };

    const candidate = data.candidates[0];
    if (candidate?.finishReason === 'MAX_TOKENS') {
      throw new Error('TRUNCATED');
    }

    const responseParts = candidate?.content?.parts ?? [];
    const responsePart = [...responseParts].reverse().find((p) => !p.thought) ?? responseParts[responseParts.length - 1];
    return responsePart?.text ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

// --- Claude ---

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  imageBase64?: string,
  maxTokens = 16384
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const content: Array<Record<string, unknown>> = [];

    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const mediaType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64Data },
      });
    }

    content.push({ type: 'text', text: userPrompt });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt + '\n\nIMPORTANT: Respond with ONLY the raw JSON. No markdown code fences, no explanation, no text before or after the JSON.',
        messages: [{ role: 'user', content }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
      stop_reason?: string;
    };

    if (data.stop_reason === 'max_tokens') {
      throw new Error('TRUNCATED');
    }

    const textBlock = data.content.find((b) => b.type === 'text');
    const text = textBlock?.text ?? '';

    // Strip markdown code fences if present
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    return fenceMatch ? fenceMatch[1] : text;
  } finally {
    clearTimeout(timeout);
  }
}

// --- OpenAI ---

async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  imageBase64?: string,
  maxTokens = 16384
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = [];

    if (imageBase64) {
      content.push({
        type: 'image_url',
        image_url: { url: imageBase64 },
      });
    }

    content.push({ type: 'text', text: userPrompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt + '\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown code fences.' },
          { role: 'user', content },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string }; finish_reason?: string }>;
    };

    if (data.choices[0]?.finish_reason === 'length') {
      throw new Error('TRUNCATED');
    }

    const text = data.choices[0]?.message?.content ?? '';
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    return fenceMatch ? fenceMatch[1] : text;
  } finally {
    clearTimeout(timeout);
  }
}

// --- Shared ---

async function callWithRetry(
  fn: (maxTokens?: number) => Promise<string>,
  retryTokens?: number
): Promise<string> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Error && err.message === 'TRUNCATED' && retryTokens) {
      return fn(retryTokens);
    }
    throw err;
  }
}

async function callProvider(
  provider: AIProvider,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  imageBase64?: string,
): Promise<string> {
  const callFn = (p: AIProvider, key: string) => {
    if (p === 'claude') return () => callClaude(key, systemPrompt, userPrompt, imageBase64);
    if (p === 'openai') return (maxTokens?: number) => callOpenAI(key, systemPrompt, userPrompt, imageBase64, maxTokens);
    return (maxTokens?: number) => callGemini(key, systemPrompt, userPrompt, imageBase64, maxTokens);
  };

  const retryTokens = provider === 'gemini' ? 65536 : provider === 'openai' ? 32768 : undefined;

  try {
    return await callWithRetry(callFn(provider, apiKey), retryTokens);
  } catch {
    // Fallback to OpenAI if available and wasn't the primary
    if (provider !== 'openai') {
      const { getOpenAIApiKey } = await import('@/lib/storage/apiKeyStorage');
      const openaiKey = getOpenAIApiKey();
      if (openaiKey) {
        return callWithRetry(callFn('openai', openaiKey), 32768);
      }
    }
    // Fallback to Gemini if available and wasn't the primary
    if (provider !== 'gemini') {
      const { getApiKey } = await import('@/lib/storage/apiKeyStorage');
      const geminiKey = getApiKey();
      if (geminiKey) {
        return callWithRetry(callFn('gemini', geminiKey), 65536);
      }
    }
    throw new Error('All AI providers failed. Check your API keys in Settings.');
  }
}

function parseCanvasArray(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) {
    return raw.map((item) =>
      typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {}
    );
  }
  if (typeof raw === 'object' && raw !== null) {
    return [raw as Record<string, unknown>];
  }
  return [];
}

function extractSuggestedName(request: GenerationRequest): string {
  if (request.mode === 'prompt' && request.prompt) {
    return request.prompt.slice(0, 30).trim();
  }
  const modeLabels: Record<string, string> = {
    photo: 'Photo Leaflet',
    sketch: 'Sketch Leaflet',
    prompt: 'AI Leaflet',
  };
  return modeLabels[request.mode] ?? 'AI Leaflet';
}

export async function generateLeaflet(
  apiKey: string,
  request: GenerationRequest,
  provider: AIProvider = 'gemini'
): Promise<GenerationResponse> {
  const formatId = FOLD_TO_FORMAT_ID[request.foldType];
  const pageLabels = FOLD_PAGE_LABELS[request.foldType];
  const fmt = FORMATS[formatId];
  const formatDimensions = {
    widthPx: Math.round(mmToPx(fmt.widthMm)),
    heightPx: Math.round(mmToPx(fmt.heightMm)),
    bleedPx: Math.round(mmToPx(fmt.bleedMm)),
  };

  const brandContext = {
    brandColors: request.brandColors,
    typographyPresets: request.typographyPresets,
    style: request.style,
  };

  const systemPrompt = buildSystemPrompt(request.foldType, formatDimensions, brandContext, request.maxObjects);
  const userPrompt = buildUserPrompt(request);

  const image = request.mode !== 'prompt' ? request.imageBase64! : undefined;
  let rawResponse: string;

  try {
    rawResponse = await callProvider(provider, apiKey, systemPrompt, userPrompt, image);
  } catch (err) {
    if (err instanceof Error && err.message === 'TRUNCATED') {
      // Claude truncation — retry with more tokens
      rawResponse = await callClaude(apiKey, systemPrompt, userPrompt, image, 32768);
    } else {
      throw err;
    }
  }

  // Parse JSON — with one retry on failure
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    const retryPrompt =
      'Your previous response was not valid JSON. Please respond with ONLY the JSON object, no markdown or explanation.';
    rawResponse = await callProvider(provider, apiKey, systemPrompt, retryPrompt, image);
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      throw new Error('AI returned invalid JSON after retry. Please try again.');
    }
  }

  // Normalize and repair
  const canvasArray = parseCanvasArray(parsed);
  const repairedCanvases = canvasArray.map((canvas) => {
    const validation = validateCanvasJSON(canvas);
    if (!validation.valid) {
      return repairCanvasJSON(canvas);
    }
    return canvas;
  });

  const pages = repairedCanvases.map((canvasJSON, index) => ({
    canvasJSON,
    pageLabel: pageLabels[index] ?? `Page ${index + 1}`,
  }));

  return { pages, formatId, suggestedName: extractSuggestedName(request) };
}
