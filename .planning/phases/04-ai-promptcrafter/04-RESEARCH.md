# Phase 4: AI PromptCrafter and Image Generation - Research

**Researched:** 2026-03-29
**Domain:** Gemini image generation API, prompt enrichment, Fabric.js image placement, IndexedDB image history
**Confidence:** HIGH (core stack, patterns, and API formats verified against official sources)

---

## Summary

Phase 4 adds two tightly coupled features: PromptCrafter (enriched prompt building) and AI image generation with history. The existing codebase already has everything needed — Gemini API calling infrastructure (`callGemini` in `generate-leaflet.ts`), IndexedDB image storage (`imageDb.ts`), Fabric.js image frame placement patterns (`ImageSection.tsx`, `canvas-loader.ts`), API key management, and the modal/panel UI patterns. Nothing new needs to be installed.

The central architecture question is **where the PromptCrafter UI lives**. The most natural integration point is a dedicated modal (similar to `GenerateLeafletModal`) that is context-aware: it reads the currently selected image frame's dimensions and position from the canvas to inject into prompt enrichment. The modal flow is: describe → enrich (3 variations) → customize knobs → generate → preview → place / regenerate / edit.

Image generation uses the Gemini image generation API (`gemini-2.5-flash-image` model) via the same native-fetch pattern already established. The model is currently not on the free tier (as of March 2026), so users will need a paid Gemini API key — consistent with the existing pattern of prompting users for their key.

**Primary recommendation:** Build PromptCrafter as a new modal `PromptCrafterModal` that reuses `callGemini` for enrichment (text output) and adds a new `callGeminiImage` function for image generation (using `responseModalities: ["IMAGE"]`). Image blobs are stored via the existing `imageDb.ts` and placed into the selected frame using the established `FabricImage.fromURL` + replace-at-index pattern.

---

## Standard Stack

### Core (already installed — no new dependencies needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `fabric` | 7.2.0 | Canvas — image placement into frames | Already used; `FabricImage.fromURL` + replace-at-index is the established pattern |
| `idb` | 8.0.3 | IndexedDB — persist generated image blobs | Already used for image storage (`imageDb.ts`) |
| `zustand` | 5.0.12 | State — prompt state, history | Already used for all stores |
| `motion` | 12.38.0 | Animations — modal, loading states | Already used throughout |
| `lucide-react` | 1.7.0 | Icons | Already used throughout |
| `react-hot-toast` | 2.6.0 | Feedback toasts | Already used |

### No New Dependencies Required
All needed capabilities are already in `package.json`. The Gemini image generation API is accessed via native `fetch`, same as the existing layout generation.

**Installation:** None required.

---

## Architecture Patterns

### Recommended File Structure
```
src/
├── lib/ai/
│   ├── generate-leaflet.ts         # Existing — reuse callGemini
│   ├── generate-image.ts           # NEW — callGeminiImage, enrichPrompt
│   └── prompts/
│       ├── system-prompt.ts        # Existing
│       └── image-prompt.ts         # NEW — enrichment + image prompt builders
├── stores/
│   ├── promptCrafterStore.ts       # NEW — prompt state, history entries
│   └── ...existing stores
├── components/editor/modals/
│   ├── PromptCrafterModal.tsx      # NEW — full PromptCrafter flow
│   ├── tabs/                       # Existing
│   └── ...existing modals
└── types/
    └── promptCrafter.ts            # NEW — PromptVariation, ImageHistoryEntry types
```

### Pattern 1: Gemini Text Generation for Prompt Enrichment (AIPC-02, AIPC-03)

Use `callGemini` from `generate-leaflet.ts` to request 3 prompt variations. The system prompt instructs the model to output a strict JSON object with `editorial`, `lifestyle`, and `bold` keys. Parse the JSON response exactly as the layout generation does.

```typescript
// Source: pattern from src/lib/ai/generate-leaflet.ts callGemini + generationConfig.responseMimeType
async function enrichPrompt(
  apiKey: string,
  baseDescription: string,
  frameContext: FrameContext,
  brandColors: string[]
): Promise<PromptVariations> {
  const systemPrompt = buildEnrichmentSystemPrompt(frameContext, brandColors);
  const raw = await callGemini(
    apiKey,
    systemPrompt,
    `Enrich this image description: "${baseDescription}"`,
    undefined,
    // maxOutputTokens — 1024 is sufficient for 3 short prompts
    1024
  );
  // callGemini already uses responseMimeType: 'application/json'
  return JSON.parse(raw) as PromptVariations;
}
```

