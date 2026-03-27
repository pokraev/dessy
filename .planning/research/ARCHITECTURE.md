# Architecture Research

**Domain:** Browser-based print design tool (canvas editor + AI image generation + export pipeline)
**Researched:** 2026-03-27
**Confidence:** HIGH (patterns verified across multiple sources + official docs)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Next.js App Router (Client Shell)               │
├───────────────┬─────────────────────────────────────────┬───────────────┤
│  Left Panel   │             Canvas Area                  │  Right Panel  │
│               │                                          │               │
│  ┌──────────┐ │  ┌──────────────────────────────────┐   │ ┌───────────┐ │
│  │ToolBar   │ │  │     Fabric.js Canvas Instance    │   │ │Properties │ │
│  └──────────┘ │  │  (imperative, client-only)       │   │ │  Panel    │ │
│  ┌──────────┐ │  └──────────────────────────────────┘   │ └───────────┘ │
│  │  Layers  │ │  ┌──────────────────────────────────┐   │ ┌───────────┐ │
│  │  Panel   │ │  │  Guides Overlay (bleed/margins)  │   │ │Typography │ │
│  └──────────┘ │  └──────────────────────────────────┘   │ │  Panel    │ │
│  ┌──────────┐ │  ┌──────────────────────────────────┐   │ └───────────┘ │
│  │  Pages   │ │  │  Zoom/Pan Controls               │   │ ┌───────────┐ │
│  │Navigator │ │  └──────────────────────────────────┘   │ │AI/Style   │ │
│  └──────────┘ │                                          │ │  Panel    │ │
└───────────────┴─────────────────────────────────────────┴───────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────┐
         ▼                          ▼                       ▼
┌─────────────────┐     ┌────────────────────┐   ┌──────────────────────┐
│  Zustand Store  │     │   History Manager  │   │   Export Pipeline    │
│                 │     │  (undo/redo stacks)│   │                      │
│ - canvasStore   │     │  - historyUndo[]   │   │ - PDF (jsPDF)        │
│ - editorStore   │     │  - historyNextState│   │ - PNG/JPG (toDataURL)│
│ - projectStore  │     │  - redoStack[]     │   │ - InDesign (.jsx)    │
│ - brandStore    │     │  - processing flag │   │ - JSON (toJSON)      │
└─────────────────┘     └────────────────────┘   └──────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Next.js API Routes (Server-Side)                │
│                                                                          │
│  /api/ai/enrich-prompt   /api/ai/generate-image   /api/ai/variations    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              Gemini SDK (server-only, GEMINI_API_KEY)              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Persistence Layer                               │
│                                                                          │
│  localStorage (auto-save JSON every 30s)   localStorage (project list) │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| EditorPage | Top-level layout shell, panel arrangement, keyboard shortcut registration | Next.js Client Component, `dynamic(() => import('./Editor'), { ssr: false })` |
| CanvasManager | Owns the Fabric.js instance lifecycle, event binding, canvas ref | Custom hook `useFabricCanvas`, returns `canvas` and `canvasRef` |
| ToolBar (Left) | Tool mode selection (pointer, text, shape, image frame), page thumbnails, layers panel | React component consuming `editorStore.activeTool` |
| PropertiesPanel (Right) | Position/size/rotation/opacity/fill/border inputs that reflect selected object | React component reading `canvasStore.selection`, writes via canvas events |
| HistoryManager | Captures `object:added/modified/removed` events, maintains undo/redo stacks | Class or hook, uses `historyProcessing` flag to prevent event recursion |
| PromptCrafter | Multi-step UI: describe → enrich variations → customize → generate | Modal/panel component, calls `/api/ai/*` routes |
| ExportPipeline | Renders canvas at target DPI, adds bleed/crop marks, serializes to PDF/PNG/JSX | Utility module, triggered from menu, client-side only |
| ProjectStore | Manages project list, active project CRUD, auto-save to localStorage | Zustand store slice |
| BrandStore | Global color swatches (max 10), typography presets, palette state | Zustand store slice, persisted to localStorage |
| PageNavigator | Thumbnails of all pages, page add/remove/reorder | Reads from `projectStore.pages` array |

