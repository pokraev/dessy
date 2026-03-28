# Client-Side Gemini + Static Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the server-side API route, call Gemini directly from the browser using a user-provided API key stored in localStorage, and configure Next.js for static export (GitHub Pages compatible).

**Architecture:** The API route (`/api/generate-leaflet`) is replaced by a client-side `generateLeaflet()` function that calls the Gemini API directly. The user provides their Gemini API key through a settings UI; the key is stored in localStorage. The Anthropic provider and provider-factory abstraction are removed. Next.js is configured with `output: 'export'` for static hosting.

**Tech Stack:** Next.js (static export), Gemini REST API (browser fetch), localStorage

---

### Task 1: Create API Key Storage Module

**Files:**
- Create: `src/lib/storage/apiKeyStorage.ts`

- [ ] **Step 1: Create the API key storage module**

```ts
// src/lib/storage/apiKeyStorage.ts
const API_KEY_STORAGE_KEY = 'dessy-gemini-api-key';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/storage/apiKeyStorage.ts
git commit -m "feat: add Gemini API key localStorage storage"
```

---

### Task 2: Create Client-Side Generation Service

**Files:**
- Create: `src/lib/ai/generate-leaflet.ts`
- Read: `src/lib/ai/providers/gemini.ts` (reuse Gemini fetch logic)
- Read: `src/lib/ai/prompts/system-prompt.ts` (reuse prompt builders)
- Read: `src/lib/ai/schema-validator.ts` (reuse validation/repair)
- Read: `src/app/api/generate-leaflet/route.ts` (reuse orchestration logic)

- [ ] **Step 1: Create the client-side generation function**

This moves the orchestration logic from the API route into a client-callable function. It calls Gemini directly via browser `fetch`, reusing existing prompt builders and schema validators.

```ts
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
  imageBase64?: string
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
          maxOutputTokens: 8192,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return data.candidates[0]?.content?.parts[0]?.text ?? '';
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

  // Call Gemini
  let rawResponse: string;
  if (request.mode === 'prompt') {
    rawResponse = await callGemini(apiKey, systemPrompt, userPrompt);
  } else {
    rawResponse = await callGemini(apiKey, systemPrompt, userPrompt, request.imageBase64!);
  }

  // Parse JSON — with one retry on failure
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    const retryPrompt =
      'Your previous response was not valid JSON. Please respond with ONLY the JSON object, no markdown or explanation.';
    const retryResponse = request.mode === 'prompt'
      ? await callGemini(apiKey, systemPrompt, retryPrompt)
      : await callGemini(apiKey, systemPrompt, retryPrompt, request.imageBase64!);
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/generate-leaflet.ts
git commit -m "feat: add client-side Gemini generation service"
```

---

### Task 3: Add API Key Settings UI to GenerateLeafletModal

**Files:**
- Modify: `src/components/editor/modals/GenerateLeafletModal.tsx`

- [ ] **Step 1: Update GenerateLeafletModal to use client-side generation and prompt for API key**

Replace the `fetch('/api/generate-leaflet')` call with a direct call to `generateLeaflet()`. Add an inline API key input that shows when no key is stored. Import from the new modules.

Replace the existing imports and `handleGenerate` function:

```tsx
// Add these imports (at top of file, after existing imports)
import { getApiKey, setApiKey } from '@/lib/storage/apiKeyStorage';
import { generateLeaflet } from '@/lib/ai/generate-leaflet';
```

Inside the component, replace the state and `handleGenerate` with:

