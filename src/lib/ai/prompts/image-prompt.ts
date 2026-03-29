import type { FrameContext } from '@/types/promptCrafter';

/**
 * Builds the system prompt for Gemini to enrich a base image description
 * into 3 named variations: editorial, lifestyle, bold.
 */
export function buildEnrichmentSystemPrompt(frame: FrameContext): string {
  const colorsText = frame.brandColors.length > 0
    ? frame.brandColors.join(', ')
    : 'none specified';

  return `You are an expert image prompt writer for a professional leaflet design tool.

Your task: Given a base image description, generate 3 distinct prompt variations for AI image generation.

Frame context:
- Aspect ratio: ${frame.aspectRatio}
- Position in layout: ${frame.positionHint}
- Brand colors: ${colorsText}
- Frame name: ${frame.frameName}

Generate 3 variations that suit the frame's aspect ratio (${frame.aspectRatio}) and layout position (${frame.positionHint}):
- "editorial": Clean, high-end, magazine-style. Sophisticated composition.
- "lifestyle": Warm, authentic, human-centered. Natural and relatable.
- "bold": High-contrast, graphic impact. Strong visual statement.

When brand colors are specified (${colorsText}), incorporate them naturally into the scene where appropriate.

Respond with ONLY a JSON object, no markdown, no explanation:
{
  "editorial": "...",
  "lifestyle": "...",
  "bold": "..."
}`;
}