**Frame context** to inject into enrichment (AIPC-03): read from canvas active object at modal open time:
```typescript
interface FrameContext {
  widthPx: number;
  heightPx: number;
  aspectRatio: string;   // e.g. "3:4", "16:9", "1:1"
  positionHint: string;  // e.g. "top-left quarter", "full-width banner"
  brandColors: string[]; // from useBrandStore
  leafletStyle?: string; // from projectStore meta if available
}
```

### Pattern 2: Gemini Image Generation (AIMG-01, AIMG-02)

A new `callGeminiImage` function mirrors `callGemini` but targets the image generation model and requests `responseModalities: ["IMAGE"]`. The response base64 data is extracted from `candidate.content.parts` where `inline_data` is present.

```typescript
// Source: https://ai.google.dev/gemini-api/docs/image-generation (official docs)
// Model: gemini-2.5-flash-image (stable as of March 2026)
// Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent

async function callGeminiImage(
  apiKey: string,
  prompt: string,
  aspectRatio: string = '1:1'
): Promise<string> {  // returns base64 data URL
  const model = 'gemini-2.5-flash-image';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini Image API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p: { inline_data?: { mime_type: string; data: string } }) => p.inline_data
    );
    if (!imagePart?.inline_data) throw new Error('No image in response');

    const { mime_type, data: b64 } = imagePart.inline_data;
    return `data:${mime_type};base64,${b64}`;
  } finally {
    clearTimeout(timeout);
  }
}
```

**Aspect ratio mapping:** Derive from frame dimensions at generation time. Gemini accepts `"1:1"`, `"3:4"`, `"4:3"`, `"9:16"`, `"16:9"`. Snap to nearest valid ratio.

### Pattern 3: Placing Generated Image into Canvas Frame (AIMG-03)

Reuse the exact replace-at-index pattern from `ImageSection.tsx` and `canvas-loader.ts`. The flow:
1. Convert base64 data URL → `Blob` → store in IndexedDB via `storeImage(blob)` → get `imageId`
2. `FabricImage.fromURL(dataUrl)` to create the Fabric image
3. Set `left/top/scaleX/scaleY` to match the target frame's bounds
4. Copy custom props (`customType: 'image'`, `name`, `id`, `imageId`, `fitMode: 'fill'`)
5. `canvas.insertAt(idx, img)` + `canvas.remove(oldObj)` + `canvas.setActiveObject(img)`
6. `canvas.requestRenderAll()`
7. `captureUndoState?.()` before replacement

```typescript
// Source: established pattern in src/components/editor/panels/sections/ImageSection.tsx
async function placeImageIntoFrame(
  canvas: Canvas,
  frameObj: FabricObject & Record<string, unknown>,
  dataUrl: string,
  imageId: string
) {
  useCanvasStore.getState().captureUndoState?.();
  const { FabricImage } = await import('fabric');
  const img = await FabricImage.fromURL(dataUrl);
  const targetW = (frameObj.width ?? 100) * (frameObj.scaleX ?? 1);
  const targetH = (frameObj.height ?? 100) * (frameObj.scaleY ?? 1);
  img.set({
    left: frameObj.left, top: frameObj.top,
    originX: 'left', originY: 'top',
    scaleX: targetW / (img.width || 1),
    scaleY: targetH / (img.height || 1),
  });
  Object.assign(img, {
    customType: 'image', name: frameObj.name || 'AI Image',
    id: frameObj.id || crypto.randomUUID(),
    locked: false, visible: true,
    imageId, fitMode: frameObj.fitMode || 'fill',
  });
  const idx = canvas.getObjects().indexOf(frameObj as FabricObject);
  const prev = canvas.renderOnAddRemove;
  canvas.renderOnAddRemove = false;
  canvas.insertAt(idx, img as unknown as FabricObject);
  canvas.remove(frameObj as FabricObject);
  canvas.renderOnAddRemove = prev;
  canvas.setActiveObject(img as unknown as FabricObject);
  canvas.requestRenderAll();
}
```

### Pattern 4: Image History Store (AIMG-04)

A new `promptCrafterStore` holds history entries. Each entry stores the prompt used, the `imageId` (IndexedDB key), and a thumbnail data URL for preview display (stored as a 100px wide JPEG to keep memory low).

