import type { GenerationRequest, FoldType } from '@/types/generation';
import { mmToPx } from '@/lib/units';
import { FORMATS } from '@/constants/formats';

export interface FormatDimensions {
  widthPx: number;
  heightPx: number;
  bleedPx: number;
}

export interface BrandContext {
  brandColors?: string[];
  typographyPresets?: GenerationRequest['typographyPresets'];
  style?: string;
}

const FOLD_PAGE_LABELS: Record<FoldType, string[]> = {
  single:   ['Page 1'],
  bifold:   ['Front', 'Back', 'Inside Left', 'Inside Right'],
  tripanel: ['Panel 1', 'Panel 2', 'Panel 3'],
  trifold:  ['Front Panel', 'Back Panel', 'Inside Left', 'Inside Center', 'Inside Right', 'Flap'],
  zfold:    ['Front Panel', 'Back Panel', 'Inside Left', 'Inside Center', 'Inside Right', 'Flap'],
};

function getFormatDimensions(foldType: FoldType): FormatDimensions {
  const formatIdMap: Record<FoldType, string> = {
    single: 'A4',
    bifold: 'bifold',
    tripanel: 'A4',
    trifold: 'trifold',
    zfold: 'trifold',
  };
  const formatId = formatIdMap[foldType];
  const fmt = FORMATS[formatId];
  return {
    widthPx: Math.round(mmToPx(fmt.widthMm)),
    heightPx: Math.round(mmToPx(fmt.heightMm)),
    bleedPx: Math.round(mmToPx(fmt.bleedMm)),
  };
}