## Recommended Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Dashboard (Server Component)
│   ├── editor/
│   │   └── [projectId]/
│   │       └── page.tsx          # Editor shell (Client, lazy-loads canvas)
│   └── api/
│       └── ai/
│           ├── enrich-prompt/
│           │   └── route.ts      # POST: text → enriched prompt variations
│           ├── generate-image/
│           │   └── route.ts      # POST: prompt → base64 image
│           └── variations/
│               └── route.ts      # POST: prompt → 3 variation prompts
├── components/
│   ├── dashboard/
│   │   ├── ProjectGrid.tsx
│   │   ├── FormatPicker.tsx
│   │   └── TemplateGallery.tsx
│   ├── editor/
│   │   ├── EditorLayout.tsx      # Three-panel shell (resizable-panels)
│   │   ├── CanvasArea.tsx        # Hosts canvas + guides overlay
│   │   ├── panels/
│   │   │   ├── ToolBar.tsx
│   │   │   ├── LayersPanel.tsx
│   │   │   ├── PageNavigator.tsx
│   │   │   ├── PropertiesPanel.tsx
│   │   │   ├── TypographyPanel.tsx
│   │   │   └── StylePanel.tsx
│   │   ├── ai/
│   │   │   ├── PromptCrafter.tsx
│   │   │   └── ImageHistory.tsx
│   │   └── modals/
│   │       └── ExportModal.tsx
│   └── ui/                       # Generic UI primitives (shadcn pattern)
├── hooks/
│   ├── useFabricCanvas.ts        # Canvas instance lifecycle
│   ├── useHistory.ts             # Undo/redo manager
│   ├── useKeyboardShortcuts.ts
│   ├── useCanvasSelection.ts     # Selection state sync
│   └── useAutoSave.ts
├── stores/
│   ├── canvasStore.ts            # Selected object, active tool, zoom
│   ├── editorStore.ts            # UI state (open panels, modal visibility)
│   ├── projectStore.ts           # Projects, pages, auto-save
│   └── brandStore.ts             # Colors, typography presets
├── lib/
│   ├── fabric/
│   │   ├── canvas-config.ts      # Default canvas options, mm→px helpers
│   │   ├── element-factory.ts    # createElement(type, props) → FabricObject
│   │   ├── serialization.ts      # toJSON, fromJSON, template serialization
│   │   └── guides.ts             # Bleed/margin/fold guide drawing
│   ├── export/
│   │   ├── pdf.ts                # jsPDF export, DPI scaling, bleed/crop marks
│   │   ├── raster.ts             # PNG/JPG via canvas.toDataURL
│   │   └── indesign.ts           # ExtendScript .jsx generator
│   ├── ai/
│   │   └── gemini-client.ts      # Server-side Gemini SDK wrapper (API routes only)
│   └── units.ts                  # mm ↔ px conversion (72dpi baseline)
├── types/
│   ├── project.ts                # Project, Page, Layer types
│   ├── elements.ts               # TextFrame, ImageFrame, Shape etc.
│   └── brand.ts                  # ColorSwatch, TypographyPreset types
└── templates/
    └── starter/                  # JSON template files (Sale, Event, etc.)
