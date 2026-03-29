// src/lib/ai/generate-leaflet.ts
import type { GenerationRequest, GenerationResponse, FoldType } from '@/types/generation';
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

    // Gemini 2.5 models include thinking parts (thought: true) before the actual response.
    // Find the last non-thought part which contains the JSON output.
    const responseParts = candidate?.content?.parts ?? [];
    const responsePart = [...responseParts].reverse().find((p) => !p.thought) ?? responseParts[responseParts.length - 1];
    return responsePart?.text ?? '';
  } finally {
    clearTimeout(timeout);
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
  request: GenerationRequest
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

  const systemPrompt = buildSystemPrompt(request.foldType, formatDimensions, brandContext);
  const userPrompt = buildUserPrompt(request);

  // Call Gemini — retry with more tokens if truncated
  let rawResponse: string;
  const image = request.mode !== 'prompt' ? request.imageBase64! : undefined;
  try {
    rawResponse = await callGemini(apiKey, systemPrompt, userPrompt, image);
  } catch (err) {
    if (err instanceof Error && err.message === 'TRUNCATED') {
      rawResponse = await callGemini(apiKey, systemPrompt, userPrompt, image, 65536);
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
    const retryResponse = await callGemini(apiKey, systemPrompt, retryPrompt, image);
    parsed = JSON.parse(retryResponse);
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