export function buildSystemPrompt(
  foldType: FoldType,
  formatDimensions?: FormatDimensions,
  brandContext?: BrandContext
): string {
  const dims = formatDimensions ?? getFormatDimensions(foldType);
  const pageLabels = FOLD_PAGE_LABELS[foldType];
  const isMultiPage = pageLabels.length > 1;

  const brandSection = buildBrandSection(brandContext);
  const exampleJSON = buildExampleJSON(dims);

  return `You are an expert print-design AI that generates Fabric.js 7 canvas JSON for professional leaflet layouts.

## Output Format

Respond with ONLY valid JSON — no markdown, no explanation, no code fences. Your entire response must be parseable by JSON.parse().

${isMultiPage
    ? `Return a JSON **array** of EXACTLY ${pageLabels.length} canvas objects, one per page. Each canvas object is a complete, independent page with its own background rect and elements. The pages are: ${pageLabels.map((l, i) => `[${i}]="${l}"`).join(', ')}. You MUST return exactly ${pageLabels.length} objects in the array — no more, no less.`
    : `Return a single canvas JSON object for the page labeled "${pageLabels[0]}".`
}

## Canvas Dimensions

- Width: ${dims.widthPx}px
- Height: ${dims.heightPx}px
- Bleed: ${dims.bleedPx}px (extend background elements to the bleed boundary)
- DPI: 72

## Required Fabric.js JSON Schema

Every canvas object you return MUST have this top-level structure:

\`\`\`
{
  "version": "6.0.0",
  "objects": [ ...array of Fabric.js objects... ]
}
\`\`\`

### Background Rect (REQUIRED as first object)

The very first object in the \`objects\` array MUST be the document background rect:

\`\`\`json
{
  "type": "Rect",
  "version": "6.0.0",
  "originX": "left",
  "originY": "top",
  "left": ${-dims.bleedPx},
  "top": ${-dims.bleedPx},
  "width": ${dims.widthPx + dims.bleedPx * 2},
  "height": ${dims.heightPx + dims.bleedPx * 2},
  "fill": "#FFFFFF",
  "stroke": null,
  "strokeWidth": 0,
  "_isDocBackground": true,
  "customType": "colorBlock",
  "id": "doc-background",
  "name": "Background",
  "locked": true,
  "visible": true,
  "selectable": false,
  "evented": false
}
\`\`\`

### Required Custom Properties on Every Object

ALL objects (except the background rect which uses locked=true) MUST include:

| Property | Type | Notes |
|----------|------|-------|
| customType | string | One of: "text", "image", "shape", "colorBlock" |
| id | string | UUID format, unique per object |
| name | string | Descriptive label, e.g. "Headline", "Hero Image" |
| locked | boolean | false for all user-editable elements |
| visible | boolean | true |
| originX | string | MUST be "left" (Fabric.js 7 requirement) |
| originY | string | MUST be "top" (Fabric.js 7 requirement) |

Additional properties by customType:
- **image**: also include \`"imageId": null\` and \`"fitMode": "fill"\`
- **shape**: also include \`"shapeKind": "rect"\` | \`"circle"\` | \`"line"\`

## Element Type Examples

### Text Element (customType="text")
\`\`\`json
{
  "type": "Textbox",
  "version": "6.0.0",
  "originX": "left",
  "originY": "top",
  "left": 40,
  "top": 80,
  "width": 400,
  "height": 60,
  "fill": "#1a1a1a",
  "fontFamily": "Inter",
  "fontSize": 36,
  "fontWeight": 700,
  "lineHeight": 1.2,
  "textAlign": "left",
  "text": "Your Headline Here",
  "customType": "text",
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Headline",
  "locked": false,
  "visible": true
}
\`\`\`

### Image Placeholder (customType="image")
\`\`\`json
{
  "type": "Rect",
  "version": "6.0.0",
  "originX": "left",
  "originY": "top",
  "left": 0,
  "top": 0,
  "width": 595,
  "height": 280,
  "fill": "#e0e0e0",
  "stroke": "#cccccc",
  "strokeWidth": 1,
  "customType": "image",
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Hero Image",
  "locked": false,
  "visible": true,
  "imageId": null,
  "fitMode": "fill"
}
\`\`\`

### Shape Element (customType="shape")
\`\`\`json
{
  "type": "Rect",
  "version": "6.0.0",
  "originX": "left",
  "originY": "top",
  "left": 40,
  "top": 40,
  "width": 80,
  "height": 4,
  "fill": "#6366f1",
  "stroke": null,
  "strokeWidth": 0,
  "rx": 2,
  "ry": 2,
  "customType": "shape",
  "shapeKind": "rect",
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "name": "Accent Bar",
  "locked": false,
  "visible": true
}
\`\`\`

### Color Block (customType="colorBlock")
\`\`\`json
{
  "type": "Rect",
  "version": "6.0.0",
  "originX": "left",
  "originY": "top",
  "left": 0,
  "top": 600,
  "width": 595,
  "height": 242,
  "fill": "#1a1a2e",
  "stroke": null,
  "strokeWidth": 0,
  "customType": "colorBlock",
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "name": "Footer Background",
  "locked": false,
  "visible": true
}
\`\`\`

## Full Example Canvas JSON

\`\`\`json
${exampleJSON}
\`\`\`

## Design Rules

1. Use real UUIDs for all id fields (format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
2. STRICTLY place ALL elements within canvas bounds (0,0 to ${dims.widthPx},${dims.heightPx}) — no element's left+width may exceed ${dims.widthPx} and no element's top+height may exceed ${dims.heightPx}. Background rect is the ONLY exception (extends to bleed).
3. Use "Inter" as the default font family unless brand specifies otherwise
4. Font sizes: headlines 28-48px, subheads 18-24px, body 12-16px, captions 10-12px
5. Ensure sufficient contrast for text legibility
6. Create a visually complete layout — fill the canvas with meaningful design elements
7. Every text element must have actual copy (headline, body text, call-to-action)
8. Include at least one image placeholder for visual interest
9. Use the full canvas height — don't leave large empty zones
10. For multi-panel layouts, each panel is a complete, coherent design section

${brandSection}

## Mode-Specific Instructions

**Photo mode:** Create a STRUCTURAL DRAFT inspired by the image — NOT a pixel-perfect copy. Your goal is to capture the layout structure, not reproduce every visual detail.

Steps:
1. Identify the major content zones: header, body sections, image areas, footer
2. For each zone, create simple elements: colored background rectangles, text boxes with short placeholder text, image placeholders
3. Use the dominant colors from the image for backgrounds and accents
4. Keep text SHORT — use labels like "Headline", "Subheading", "Body text here", "Contact info". Do NOT try to reproduce exact text from the image character by character.
5. Where the image has photos or illustrations, place a single image placeholder (customType="image") — not a complex recreation
6. Aim for 8-15 elements total. Fewer, well-positioned elements are better than many tiny ones
7. Focus on getting the POSITIONS and PROPORTIONS right — the user will edit the content later

**Sketch mode:** Interpret drawn boxes as image placeholders or content zones. Scribbles/wavy lines = text areas. Blobs/filled areas = image placeholders or color blocks. Respect the spatial layout of the sketch but produce a polished, professional result. IMPORTANT: Ignore notebook/ruled paper lines, grid lines, and any other background paper patterns — these are artifacts of the drawing surface, NOT part of the layout design. Focus only on the intentional drawn elements. If a box contains text like "Img", "Image", "Photo", "Pic", or a cross/X pattern, treat it as an image placeholder (customType="image" with imageId=null and fitMode="fill") — the user will replace it with an actual image later.

**Prompt mode:** Generate a complete, print-ready leaflet design based on the text description. Infer the brand feel, content structure, and visual hierarchy from the description.`;
}