```typescript
// src/stores/promptCrafterStore.ts
interface ImageHistoryEntry {
  id: string;              // UUID
  imageId: string;         // IndexedDB key — use getImage(imageId) to get object URL
  thumbnailDataUrl: string; // Small preview for history grid
  prompt: string;          // Full prompt used
  generatedAt: string;     // ISO timestamp
}

interface PromptCrafterState {
  history: ImageHistoryEntry[];
  addToHistory: (entry: ImageHistoryEntry) => void;
  clearHistory: () => void;
}
```

History persists in `localStorage` (serialized) since thumbnails are small data URLs. Full images stay in IndexedDB.

### Pattern 5: Live Prompt Assembly (AIPC-04, AIPC-05)

The prompt displayed to the user is assembled deterministically from state. When any knob changes, the visible prompt text re-derives. No debouncing needed — the prompt text is cheap to compute.

```typescript
interface PromptCustomization {
  mood: string;          // e.g. 'warm', 'cool', 'dramatic', 'neutral'
  lighting: string;      // e.g. 'natural daylight', 'studio', 'golden hour'
  composition: string;   // e.g. 'close-up', 'wide shot', 'overhead'
  style: string;         // e.g. 'photorealistic', 'editorial', 'product'
  background: string;    // e.g. 'white', 'bokeh', 'solid color'
}

function assemblePrompt(
  baseVariation: string,
  customization: PromptCustomization
): string {
  const parts = [baseVariation];
  if (customization.mood) parts.push(`${customization.mood} mood`);
  if (customization.lighting) parts.push(`${customization.lighting} lighting`);
  if (customization.composition) parts.push(customization.composition);
  if (customization.style) parts.push(`${customization.style} style`);
  if (customization.background) parts.push(`${customization.background} background`);
  return parts.join(', ');
}
```

### PromptCrafter Modal UI Flow

The modal is a single multi-step view (not tabs). State machine: `idle` → `enriching` → `customizing` → `generating` → `result`.

```
Step 1 (idle):         Textarea for base description + "Enrich" button
Step 2 (enriching):    Spinner "Crafting prompts..."
Step 3 (customizing):  3 variation cards (Editorial / Lifestyle / Bold)
                       Selected variation shows customization knobs
                       Live prompt text area (editable, reflects knobs)
                       "Generate Image" button
Step 4 (generating):   Spinner "Generating image..."
Step 5 (result):       Preview image
                       "Use This" / "Regenerate" / "Edit Prompt" buttons
                       History strip at bottom
```

### Anti-Patterns to Avoid
- **Do NOT fetch full image from IndexedDB for history thumbnails:** Store a separate downsized data URL (`thumbnailDataUrl`) with each history entry. `getImage()` creates a new object URL on every call and the caller is responsible for revoking it — calling it repeatedly for a history grid causes memory leaks.
- **Do NOT store base64 image in localStorage:** Sizes will be 200-800KB per image. Use IndexedDB for full images (already established pattern via `imageDb.ts`).
- **Do NOT use a separate image generation SDK:** The existing native `fetch` pattern is the project standard and avoids bundle size increase.
- **Do NOT create new Fabric canvas instances:** Placement must operate on the canvas instance from `canvasStore.canvasRef` — the project uses single-canvas architecture.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB image storage | Custom IndexedDB wrapper | `idb` via existing `imageDb.ts` | Already implemented; `storeImage/getImage/deleteImage` cover all cases |
| Frame replacement in canvas | Custom z-order tracking | Established `insertAt(idx) + remove()` pattern | Tested pattern from ImageSection.tsx and canvas-loader.ts |
| Aspect ratio computation | Custom pixel math | Snap to nearest of Gemini's 5 ratios | Gemini only accepts fixed ratios; snapping is trivial |
| Thumbnail generation | Canvas `toDataURL` resize | `createImageBitmap` + OffscreenCanvas | Simple downscale to 100px wide before storing in history |
| Prompt text editing | Rich text editor | Plain `<textarea>` | Live-updated prompt is plain text; markdown or formatting adds no value |

---

## Common Pitfalls

### Pitfall 1: Gemini Image Generation Not on Free Tier
**What goes wrong:** API returns 403 or "billing required" when user has a free Gemini API key.
**Why it happens:** As of March 2026, `gemini-2.5-flash-image` and all Imagen 4 models require a paid API key. The existing layout generation uses `gemini-2.5-flash` (text only) which has a free tier — image generation is a separate billing category.
**How to avoid:** Show a clear error message distinguishing "no API key" from "API key does not have image generation access." The error response from Gemini will be a 403 with a billing message.
**Warning signs:** `response.status === 403` from the image generation endpoint.