```tsx
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');

  // Load API key on mount
  useState(() => {
    const stored = getApiKey();
    setApiKeyState(stored);
    if (!stored) setShowKeyInput(true);
  });

  function handleSaveKey() {
    const trimmed = keyDraft.trim();
    if (trimmed) {
      setApiKey(trimmed);
      setApiKeyState(trimmed);
      setShowKeyInput(false);
    }
  }

  async function handleGenerate(data: { prompt?: string; imageBase64?: string }) {
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResponse(null);

    const brandState = useBrandStore.getState();

    try {
      const result = await generateLeaflet(apiKey, {
        mode: activeTab,
        foldType,
        prompt: data.prompt,
        imageBase64: data.imageBase64,
        brandColors: brandState.brandColors.map((c) => c.hex),
        typographyPresets: brandState.typographyPresets,
        style,
      });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  }
```

Add the API key input UI just before the tab content area (inside the `{/* Tab content OR preview */}` div), before `{showPreview ? (`:

```tsx
{showKeyInput && (
  <div style={{
    marginBottom: '12px',
    padding: '12px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
  }}>
    <label style={{ display: 'block', fontSize: '13px', color: '#ccc', marginBottom: '6px' }}>
      Gemini API Key
    </label>
    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="password"
        value={keyDraft}
        onChange={(e) => setKeyDraft(e.target.value)}
        placeholder="Enter your Gemini API key"
        onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
        style={{
          flex: 1,
          padding: '8px 10px',
          fontSize: '13px',
          background: '#0a0a0a',
          border: '1px solid #333',
          borderRadius: '6px',
          color: '#f5f5f5',
          outline: 'none',
        }}
      />
      <button
        type="button"
        onClick={handleSaveKey}
        style={{
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 500,
          background: '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Save
      </button>
    </div>
    <p style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
      Get a free key at{' '}
      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
        aistudio.google.com/apikey
      </a>
    </p>
  </div>
)}
```

Also add a small "change key" button in the modal header, next to the close button:

```tsx
{apiKey && !showKeyInput && (
  <button
    type="button"
    onClick={() => setShowKeyInput(true)}
    style={{
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#555',
      fontSize: '11px',
      padding: '4px 8px',
    }}
  >
    API Key
  </button>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/modals/GenerateLeafletModal.tsx
git commit -m "feat: use client-side Gemini generation with user-provided API key"
```

---

### Task 4: Delete Server-Side Code

**Files:**
- Delete: `src/app/api/generate-leaflet/route.ts`
- Delete: `src/lib/ai/providers/anthropic.ts`
- Delete: `src/lib/ai/providers/gemini.ts`
- Delete: `src/lib/ai/provider-factory.ts`
- Delete: `src/lib/ai/types.ts`

- [ ] **Step 1: Delete the API route and server-side provider files**

```bash
rm src/app/api/generate-leaflet/route.ts
rmdir src/app/api/generate-leaflet
rmdir src/app/api
rm src/lib/ai/providers/anthropic.ts
rm src/lib/ai/providers/gemini.ts
rmdir src/lib/ai/providers
rm src/lib/ai/provider-factory.ts
rm src/lib/ai/types.ts
```

- [ ] **Step 2: Commit**

```bash
git add -u
git commit -m "refactor: remove server-side API route and provider abstraction"
```

---

### Task 5: Configure Static Export

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add `output: 'export'` to next.config.ts**

Add the `output` property to enable static export:

```ts
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  turbopack: {
    // ... existing config
```

`images: { unoptimized: true }` is required because Next.js image optimization needs a server.

- [ ] **Step 2: Verify the build succeeds**

```bash
npm run build
```

Expected: Build completes with static HTML output in the `out/` directory.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: configure Next.js for static export (GitHub Pages)"
```

---

### Task 6: Clean Up .env References

**Files:**
- Delete: `.env.local` (if exists — contains server-side API keys no longer needed)
- Modify: `.gitignore` (verify `.env*` is still listed, no changes needed if so)

- [ ] **Step 1: Remove .env.local if it exists**

```bash
rm -f .env.local
```

- [ ] **Step 2: Verify build still works**

```bash
npm run build
```

- [ ] **Step 3: Commit (only if .env.local was tracked, which it shouldn't be)**

```bash
git add -u
git commit -m "chore: remove unused .env.local"
```