function buildBrandSection(brandContext?: BrandContext): string {
  if (!brandContext) return '';

  const parts: string[] = ['## Brand Context'];

  if (brandContext.brandColors && brandContext.brandColors.length > 0) {
    parts.push(`**Brand Colors:** ${brandContext.brandColors.join(', ')}`);
    parts.push('Use these colors for backgrounds, accents, buttons, and text where appropriate. Build the color palette around these brand colors.');
  } else {
    parts.push('No brand colors provided. Choose a harmonious, professional color palette appropriate for the content.');
  }

  if (brandContext.typographyPresets && brandContext.typographyPresets.length > 0) {
    parts.push('\n**Typography Presets:**');
    for (const preset of brandContext.typographyPresets) {
      parts.push(`- ${preset.name}: ${preset.fontFamily} ${preset.fontSize}px/${preset.fontWeight}wt, color ${preset.color}`);
    }
    parts.push('Apply these typography styles to matching text elements (headlines, body, captions).');
  }

  if (brandContext.style) {
    const styleGuides: Record<string, string> = {
      minimal: 'Clean, lots of whitespace, simple geometric shapes, restrained color use, thin typography.',
      bold: 'Large typography, high contrast, strong geometric shapes, vibrant colors, dynamic layouts.',
      corporate: 'Professional, structured grid layout, conservative colors, formal typography, trustworthy feel.',
      playful: 'Rounded shapes, bright colors, varied font sizes, energetic layout, friendly tone.',
      elegant: 'Sophisticated typography, muted/neutral palette with one accent, generous whitespace, refined details.',
    };
    const guide = styleGuides[brandContext.style] ?? brandContext.style;
    parts.push(`\n**Visual Style:** ${brandContext.style} — ${guide}`);
  }

  return parts.join('\n');
}