### Pitfall 2: FabricImage.fromURL with Data URLs Can Block Render
**What goes wrong:** Calling `FabricImage.fromURL` with a large base64 data URL causes a brief UI freeze.
**Why it happens:** Fabric.js creates an `<img>` element and waits for it to load; large data URLs parse synchronously in the browser's HTML parser.
**How to avoid:** Convert the base64 data URL to a `Blob` first, then use `URL.createObjectURL(blob)` to get an object URL. `FabricImage.fromURL` with an object URL is non-blocking and faster. Remember to `URL.revokeObjectURL` after Fabric loads the image.
**Warning signs:** UI stutter or flash of blank canvas after image generation.

### Pitfall 3: Object URL Leaks from getImage()
**What goes wrong:** `imageDb.getImage(id)` creates a new object URL every call. If called on every render (e.g., history grid), URLs accumulate and are never revoked.
**Why it happens:** `URL.createObjectURL(blob)` allocates memory until `URL.revokeObjectURL` is called. The existing `getImage` implementation does not revoke.
**How to avoid:** Load object URLs once per history entry on mount, store them in a `ref`, and revoke on component unmount. Alternatively, use the `thumbnailDataUrl` stored in history (not IndexedDB blob) for history grid display.
**Warning signs:** Browser tab memory growing monotonically during image history browsing.

### Pitfall 4: Selected Frame Lost When Modal Opens
**What goes wrong:** When the PromptCrafter modal opens, the user navigates away from the canvas selection, so `canvas.getActiveObject()` returns null when "Use This" is clicked.
**Why it happens:** Modal interaction deselects the canvas object.
**How to avoid:** Capture the target frame's `id`, `left`, `top`, `width`, `height`, `scaleX`, `scaleY` at the moment the modal opens (before it renders). Store this snapshot in modal state. On "Use This", find the frame by id via `canvas.getObjects().find(o => o.id === frameId)`.
**Warning signs:** "Use This" button silently fails or places image at wrong position.

### Pitfall 5: Gemini Image API aspectRatio Must Be One of 5 Fixed Values
**What goes wrong:** Sending an arbitrary aspect ratio (e.g., "2:3") to the image generation API returns a 400 error.
**Why it happens:** Gemini only accepts `"1:1"`, `"3:4"`, `"4:3"`, `"9:16"`, `"16:9"`.
**How to avoid:** Snap the frame's pixel ratio to the nearest supported ratio before calling the API.
**Warning signs:** `response.status === 400` when frame is an unusual size.

### Pitfall 6: Enrichment Response May Contain Partial JSON
**What goes wrong:** The `callGemini` function with `responseMimeType: 'application/json'` should return clean JSON, but network errors or max-token limits can produce truncated output.
**Why it happens:** Same issue that the layout generation handles with retry logic.
**How to avoid:** Wrap enrichment JSON.parse in a try/catch with a user-facing error message. No auto-retry needed for enrichment since it's a lightweight call.

---

## Code Examples

### Aspect Ratio Snapping
```typescript
// Snap frame pixel dimensions to nearest Gemini-supported aspect ratio
const GEMINI_ASPECT_RATIOS = [
  { ratio: '1:1', value: 1 },
  { ratio: '3:4', value: 3/4 },
  { ratio: '4:3', value: 4/3 },
  { ratio: '9:16', value: 9/16 },
  { ratio: '16:9', value: 16/9 },
] as const;

function snapAspectRatio(widthPx: number, heightPx: number): string {
  const frameRatio = widthPx / heightPx;
  let closest = GEMINI_ASPECT_RATIOS[0];
  let minDiff = Math.abs(frameRatio - closest.value);
  for (const r of GEMINI_ASPECT_RATIOS) {
    const diff = Math.abs(frameRatio - r.value);
    if (diff < minDiff) { minDiff = diff; closest = r; }
  }
  return closest.ratio;
}
```

### Base64 to Blob to Object URL (avoids blocking)
```typescript
function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
```

### Thumbnail Generation (100px wide)
```typescript
async function generateThumbnail(dataUrl: string): Promise<string> {
  const img = await createImageBitmap(base64ToBlob(dataUrl));
  const scale = 100 / img.width;
  const canvas = new OffscreenCanvas(100, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
  return new Promise((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
```

### Enrichment System Prompt Shape
```typescript
// Returns JSON: { editorial: string, lifestyle: string, bold: string }
// with responseMimeType: 'application/json' already set in callGemini
function buildEnrichmentSystemPrompt(frame: FrameContext, brandColors: string[]): string {
  return `You are a creative director specializing in print design photography.