```

### Structure Rationale

- **`app/api/ai/`:** All Gemini calls live in API routes — keeps `GEMINI_API_KEY` server-side, never exposed to client bundle.
- **`hooks/`:** Canvas imperative logic extracted into hooks keeps React components declarative and testable.
- **`stores/`:** Split by concern (canvas state vs. UI state vs. project persistence vs. brand) — avoids one monolithic store that re-renders unrelated components on every edit.
- **`lib/fabric/`:** Isolated Fabric.js utilities that can be tested without a DOM/canvas; element-factory centralizes how objects are created with consistent defaults.
- **`lib/export/`:** Export pipeline is entirely separate from the canvas render path — it scales the canvas to target DPI in an offscreen context, preserving the on-screen canvas untouched.

## Architectural Patterns

### Pattern 1: Canvas as Imperative Island in a Declarative App

**What:** Fabric.js is an imperative library (direct mutation of canvas objects). React is declarative. The boundary is managed by treating the Fabric.js canvas instance as a "ref island" — React doesn't render into it, it only reads events out of it and dispatches commands into it via hooks.

**When to use:** Any time an imperative rendering library (Fabric.js, Three.js, D3) needs to coexist with React.

**Trade-offs:** Clean separation avoids React fighting Fabric for DOM control, but the canvas state is not in React's virtual DOM — the Zustand store becomes the bridge.

**Example:**
```typescript
// useFabricCanvas.ts
export function useFabricCanvas(canvasId: string) {
  const canvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasId, {
      selection: true,
      preserveObjectStacking: true,
    });
    canvasRef.current = canvas;

    // Bridge: Fabric events → Zustand store
    canvas.on('selection:created', (e) => {
      useCanvasStore.getState().setSelection(e.selected ?? []);
    });
    canvas.on('selection:cleared', () => {
      useCanvasStore.getState().setSelection([]);
    });

    return () => { canvas.dispose(); };
  }, [canvasId]);

  return canvasRef;
}
```

### Pattern 2: Zustand Store as Source of Truth for UI, Fabric.js as Source of Truth for Canvas

**What:** A split source-of-truth pattern. Fabric.js owns object positions, transforms, and rendering. Zustand owns UI state (which tool is active, which panel is open, what's selected, zoom level). The two stay in sync via event bridges in both directions — Fabric events update Zustand, and Zustand actions dispatch Fabric commands.

**When to use:** Always for this type of editor. Attempting to mirror all Fabric.js object state into React state causes performance problems at scale (every mouse-move firing React re-renders).

**Trade-offs:** Slightly more coordination code needed, but renders stay fast. Properties panel reads from Zustand's `selection` snapshot rather than querying Fabric directly on every render.

**Example:**
```typescript
// canvasStore.ts
interface CanvasStore {
  selection: FabricObjectSnapshot[];  // lightweight snapshot, not live Fabric objects
  activeTool: 'pointer' | 'text' | 'image' | 'shape';
  zoom: number;
  setSelection: (objects: fabric.Object[]) => void;
}

// PropertiesPanel.tsx reads from store snapshot
const { selection } = useCanvasStore();
// To update an object: dispatch via hook, not store directly
const { updateSelectedObjects } = useCanvasCommands();
```

### Pattern 3: Stack-Based Undo/Redo with Event Guard

**What:** History is maintained as two stacks of serialized canvas JSON snapshots (`historyUndo`, `historyRedo`). Fabric.js events (`object:added`, `object:modified`, `object:removed`) trigger snapshot saves. A `historyProcessing` boolean flag blocks new state captures during rollback to prevent infinite loops.

**When to use:** Any canvas editor with 50+ step undo requirement. The `fabric-history` npm package implements this pattern (MEDIUM confidence it still works with Fabric.js v6).

**Trade-offs:** Storing full JSON per step uses more memory than a diff-based approach, but is simpler to implement correctly. At 50-step limit with typical leaflet complexity, memory impact is acceptable (each snapshot ~50-100KB).

**Example:**
```typescript
// useHistory.ts
const historyUndo: string[] = [];
const historyRedo: string[] = [];
let historyNextState: string = '';
let historyProcessing = false;

canvas.on('object:modified', () => {
  if (historyProcessing) return;
  historyUndo.push(historyNextState);
  if (historyUndo.length > 50) historyUndo.shift();
  historyRedo.length = 0;
  historyNextState = JSON.stringify(canvas.toDatalessJSON());
});

