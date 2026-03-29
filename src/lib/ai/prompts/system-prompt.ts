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
  brandContext?: BrandContext,
  maxObjects?: number
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
${maxObjects ? `11. Generate UP TO ${maxObjects} elements (not counting the background rect). Do not exceed this limit.` : ''}

${brandSection}

## Mode-Specific Instructions

**Photo mode:** Recreate the image's layout by extracting every colored region, text zone, and image area.

Rules:
1. Every region in the image that has a distinct background color MUST become a colorBlock Rect with that exact color, at the correct position and size. This is the most important rule — the colored regions ARE the layout.
2. Where the image has photos or illustrations, place an image placeholder (customType="image") at the correct position and size.
3. Where the image has text, place a Textbox with SHORT placeholder text describing its purpose (e.g. "Brand Name", "Price", "Description"). Do NOT copy the actual text.
4. The goal: if you removed all text and images from the original, you should see the same colored shapes as the colorBlocks you generated.

**Sketch mode:** Treat the sketch as a blueprint — interpret it precisely and produce a clean, grid-aligned layout.

Rules:
1. Drawn boxes = content zones (image placeholders or colorBlocks). Scribbles/wavy lines = text areas. Blobs = image placeholders.
2. SNAP TO GRID: If two elements have nearly the same position (within ~10px), give them the EXACT same coordinate. If two elements have nearly the same width or height, make them EXACTLY the same size. The output should look like it was placed on a grid, not hand-drawn.
3. ALIGN ROWS AND COLUMNS: Elements that appear to form a row should share the exact same "top" value. Elements in a column should share the exact same "left" value. Elements in a grid should have uniform widths, heights, and gaps.
4. UNIFORM SIZING: If multiple boxes look roughly the same size, make them exactly the same width and height. Product cards, image slots, or info blocks that repeat should be identical dimensions.
5. Ignore notebook/ruled paper lines, grid lines, and paper patterns — these are artifacts, not layout.
6. Boxes labeled "Img", "Image", "Photo", "Pic", or containing an X/cross = image placeholder (customType="image", imageId=null, fitMode="fill").
7. Produce a clean, professional blueprint — as if an architect drew it, not a person sketching on paper.

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
      return `Extract every colored region from this image as a colorBlock rectangle with the exact background color, position, and size. Add image placeholders where photos appear. Add short placeholder text where text appears. The colored regions are the layout — do not skip any.`;

    case 'sketch':
      return `Interpret this sketch as a precise blueprint. Snap elements to a grid: elements with nearly the same position get the exact same coordinates, elements with nearly the same size get identical dimensions. Rows align, columns align, repeating elements are uniform. Ignore paper lines/grid patterns. Any box labeled "Img", "img", "IMG", "Image", "image", "Photo", "photo", "Pic", "pic", or containing an X/cross pattern MUST become an image placeholder (customType="image", imageId=null, fitMode="fill"). Produce a clean, architect-quality layout.`;
  }
}