Given a basic image description and context, produce 3 enriched prompt variations
optimized for AI image generation. Respond with ONLY valid JSON matching this schema:
{ "editorial": "...", "lifestyle": "...", "bold": "..." }

Context:
- Frame aspect ratio: ${frame.aspectRatio}
- Frame position: ${frame.positionHint}
- Brand colors: ${brandColors.length ? brandColors.join(', ') : 'none specified'}

Variation guidelines:
- editorial: Clean, magazine-quality, professional, strong composition
- lifestyle: Authentic, warm, human-centered, natural setting
- bold: High contrast, graphic, impactful, minimal props`;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` SDK | Native `fetch` to `generativelanguage.googleapis.com` | Phase 01.1 decision | No SDK dependency; consistent with existing codebase |
| `gemini-2.5-flash` for text | Same model for text enrichment | No change | Reuse existing `callGemini` |
| N/A (no image gen) | `gemini-2.5-flash-image` for image output | Phase 4 new | Paid-tier only; returns base64 in `inline_data` parts |
| Imagen 3 | Imagen 4 (imagen-4.0-generate-001) or `gemini-2.5-flash-image` | 2025 | Imagen 3 shut down; use `gemini-2.5-flash-image` for consistency with existing Gemini key |

**Deprecated/outdated:**
- `gemini-2.0-flash-exp` image generation: Was an experimental free-tier option; no longer reliable as of late 2025. Do not use.
- `@google/generative-ai` SDK: Replaced by native fetch pattern in this project (Phase 01.1 decision).
- Imagen 3: Shut down by Google.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AIPC-01 | User can type a basic image description in a text area | Simple textarea in PromptCrafterModal step 1; no special library needed |
| AIPC-02 | User can click "Enrich" to get 3 prompt variations (Editorial, Lifestyle, Bold) via Gemini | Reuse `callGemini` from `generate-leaflet.ts` with `responseMimeType: 'application/json'`; parse JSON response with `{editorial, lifestyle, bold}` keys |
| AIPC-03 | Prompt enrichment uses leaflet context, frame dimensions, frame position, and brand colors | Capture frame snapshot at modal open; inject into `buildEnrichmentSystemPrompt`; read brand colors from `useBrandStore` |
| AIPC-04 | User can customize prompt via mood, lighting, composition, style, and background controls | 5 dropdown/select controls that call `assemblePrompt()` on change; no external libraries needed |
| AIPC-05 | Each customization change live-updates the visible/editable prompt text | `assemblePrompt()` runs on every state change; result displayed in a readonly-but-editable textarea |
| AIMG-01 | User can generate an image from the enriched prompt via Gemini | New `callGeminiImage()` using `gemini-2.5-flash-image` model with `responseModalities: ["IMAGE"]`; returns base64 |
| AIMG-02 | User can see loading state during generation and preview the result | `isGenerating` boolean state; spinner during call; `<img>` preview after; pattern mirrors `GenerateLeafletModal` |
| AIMG-03 | User can "Use This" to place image into selected canvas frame, or "Regenerate" / "Edit Prompt" | `placeImageIntoFrame()` using established `FabricImage.fromURL + insertAt/remove` pattern; preserve frameId snapshot |
| AIMG-04 | User can see history of all generated images and click to reuse any | `promptCrafterStore.history[]` with `thumbnailDataUrl` + `imageId`; clicking re-fetches blob from IndexedDB via `getImage()` |
</phase_requirements>

---

## Open Questions

1. **Modal entry point: header button or right-panel "Generate AI Image" button?**
   - What we know: `GenerateLeafletModal` is opened from the header. The PromptCrafter is frame-specific (needs a selected image frame).
   - What's unclear: Should the button be in the header (always visible) or in the ImageSection of the right panel (only visible when an image frame is selected)?
   - Recommendation: Place "Generate AI Image" button in `ImageSection.tsx` (right panel, image frame selected). This makes the frame context obvious to the user and avoids "no frame selected" errors. Also add a header button that opens the modal but prompts user to select a frame first if none is selected.

2. **History persistence scope: per-project or global?**
   - What we know: localStorage is used for project data; IndexedDB for image blobs. History entries need to be readable across sessions.
   - What's unclear: Whether history should be scoped per-project (makes "reuse" more relevant) or global.
   - Recommendation: Store history in `localStorage` keyed as `dessy-image-history` (global, max 50 entries). This is simpler to implement and more useful — users may want to reuse images across projects. The IndexedDB blob lives indefinitely until explicitly deleted.