function undo() {
  if (!historyUndo.length) return;
  historyProcessing = true;
  historyRedo.push(historyNextState);
  historyNextState = historyUndo.pop()!;
  canvas.loadFromJSON(historyNextState, () => {
    canvas.renderAll();
    historyProcessing = false;
  });
}
```

### Pattern 4: DPI Scaling for Print Export

**What:** The canvas renders at 72dpi (1mm = ~2.835px) for screen performance. On export, an offscreen canvas is created at the target DPI (72/150/300), the project JSON is loaded into it, and the higher-resolution raster is captured via `toDataURL`. Bleed area is added as extra pixels beyond the document boundary.

**When to use:** Every export operation. Never scale the live canvas — always use a separate offscreen canvas for export.

**Trade-offs:** Memory-intensive for 300dpi exports of large documents. For an A4 leaflet at 300dpi, the offscreen canvas is ~2480×3508px — well within browser canvas limits but worth noting.

**Example:**
```typescript
// lib/export/pdf.ts
const MM_TO_PX_300DPI = 300 / 25.4;  // ~11.81 px/mm

function exportToPDF(projectJSON: object, options: ExportOptions) {
  const offscreen = new fabric.StaticCanvas(null, {
    width: (options.widthMm + options.bleedMm * 2) * MM_TO_PX_300DPI,
    height: (options.heightMm + options.bleedMm * 2) * MM_TO_PX_300DPI,
  });
  offscreen.loadFromJSON(scaledJSON(projectJSON, MM_TO_PX_300DPI), () => {
    const dataUrl = offscreen.toDataURL({ format: 'png', multiplier: 1 });
    // Feed into jsPDF as image
    const pdf = new jsPDF({ unit: 'mm', format: [totalW, totalH] });
    pdf.addImage(dataUrl, 'PNG', 0, 0, totalW, totalH);
    pdf.save('leaflet.pdf');
  });
}
```

## Data Flow

### User Edits an Object on Canvas

```
User drags/resizes object on Fabric.js canvas
    ↓
Fabric.js fires object:modified event
    ↓
useHistory hook captures snapshot → historyUndo stack
    ↓
Canvas bridge in useFabricCanvas → useCanvasStore.setSelection(snapshot)
    ↓
PropertiesPanel re-renders with new position/size values
    ↓
User edits value in PropertiesPanel input field
    ↓
useCanvasCommands.updateProperty() called
    ↓
Fabric.js object mutated directly (canvas.getActiveObject().set(...))
    ↓
canvas.renderAll() → visual update
    ↓
object:modified fires again → history captured
```

### AI Image Generation Flow

```
User opens PromptCrafter modal
    ↓
User describes image → clicks "Enrich"
    ↓
POST /api/ai/enrich-prompt { description, brandColors, format }
    ↓
Server: Gemini gemini-2.5-flash → returns 3 enriched prompt variations
    ↓
Client: PromptCrafter shows 3 cards, user selects and customizes
    ↓
User clicks "Generate"
    ↓
POST /api/ai/generate-image { enrichedPrompt }
    ↓
Server: Gemini image generation → returns base64 PNG
    ↓
Client: image added to ImageHistory store, placed as FabricImage on canvas
    ↓
object:added fires → history captured
```

### Save/Load Project Flow

```
useAutoSave hook (30s interval + on-blur)
    ↓
canvas.toJSON() serializes Fabric state
    ↓
Merge with projectStore metadata (name, pages, brand colors)
    ↓
localStorage.setItem('project-{id}', JSON.stringify(projectJSON))
    ↓
On load: localStorage.getItem → canvas.loadFromJSON()
    ↓
canvas.renderAll() restores visual state
```

### Export Flow

```
User triggers Export (PDF/PNG/InDesign)
    ↓
ExportModal collects options (DPI, bleed, crop marks, format)
    ↓
canvas.toJSON() captures current state
    ↓
Export pipeline creates offscreen StaticCanvas at target DPI
    ↓
Scale transform applied to all object coordinates × (targetDPI / 72)
    ↓
For PDF: offscreen canvas → base64 PNG → jsPDF image insertion → .pdf download
For PNG: offscreen canvas.toDataURL() → anchor tag download
For InDesign: projectStore JSON → ExtendScript .jsx generator → .jsx download
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture is correct — localStorage, client-side export, no backend state |
| 1k-100k users | Add cloud storage (Supabase/PlanetScale) behind existing project CRUD, add auth, keep canvas client-side |
| 100k+ users | Offload InDesign/PDF generation to serverless function (canvas-heavy exports block main thread), add CDN for generated images |

