import { NextResponse } from 'next/server';
import type { GenerationRequest, GenerationResponse, FoldType } from '@/types/generation';
import { getProvider } from '@/lib/ai/provider-factory';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompts/system-prompt';
import { validateCanvasJSON, repairCanvasJSON } from '@/lib/ai/schema-validator';
import { FORMATS } from '@/constants/formats';
import { mmToPx } from '@/lib/units';

const VALID_MODES = new Set(['prompt', 'photo', 'sketch']);
const VALID_FOLD_TYPES = new Set(['single', 'bifold', 'trifold', 'zfold']);

const FOLD_TO_FORMAT_ID: Record<FoldType, string> = {
  single: 'A4',
  bifold: 'bifold',
  trifold: 'trifold',
  zfold: 'trifold',
};

const FOLD_PAGE_LABELS: Record<FoldType, string[]> = {
  single: ['Page 1'],
  bifold: ['Front', 'Back', 'Inside Left', 'Inside Right'],
  trifold: ['Front Panel', 'Back Panel', 'Inside Left', 'Inside Center', 'Inside Right', 'Flap'],
  zfold: ['Front Panel', 'Back Panel', 'Inside Left', 'Inside Center', 'Inside Right', 'Flap'],
};

function parseCanvasArray(raw: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) {
    return raw.map((item) =>
      typeof item === 'object' && item !== null
        ? (item as Record<string, unknown>)
        : {}
    );
  }
  // Single canvas object
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Parse body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const req = body as GenerationRequest;

    // Validate required fields
    if (!req.mode || !VALID_MODES.has(req.mode)) {
      return NextResponse.json(
        { error: `"mode" must be one of: prompt, photo, sketch (got "${req.mode}")` },
        { status: 400 }
      );
    }

    if (!req.foldType || !VALID_FOLD_TYPES.has(req.foldType)) {
      return NextResponse.json(
        { error: `"foldType" must be one of: single, bifold, trifold, zfold (got "${req.foldType}")` },
        { status: 400 }
      );
    }

    if (req.mode === 'prompt') {
      if (!req.prompt || req.prompt.trim() === '') {
        return NextResponse.json(
          { error: '"prompt" is required for mode="prompt"' },
          { status: 400 }
        );
      }
    }

    if (req.mode === 'photo' || req.mode === 'sketch') {
      if (!req.imageBase64 || req.imageBase64.trim() === '') {
        return NextResponse.json(
          { error: `"imageBase64" is required for mode="${req.mode}"` },
          { status: 400 }
        );
      }
    }

    // Derive format info
    const formatId = FOLD_TO_FORMAT_ID[req.foldType];
    const pageLabels = FOLD_PAGE_LABELS[req.foldType];
    const fmt = FORMATS[formatId];
    const formatDimensions = {
      widthPx: Math.round(mmToPx(fmt.widthMm)),
      heightPx: Math.round(mmToPx(fmt.heightMm)),
      bleedPx: Math.round(mmToPx(fmt.bleedMm)),
    };

    // Get AI provider
    let provider;
    try {
      provider = getProvider();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Build prompts
    const brandContext = {
      brandColors: req.brandColors,
      typographyPresets: req.typographyPresets,
      style: req.style,
    };

    const systemPrompt = buildSystemPrompt(req.foldType, formatDimensions, brandContext);
    const userPrompt = buildUserPrompt(req);

    // Call AI provider
    let rawResponse: string;
    try {
      if (req.mode === 'prompt') {
        rawResponse = await provider.generate(req, systemPrompt, userPrompt);
      } else {
        rawResponse = await provider.generateWithVision(req, systemPrompt, userPrompt, req.imageBase64!);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: 'AI generation failed', details: message },
        { status: 502 }
      );
    }

    // Parse JSON — with one retry on failure
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      // Retry: ask AI to return only JSON
      const retryPrompt = 'Your previous response was not valid JSON. Please respond with ONLY the JSON object, no markdown or explanation.';
      try {
        let retryResponse: string;
        if (req.mode === 'prompt') {
          retryResponse = await provider.generate(req, systemPrompt, retryPrompt);
        } else {
          retryResponse = await provider.generateWithVision(req, systemPrompt, retryPrompt, req.imageBase64!);
        }
        parsed = JSON.parse(retryResponse);
      } catch (retryErr) {
        const message = retryErr instanceof Error ? retryErr.message : 'Failed to parse AI response as JSON';
        return NextResponse.json(
          { error: 'AI generation failed', details: message },
          { status: 502 }
        );
      }
    }

    // Normalize to array of canvas JSON objects
    const canvasArray = parseCanvasArray(parsed);

    // Validate and repair each canvas
    const repairedCanvases = canvasArray.map((canvas) => {
      const validation = validateCanvasJSON(canvas);
      if (!validation.valid) {
        return repairCanvasJSON(canvas);
      }
      return canvas;
    });

    // Build GenerationResponse
    const pages = repairedCanvases.map((canvasJSON, index) => ({
      canvasJSON,
      pageLabel: pageLabels[index] ?? `Page ${index + 1}`,
    }));

    const response: GenerationResponse = {
      pages,
      formatId,
      suggestedName: extractSuggestedName(req),
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