3. **What happens when "Use This" is called but the original frame was deleted?**
   - What we know: We capture the frameId at modal open. If the user deletes the frame while the modal is open (modal doesn't block canvas interaction), `canvas.getObjects().find(o => o.id === frameId)` returns undefined.
   - Recommendation: If frame is not found, create a new image frame at canvas center with the generated image. Show a toast explaining the original frame was not found.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 + ts-jest + jsdom |
| Config file | `jest.config.ts` (root) |
| Quick run command | `npx jest --testPathPattern="promptCrafter\|generate-image" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AIPC-02 | Enrichment returns 3 variations from Gemini JSON response | unit | `npx jest --testPathPattern="generate-image" -t "enrichPrompt"` | ❌ Wave 0 |
| AIPC-03 | Frame context is correctly injected into enrichment prompt | unit | `npx jest --testPathPattern="image-prompt" -t "buildEnrichmentSystemPrompt"` | ❌ Wave 0 |
| AIPC-04/05 | `assemblePrompt` updates correctly for each knob change | unit | `npx jest --testPathPattern="generate-image" -t "assemblePrompt"` | ❌ Wave 0 |
| AIMG-01 | `callGeminiImage` parses base64 from inline_data response part | unit (mock fetch) | `npx jest --testPathPattern="generate-image" -t "callGeminiImage"` | ❌ Wave 0 |
| AIMG-01 | `snapAspectRatio` returns nearest of 5 valid ratios | unit | `npx jest --testPathPattern="generate-image" -t "snapAspectRatio"` | ❌ Wave 0 |
| AIMG-04 | History entries added to store, thumbnails generated | unit | `npx jest --testPathPattern="promptCrafterStore"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="generate-image\|promptCrafter\|image-prompt" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/ai/__tests__/generate-image.test.ts` — covers AIMG-01 (`callGeminiImage`, `snapAspectRatio`), AIPC-02 (`enrichPrompt`), AIPC-04/05 (`assemblePrompt`)
- [ ] `src/lib/ai/__tests__/image-prompt.test.ts` — covers AIPC-03 (`buildEnrichmentSystemPrompt` includes frame context and brand colors)
- [ ] `src/stores/__tests__/promptCrafterStore.test.ts` — covers AIMG-04 (`addToHistory`, max 50 entries cap)

---

## Sources

### Primary (HIGH confidence)
- `https://ai.google.dev/gemini-api/docs/imagen` — Imagen 4 endpoint, request/response format, aspect ratios, sample count
- `https://ai.google.dev/gemini-api/docs/image-generation` — `gemini-2.5-flash-image` model ID, `responseModalities: ["IMAGE"]`, inline_data response format
- `https://ai.google.dev/gemini-api/docs/pricing` — Confirmed no free tier for any image generation model as of March 2026
- `src/lib/ai/generate-leaflet.ts` — `callGemini` implementation, native fetch pattern, 120s timeout, JSON response mode
- `src/lib/storage/imageDb.ts` — `storeImage/getImage/deleteImage` API, idb v8 pattern
- `src/components/editor/panels/sections/ImageSection.tsx` — `FabricImage.fromURL` + `insertAt/remove` frame replacement pattern
- `src/lib/ai/canvas-loader.ts` — `replaceImagePlaceholders` pattern for IndexedDB + Fabric placement

### Secondary (MEDIUM confidence)
- `https://dev.to/gde/generating-images-with-gemini-20-flash-from-google-448e` — Confirmed `responseModalities: ["IMAGE"]` request field; verified against official docs
- `https://www.aifreeapi.com/en/posts/free-gemini-flash-image-api` — Free tier confirmation crosschecked with official pricing page

### Tertiary (LOW confidence)
- Various third-party blogs re: Gemini 2.5 Flash Image free tier limits (conflicting numbers; defer to official pricing page)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; no new dependencies; verified from package.json
- Architecture: HIGH — patterns derived from existing codebase (generate-leaflet.ts, ImageSection.tsx, canvas-loader.ts) with verified API format
- Pitfalls: HIGH (frame loss, object URL leaks) / MEDIUM (free tier issue documented from official pricing) / HIGH (aspect ratio constraint from official docs)
- API format: HIGH — verified from official Gemini API docs for endpoint and responseModalities

**Research date:** 2026-03-29
**Valid until:** 2026-04-29 (stable — Gemini API v1beta endpoints are stable; image generation models may evolve but pattern is consistent)