### Scaling Priorities

1. **First bottleneck:** localStorage cap (~5MB). A single complex multi-page project with embedded images can hit this. Fix: move to IndexedDB (browser, larger quota) or cloud storage. Client-side PDF export stays as-is.
2. **Second bottleneck:** AI image generation latency. Gemini responses for images take 3-10 seconds. Fix: streaming progress indicator, optimistic UI showing placeholder. No architecture change needed.

## Anti-Patterns

### Anti-Pattern 1: Mirroring All Fabric.js State into React State

**What people do:** Use `useState` or Zustand to store full copies of every Fabric.js object (position, scale, color, etc.) and try to keep them in sync with the canvas on every event.

**Why it's wrong:** `object:moving` fires on every mousemove pixel. Updating React state on each event triggers cascading re-renders in all subscribed components, causing 60fps drag operations to drop to single digits.

**Do this instead:** Store only lightweight snapshots in Zustand (selected object IDs + their current property values for the Properties Panel). Let Fabric.js own the live object state. Read directly from `canvas.getActiveObject()` only when needed for export or save.

### Anti-Pattern 2: Using `useEffect` for Canvas Event Bindings Without Cleanup

**What people do:** Bind Fabric.js canvas events inside `useEffect` without returning a cleanup function that removes the listeners.

**Why it's wrong:** React's Strict Mode double-invokes effects in development. Without cleanup, event listeners stack up, causing history to record duplicate entries, selections to fire multiple times, and memory leaks.

**Do this instead:** Always return `canvas.off('event', handler)` in the `useEffect` cleanup. Better yet, encapsulate all binding in `useFabricCanvas` hook so it's done once and cleaned up once.

### Anti-Pattern 3: Importing Fabric.js as a Static Import in Next.js

**What people do:** `import { fabric } from 'fabric'` at the top of a component file in a Next.js App Router project.

**Why it's wrong:** Fabric.js accesses `window` and `document` at module load time. Next.js attempts to SSR all components — static import causes a crash during build with `ReferenceError: window is not defined`.

**Do this instead:** Use `dynamic(() => import('../components/editor/CanvasArea'), { ssr: false })` for the entire editor component, or use a dynamic import inside `useEffect`. The entire canvas editor page should be a client component with SSR disabled.

### Anti-Pattern 4: Blocking the Main Thread During Export

**What people do:** Trigger 300dpi PDF export synchronously on the main thread, causing the browser to freeze for several seconds while the high-resolution offscreen canvas renders.

**Why it's wrong:** No visual feedback, browser appears hung, users may close the tab.

