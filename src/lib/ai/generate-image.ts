import type { PromptVariations, PromptCustomization, FrameContext } from '@/types/promptCrafter';
import { buildEnrichmentSystemPrompt } from '@/lib/ai/prompts/image-prompt';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function getEndpoint(model: string, apiKey: string): string {
  return `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`;
}

/**
 * Enriches a base image description into 3 named variations using Gemini text API.
 * Returns { editorial, lifestyle, bold }.
 */
export async function enrichPrompt(
  apiKey: string,
  baseDescription: string,
  frameContext: FrameContext
): Promise<PromptVariations> {
  try {
    return await enrichPromptGemini(apiKey, baseDescription, frameContext);
  } catch {
    // Fallback to OpenAI
    const { getOpenAIApiKey } = await import('@/lib/storage/apiKeyStorage');
    const openaiKey = getOpenAIApiKey();
    if (openaiKey) {
      return enrichPromptOpenAI(openaiKey, baseDescription, frameContext);
    }
    throw new Error('Prompt enrichment failed. Check your API keys in Settings.');
  }
}

async function enrichPromptOpenAI(
  apiKey: string,
  baseDescription: string,
  frameContext: FrameContext
): Promise<PromptVariations> {
  const systemPrompt = buildEnrichmentSystemPrompt(frameContext);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4.1',
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: baseDescription },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  try {
    return JSON.parse(fenceMatch ? fenceMatch[1] : text) as PromptVariations;
  } catch {
    throw new Error('Failed to parse OpenAI enrichment response');
  }
}

async function enrichPromptGemini(
  apiKey: string,
  baseDescription: string,
  frameContext: FrameContext
): Promise<PromptVariations> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const systemPrompt = buildEnrichmentSystemPrompt(frameContext);

    const response = await fetch(getEndpoint('gemini-2.5-flash', apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: baseDescription }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 429) {
        throw new Error('API rate limit reached. Please wait a moment and try again.');
      }
      throw new Error(`Prompt enrichment failed (${response.status}). Please try again.`);
    }

    const data = (await response.json()) as {
      candidates: Array<{
        content: { parts: Array<{ text?: string; thought?: boolean }> };
      }>;
    };

    const parts = data.candidates[0]?.content?.parts ?? [];
    const textPart = [...parts].reverse().find((p) => !p.thought && p.text) ?? parts[parts.length - 1];
    const rawText = textPart?.text ?? '';

    try {
      const parsed = JSON.parse(rawText) as PromptVariations;
      return parsed;
    } catch {
      // Try to extract JSON from the response if it's wrapped in markdown or other text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as PromptVariations;
      }
      throw new Error('Failed to parse enrichment response');
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Calls the Gemini image generation API (gemini-2.5-flash-image).
 * Returns a data URL: "data:{mime_type};base64,{data}".
 */