function buildExampleJSON(dims: FormatDimensions): string {
  return JSON.stringify({
    version: '6.0.0',
    objects: [
      {
        type: 'Rect',
        version: '6.0.0',
        originX: 'left',
        originY: 'top',
        left: -dims.bleedPx,
        top: -dims.bleedPx,
        width: dims.widthPx + dims.bleedPx * 2,
        height: dims.heightPx + dims.bleedPx * 2,
        fill: '#0f172a',
        stroke: null,
        strokeWidth: 0,
        _isDocBackground: true,
        customType: 'colorBlock',
        id: 'doc-background',
        name: 'Background',
        locked: true,
        visible: true,
        selectable: false,
        evented: false,
      },
      {
        type: 'Rect',
        version: '6.0.0',
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
        width: dims.widthPx,
        height: Math.round(dims.heightPx * 0.45),
        fill: '#e2e8f0',
        stroke: '#cbd5e1',
        strokeWidth: 1,
        customType: 'image',
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Hero Image',
        locked: false,
        visible: true,
        imageId: null,
        fitMode: 'fill',
      },
      {
        type: 'Rect',
        version: '6.0.0',
        originX: 'left',
        originY: 'top',
        left: 40,
        top: Math.round(dims.heightPx * 0.47),
        width: 60,
        height: 4,
        fill: '#6366f1',
        stroke: null,
        strokeWidth: 0,
        rx: 2,
        ry: 2,
        customType: 'shape',
        shapeKind: 'rect',
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Accent Bar',
        locked: false,
        visible: true,
      },
      {
        type: 'Textbox',
        version: '6.0.0',
        originX: 'left',
        originY: 'top',
        left: 40,
        top: Math.round(dims.heightPx * 0.5),
        width: dims.widthPx - 80,
        height: 56,
        fill: '#f8fafc',
        fontFamily: 'Inter',
        fontSize: 36,
        fontWeight: 700,
        lineHeight: 1.2,
        textAlign: 'left',
        text: 'Your Headline Here',
        customType: 'text',
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Headline',
        locked: false,
        visible: true,
      },
      {
        type: 'Textbox',
        version: '6.0.0',
        originX: 'left',
        originY: 'top',
        left: 40,
        top: Math.round(dims.heightPx * 0.62),
        width: dims.widthPx - 80,
        height: 80,
        fill: '#94a3b8',
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.6,
        textAlign: 'left',
        text: 'Body text goes here. Describe your product or service with compelling copy that speaks to your audience.',
        customType: 'text',
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Body Text',
        locked: false,
        visible: true,
      },
      {
        type: 'Rect',
        version: '6.0.0',
        originX: 'left',
        originY: 'top',
        left: 40,
        top: Math.round(dims.heightPx * 0.78),
        width: 140,
        height: 40,
        fill: '#6366f1',
        stroke: null,
        strokeWidth: 0,
        rx: 6,
        ry: 6,
        customType: 'colorBlock',
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'CTA Button Background',
        locked: false,
        visible: true,
      },
      {
        type: 'Textbox',
        version: '6.0.0',
        originX: 'left',
        originY: 'top',
        left: 40,
        top: Math.round(dims.heightPx * 0.785),
        width: 140,
        height: 30,
        fill: '#ffffff',
        fontFamily: 'Inter',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.3,
        textAlign: 'center',
        text: 'Get Started Today',
        customType: 'text',
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'CTA Button Text',
        locked: false,
        visible: true,
      },
    ],
  }, null, 2);
}

export function buildUserPrompt(request: GenerationRequest): string {
  switch (request.mode) {
    case 'prompt':
      return `Design a professional leaflet based on the following description:\n\n${request.prompt ?? 'A general purpose leaflet'}`;

    case 'photo':
      return `Create a simple structural draft inspired by this image. Identify the main content zones (header, sections, images, footer) and their approximate positions. Use colored rectangles for backgrounds, short placeholder text ("Headline", "Body text", "CTA"), and image placeholders where photos appear. Keep it simple — 8 to 15 elements max. Do NOT copy text from the image verbatim. Focus on layout structure, not visual reproduction.`;

    case 'sketch':
      return `Interpret this sketch as a leaflet layout blueprint. Treat rectangular boxes as content zones (image placeholders or text areas), scribbles as text regions, and filled areas as color blocks. Produce a polished, professional leaflet design that respects the spatial layout shown in the sketch. IMPORTANT: The sketch may be drawn on ruled/lined notebook paper or grid paper — completely ignore all horizontal lines, vertical lines, or grid patterns that are part of the paper itself. Only interpret the hand-drawn marks as layout elements. Boxes labeled "Img", "Image", "Photo", or containing an X/cross must be image placeholders (customType="image", imageId=null, fitMode="fill").`;
  }
}