**Do this instead:** Wrap export in a `setTimeout(..., 0)` to yield to the event loop, show a loading state immediately before triggering export, and consider Web Workers for particularly heavy exports (though Web Workers can't access the DOM canvas API directly — use OffscreenCanvas).

### Anti-Pattern 5: Storing Generated Images as Data URLs in Project JSON

**What people do:** When Gemini returns a base64 image, embed it directly in the project JSON that gets saved to localStorage.

**Why it's wrong:** A single generated image at 1024×1024px is ~1-3MB as base64 in JSON. A few images push the project JSON past the localStorage 5MB limit, silently dropping the save.

**Do this instead:** Store generated images in a separate `imageStore` using IndexedDB (or blob URLs in memory during session), referenced by ID in the project JSON. Only embed the image prompt metadata in the main JSON.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Gemini API (prompt enrichment) | POST `/api/ai/enrich-prompt` → server-side `@google/generative-ai` SDK | Model: `gemini-2.5-flash`, structured JSON output via response schema |
| Gemini API (image generation) | POST `/api/ai/generate-image` → same SDK, `responseModalities: ["Image"]` | Returns `inlineData.data` base64; strip `data:` prefix on server before sending to client |
| Google Fonts | Direct CSS `@import` via Next.js `next/font/google` or runtime URL load for dynamic selection | Runtime loading needed for the full Google Fonts catalog in font picker |
| jsPDF | Client-side only, imported dynamically | `import('jspdf')` inside export function, not at module level |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CanvasArea ↔ PropertiesPanel | Zustand `canvasStore.selection` (read) + `canvas.getActiveObject().set()` (write via hook) | Panel never holds a direct ref to the canvas — always goes through store or hook |
| PromptCrafter ↔ CanvasArea | `imageStore` Zustand slice: PromptCrafter writes generated image URL, CanvasArea reads to place on canvas | Decoupled via store, not direct component communication |
| EditorPage ↔ History | `useHistory` hook exposes `undo()`, `redo()`, `canUndo`, `canRedo` | Keyboard shortcut handler (Cmd+Z) calls hook directly |
| ExportPipeline ↔ Canvas | ExportPipeline calls `canvas.toJSON()` to get snapshot, then operates on a separate `StaticCanvas` — never mutates the live canvas | Critical isolation: export must not corrupt editor state |
| API Routes ↔ Client | JSON over HTTP. Client sends `{ prompt, brandColors, format }`, receives `{ variations: string[] }` or `{ imageBase64: string }` | No streaming for MVP; simple request/response |

## Build Order Implications

Based on dependencies between components, the recommended build sequence is:

1. **Unit system + canvas shell** (`lib/units.ts`, `useFabricCanvas`, `CanvasArea`) — everything else depends on a working canvas instance.
2. **Zustand stores** (`canvasStore`, `projectStore`) — panels need stores before they can read/write state.
3. **Element creation + basic tools** (`element-factory.ts`, `ToolBar`) — needed before history or properties make sense.
4. **History manager** (`useHistory`) — add after basic manipulation works, so undo/redo captures meaningful states.
5. **Panels** (`LayersPanel`, `PropertiesPanel`) — consume canvas events and store, can be built in parallel once stores are stable.
6. **Persistence** (`useAutoSave`, JSON save/load) — depends on stable serialization format from Fabric.js `toJSON`.
7. **Export pipeline** (`lib/export/pdf.ts`, `lib/export/raster.ts`) — depends on stable canvas state and unit system.
8. **AI integration** (API routes + `PromptCrafter`) — isolated behind API routes, can be built independently of canvas work.
9. **InDesign export** (`lib/export/indesign.ts`) — depends on stable element model, no canvas dependency.
10. **Template gallery + dashboard** — depends on project store and serialization format.

## Sources

- [Fabric.js Core Concepts](https://fabricjs.com/docs/core-concepts/) — HIGH confidence (official docs)
- [Managing Canvas Layers with Fabric.js and React](https://medium.com/@na.mazaheri/managing-canvas-layers-with-fabric-js-and-react-a-comprehensive-guide-e9c9cdd1e18a) — MEDIUM confidence (verified pattern)
- [Fabric.js History Operations (undo/redo)](https://alimozdemir.com/posts/fabric-js-history-operations-undo-redo-and-useful-tips) — HIGH confidence (verified implementation)
- [Gemini Image Editing Next.js Quickstart](https://github.com/google-gemini/gemini-image-editing-nextjs-quickstart) — HIGH confidence (official Google repo)
- [How to Build a Canvas-Based UI Like Figma](https://eleopardsolutions.com/develop-canvas-ui-like-figma/) — MEDIUM confidence (pattern overview)
- [Figma/Miro Style Canvas with React and TypeScript](https://www.freecodecamp.org/news/how-to-create-a-figma-miro-style-canvas-with-react-and-typescript/) — MEDIUM confidence (pattern overview)
- [High DPI Canvas — web.dev](https://web.dev/articles/canvas-hidipi) — HIGH confidence (official web platform article)
- [Fabric.js GitHub Issues — History v6](https://github.com/fabricjs/fabric.js/issues/10011) — MEDIUM confidence (community discussion, v6 history API in flux)

---
*Architecture research for: browser-based print design tool (Leaflet Factory)*
*Researched: 2026-03-27*