export async function callGeminiImage(
  apiKey: string,
  prompt: string,
  aspectRatio?: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const generationConfig: Record<string, unknown> = {
      responseModalities: ['IMAGE'],
    };
    if (aspectRatio) {
      generationConfig.imageConfig = { aspectRatio };
    }

    const response = await fetch(getEndpoint('gemini-2.5-flash-image', apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 429) {
        let retrySec = '';
        try {
          const err = JSON.parse(errorBody);
          const retryInfo = err.error?.details?.find((d: Record<string, unknown>) =>
            (d['@type'] as string)?.includes('RetryInfo'));
          if (retryInfo?.retryDelay) {
            retrySec = ` Try again in ${retryInfo.retryDelay}.`;
          }
        } catch { /* ignore parse errors */ }
        throw new Error(`API rate limit reached.${retrySec} Your free-tier quota is exhausted — enable billing at https://ai.google.dev for higher limits.`);
      }
      if (response.status === 403) {
        throw new Error('Image generation access denied. Please check your API key has image generation access and billing is enabled.');
      }
      throw new Error(`Image generation failed (${response.status}). Please try again.`);
    }

    const data = (await response.json()) as {
      candidates: Array<{
        content: { parts: Array<{ inline_data?: { mime_type: string; data: string }; text?: string }> };
      }>;
    };

    const parts = data.candidates[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inline_data);

    if (!imagePart?.inline_data) {
      throw new Error('No image in response');
    }

    const { mime_type, data: base64Data } = imagePart.inline_data;
    return `data:${mime_type};base64,${base64Data}`;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Calls the OpenAI DALL-E 3 image generation API.
 * Returns a data URL: "data:image/png;base64,{data}".
 */
export async function callOpenAIImage(
  apiKey: string,
  prompt: string,
  aspectRatio?: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  // Map aspect ratio to DALL-E size
  let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
  if (aspectRatio) {
    const [w, h] = aspectRatio.split(':').map(Number);
    if (w && h) {
      const ratio = w / h;
      if (ratio > 1.3) size = '1792x1024';
      else if (ratio < 0.77) size = '1024x1792';
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        response_format: 'b64_json',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 429) {
        throw new Error('OpenAI rate limit reached. Please try again in a moment.');
      }
      throw new Error(`OpenAI image generation failed (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
      data: Array<{ b64_json: string }>;
    };

    const base64Data = data.data[0]?.b64_json;
    if (!base64Data) {
      throw new Error('No image in OpenAI response');
    }

    return `data:image/png;base64,${base64Data}`;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Assembles a final prompt string from a base variation and customization knobs.
 * Joins non-empty knobs: mood -> "${mood} mood", lighting -> "${lighting} lighting",
 * composition -> as-is, style -> "${style} style", background -> "${background} background".
 */
export function assemblePrompt(
  baseVariation: string,
  customization: PromptCustomization
): string {
  const parts: string[] = [baseVariation];

  if (customization.mood) {
    parts.push(`${customization.mood} mood`);
  }
  if (customization.lighting) {
    parts.push(`${customization.lighting} lighting`);
  }
  if (customization.composition) {
    parts.push(customization.composition);
  }
  if (customization.style) {
    parts.push(`${customization.style} style`);
  }
  if (customization.background) {
    parts.push(`${customization.background} background`);
  }

  return parts.join(', ');
}

// Gemini's 5 supported aspect ratios as [width_ratio, height_ratio]
const GEMINI_RATIOS: [string, number][] = [
  ['1:1', 1 / 1],
  ['3:4', 3 / 4],
  ['4:3', 4 / 3],
  ['9:16', 9 / 16],
  ['16:9', 16 / 9],
];

/**
 * Maps any frame ratio (widthPx / heightPx) to the closest Gemini supported ratio.
 * Uses log-ratio comparison for perceptually uniform distance across the range.
 */
export function snapAspectRatio(widthPx: number, heightPx: number): string {
  const logRatio = Math.log(widthPx / heightPx);
  let closest = GEMINI_RATIOS[0][0];
  let minDiff = Math.abs(logRatio - Math.log(GEMINI_RATIOS[0][1]));

  for (const [name, r] of GEMINI_RATIOS) {
    const diff = Math.abs(logRatio - Math.log(r));
    if (diff < minDiff) {
      minDiff = diff;
      closest = name;
    }
  }

  return closest;
}

/**
 * Converts a data URL (data:image/png;base64,...) to a Blob.
 */
export function base64ToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Generates a small thumbnail (100px wide) from a data URL.
 * Returns a JPEG data URL at 0.7 quality.
 * Falls back to the original dataUrl if OffscreenCanvas is unavailable (e.g. in tests/SSR).
 */
export async function generateThumbnail(dataUrl: string): Promise<string> {
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
    return dataUrl;
  }

  const blob = base64ToBlob(dataUrl);
  const bitmap = await createImageBitmap(blob);

  const THUMB_WIDTH = 100;
  const scale = THUMB_WIDTH / bitmap.width;
  const thumbHeight = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(THUMB_WIDTH, thumbHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(bitmap, 0, 0, THUMB_WIDTH, thumbHeight);
  bitmap.close();

  const thumbBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(thumbBlob);
  });
}

/**
 * Places a generated image into a Fabric.js image frame, replacing the placeholder.
 * Follows the pattern from ImageSection.tsx.
 */
export async function placeImageIntoFrame(
  canvas: import('fabric').Canvas,
  frameObj: import('fabric').FabricObject & Record<string, unknown>,
  dataUrl: string,
  imageId: string
): Promise<void> {
  const { FabricImage } = await import('fabric');
  const { storeImage } = await import('@/lib/storage/imageDb');
  const { useCanvasStore } = await import('@/stores/canvasStore');

  useCanvasStore.getState().captureUndoState?.();

  // Convert dataUrl to blob then objectUrl to avoid render blocking (research pitfall 2)
  const blob = base64ToBlob(dataUrl);
  const objectUrl = URL.createObjectURL(blob);

  let img: import('fabric').FabricImage;
  try {
    img = await FabricImage.fromURL(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const targetW = ((frameObj.width as number) ?? 100) * ((frameObj.scaleX as number) ?? 1);
  const targetH = ((frameObj.height as number) ?? 100) * ((frameObj.scaleY as number) ?? 1);

  img.set({
    left: frameObj.left as number,
    top: frameObj.top as number,
    originX: 'left',
    originY: 'top',
    scaleX: targetW / (img.width || 1),
    scaleY: targetH / (img.height || 1),
  });

  // Copy custom properties from frame
  Object.assign(img, {
    customType: 'image',
    name: frameObj.name || 'Image',
    id: frameObj.id || crypto.randomUUID(),
    locked: frameObj.locked ?? false,
    visible: true,
    imageId,
    fitMode: frameObj.fitMode || 'fill',
  });

  const idx = canvas.getObjects().indexOf(frameObj as import('fabric').FabricObject);
  const prevRender = canvas.renderOnAddRemove;
  canvas.renderOnAddRemove = false;
  canvas.insertAt(idx, img as unknown as import('fabric').FabricObject);
  canvas.remove(frameObj as import('fabric').FabricObject);
  canvas.renderOnAddRemove = prevRender;
  canvas.setActiveObject(img as unknown as import('fabric').FabricObject);
  canvas.requestRenderAll();

  // Persist to IndexedDB and use the returned ID
  const storedImageId = await storeImage(blob);
  (img as unknown as Record<string, unknown>).imageId = storedImageId;
}
