# Phase 1: Canvas Foundation - Research

**Researched:** 2026-03-27
**Domain:** Fabric.js 7 canvas editor in Next.js 15 — mm-based print design tool with snap guides, rulers, undo/redo, persistence, and dark-themed app shell
**Confidence:** HIGH (core stack verified via existing project research files + official docs; snap/ruler patterns MEDIUM via community sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Element Creation Flow
- Text frames: click-drag to define frame size (InDesign-style), then type inside the fixed-width frame
- Shapes (rect, circle, line): click-drag to define size from corner to corner
- Image frames: both paths — can draw empty placeholder frame (X pattern or gray) OR drag-drop files directly onto canvas
- Default appearance: brand-aware — use first brand color for shape fills, brand font for text if set; fall back to sensible defaults if no brand defined yet

#### Canvas Work Surface
- Pasteboard (area outside document): subtle checkerboard pattern (transparency-style)
- Document boundary: drop shadow on white page PLUS semi-transparent red-tinted overlay showing the 3mm bleed zone
- Margin guides: Claude's discretion on color (cyan or magenta are both fine)
- Grid overlay: Claude's discretion on style (dots vs lines)
- Rulers: yes, mm-based rulers along top and left edge that scroll with the canvas (InDesign/Illustrator-style)
- Default page background: white (#FFFFFF), changeable per page via Style panel (Phase 2)

#### Snap & Guide Behavior
- All snap targets active: element edges & centers, page center & edges, equal spacing (Figma-style smart guides), margin & bleed guides
- Snap threshold: Claude's discretion (industry standard ~5-8px is fine)
- Guide line color: Claude's discretion (magenta is industry standard)

#### Undo Granularity
- Drag operations: Claude's discretion (standard is one step per mousedown→mouseup)
- Property panel changes: debounced at 300ms — rapid slider/input changes group into one undo step
- Text editing: Claude's discretion (word-level grouping is standard)
- History stored as `toDatalessJSON()` snapshots (from research pitfalls — never store base64 in history)

### Claude's Discretion
- Grid overlay style (dots vs lines)
- Margin guide color
- Snap threshold distance
- Snap guide line color
- Drag undo granularity (one step per drag vs debounced)
- Text editing undo granularity (word-level vs pause-based)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CANV-01 | User can create a new document with mm-based dimensions (A4, A5, DL, bifold, trifold, custom) | mm↔px unit system at 72dpi; `lib/units.ts` with `mmToPx(mm, dpi)` function; canvas sized from format presets |
| CANV-02 | User can drag, resize, and rotate elements on canvas with selection handles | Fabric.js built-in: `preserveObjectStacking: true`, selection handles are native; `object:modified` event for history capture |
| CANV-03 | User can see snap guides when aligning elements to edges, centers, and other elements | `fabric-guideline-plugin` or `AligningGuidelines` from fabric master lib; drawn on `object:moving` event; 5-8px threshold |
| CANV-04 | User can zoom (fit, 50%, 100%, 200%, scroll-to-zoom) and pan the canvas | `canvas.zoomToPoint()` for wheel zoom; `viewportTransform` manipulation for pan; hand tool with alt-drag or H key |
| CANV-05 | User can see bleed guides (3mm) and configurable margin guides on canvas | Overlay HTML element (absolutely positioned) above canvas; bleed = red-tinted rect; margins = cyan/magenta lines |
| CANV-06 | User can see fold lines as dashed guides for bifold/trifold formats | Same overlay mechanism as CANV-05; dashed CSS border or SVG line at calculated fold positions |
| CANV-07 | User can undo/redo at least 50 steps with Ctrl+Z / Ctrl+Shift+Z | Custom history with `toDatalessJSON()` snapshots; cap at 50; `historyProcessing` guard flag; zundo as alternative |
| CANV-08 | User can copy/paste elements with Ctrl+C / Ctrl+V | Clipboard in Zustand store; `canvas.getActiveObject().toObject()` for copy; re-add with offset for paste |
| CANV-09 | User can delete elements with Delete key, nudge with arrow keys (1px, Shift+10px) | `canvas.remove(activeObject)` on Delete; `object.set({ left: left ± n })` + `renderAll()` on arrow keys |
| CANV-10 | User can right-click elements for context menu (bring forward, send back, duplicate, delete, lock) | `fireRightClick: true` (default in Fabric.js 7); `canvas.on('mouse:down')` check `e.button === 2`; `bringForward/sendBackwards` API |
| ELEM-01 | User can create text frames and edit text inline (double-click to edit) | `fabric.Textbox` with fixed width from drag; `enterEditing()` on `mouse:dblclick`; IText editing mode |
| ELEM-02 | User can create image frames and drop/upload images with fit modes (fill, fit, stretch) | Custom `ImageFrame` rect with placeholder; `FabricImage.fromURL()` with `crossOrigin: 'anonymous'`; fit modes via `scaleX/scaleY` calculation |
| ELEM-03 | User can create shapes (rectangle, circle, line) with rounded corners option | `fabric.Rect` (rx/ry for corners), `fabric.Ellipse`, `fabric.Line`; click-drag creation via `mouse:down`/`mouse:move` |
| ELEM-04 | User can create solid or gradient color blocks | `fabric.Rect` with `fill: color` or `fill: new fabric.Gradient(...)` |
| ELEM-05 | User can group and ungroup elements | `canvas.getActiveObjects()` + `new fabric.Group(objects)`; `group.toActiveSelection()` for ungroup |
| PERS-01 | Project auto-saves to localStorage every 30 seconds | `useAutoSave` hook with `setInterval`; `canvas.toJSON()` + merge with project metadata; wrapped in try/catch for QuotaExceededError |
| PERS-02 | Project list persists in localStorage | `projectStore` Zustand slice with `localStorage.setItem('projects', JSON.stringify(list))` |
| PERS-03 | Generated images stored in IndexedDB (not localStorage) to avoid 5MB limit | `idb` library v8 for async IndexedDB access; image blobs keyed by UUID; UUID referenced in canvas JSON |
| EXPO-03 | User can save project as JSON file and load it back | `canvas.toJSON()` → `JSON.stringify` → Blob → anchor download; load: file input → `canvas.loadFromJSON()` |
| UXSH-01 | App has dark theme editor UI matching the design system in CLAUDE.md | Tailwind CSS 4 with `@custom-variant dark`; design tokens from CLAUDE.md (#0a0a0a bg, #6366f1 accent) |
| UXSH-02 | Header shows project name, save button, undo/redo buttons, export button | React component reading from `projectStore` and `historyStore`; no canvas dependency |
| UXSH-03 | Bottom bar shows zoom slider, page indicator, and grid toggle | React component reading `canvasStore.zoom`; grid toggle writes to `editorStore.showGrid` |
| UXSH-04 | All panels are collapsible with smooth animation | `motion` (framer-motion) for height/width animation; `AnimatePresence` for mount/unmount |
| UXSH-05 | Toast notifications for save, export, and errors (bottom-right) | `react-hot-toast` or custom toast component; Zustand `toastStore` or direct imperative calls |
| UXSH-06 | Keyboard shortcuts overlay shown with ? key | Modal component; `useKeyboardShortcuts` hook intercepts `?` key; renders shortcut table |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire foundation that all subsequent phases build on. The domain is a Fabric.js 7 interactive canvas embedded as a client-only island inside a Next.js 15 App Router shell. Because this project is greenfield, Phase 1 must simultaneously establish: the project scaffolding, the mm-based coordinate system, the Fabric.js canvas lifecycle, all five element types, undo/redo history, auto-save persistence, JSON export/import, snap guides, rulers, the dark UI shell, keyboard shortcuts, and toast notifications. This is the largest phase scope-wise; every architectural decision here (sync contract, serialization format, coordinate system, history strategy) is load-bearing for all later phases.

The primary complexity concentrates in three areas: (1) the Fabric.js/React boundary — canvas is imperative and must live in a `'use client'` dynamic import while React panels read only Zustand snapshots; (2) the mm-to-pixel coordinate system — every object must store its geometry in mm (or be trivially convertible) so the export pipeline works correctly in later phases; (3) the history system — `toDatalessJSON()` must be established from the first commit, never `toJSON()`, because retrofitting is expensive.

Two critical architecture choices from the existing research must be locked in before any code: the single-canvas-instance model (never create a new Canvas per page) and the IndexedDB image store (never embed base64 in localStorage). Both are recoverable but expensive to fix if skipped.

**Primary recommendation:** Build in this strict sequence — project scaffold → unit system → canvas shell → element factory → history → persistence → UI shell — because each layer depends on the one below it. Snap guides and rulers are overlays and can be built in parallel with element creation.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | React framework, routing, API routes | Project constraint; App Router for server components; `dynamic({ ssr: false })` for Fabric.js |
| TypeScript | 5.8+ | Type safety | Current stable; Fabric.js 7 ships its own `.d.ts` — no `@types/fabric` needed |
| React | 18.x | UI runtime | Next.js 15 peer dependency |
| Tailwind CSS | 4.x | Utility CSS | Dark mode via `@custom-variant dark` in CSS; CSS-first config |
| Fabric.js | 7.x (7.2.0) | Canvas object model | Project mandate; v7 is TypeScript-native with named imports |
| Zustand | 5.x (5.0.12) | Client state | Split stores by concern; `useSyncExternalStore` concurrent-safe |
| motion | 12.x (12.38.0) | Panel animations | Import from `motion/react`; for UXSH-04 collapsible panels only |
| zundo | 2.x (2.3.0) | Undo/redo middleware | Verified Zustand 5 compatible; <700B; alternative to manual history stack |
| idb | 8.x (8.0.3) | IndexedDB for image blobs | PERS-03 requires IndexedDB; `idb` wraps raw API in promises |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| immer | 10.x | Immutable Zustand updates | Zustand `immer` middleware for deeply nested state |
| fabric-guideline-plugin | latest | Snap alignment guides | CANV-03 snap behavior; wraps canvas with `AlignGuidelines` class |
| react-hot-toast | 2.x | Toast notifications | UXSH-05; simpler than building custom toast system in Phase 1 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fabric-guideline-plugin` | Manual `object:moving` guide drawing | Manual gives more control over bleed/margin snap targets; plugin is faster to ship; recommend plugin for Phase 1, replace in Phase 2 if needed |
| `react-hot-toast` | Custom Zustand toastStore | Custom is zero-dependency but ~150 lines of boilerplate; `react-hot-toast` is 4KB and battle-tested |
| `idb` | Raw IndexedDB API | Raw API is verbose and error-prone; `idb` adds <5KB with a clean promise interface |
| zundo temporal middleware | Custom history array in Zustand | Custom array works and avoids a dependency; zundo handles coalescing and debounce correctly; choose based on zundo peer dep verification at install time (fallback confirmed in STATE.md) |

**Installation:**
```bash
# Core (project likely already has Next.js/React/TypeScript/Tailwind from scaffold)
npm install fabric zustand motion zundo idb immer

# Supporting
npm install fabric-guideline-plugin react-hot-toast

# Dev (no @types/fabric — Fabric.js 7 ships its own types)
npm install -D @types/react @types/react-dom @types/node
```

**Version verification:**
```bash
npm view fabric version           # expect 7.x
npm view zustand version          # expect 5.x
npm view zundo version            # expect 2.3.0
npm view idb version              # expect 8.0.3
npm view motion version           # expect 12.x
npm view fabric-guideline-plugin version
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Dashboard stub (Phase 4 detail)
│   └── editor/
│       └── [projectId]/
│           └── page.tsx               # Editor shell — 'use client', lazy canvas
├── components/
│   ├── editor/
│   │   ├── EditorLayout.tsx           # Three-panel shell + header + bottom bar
│   │   ├── CanvasArea.tsx             # Canvas + guides overlay + rulers
│   │   ├── EditorCanvas.client.tsx    # 'use client' wrapper, dynamic({ ssr: false })
│   │   ├── EditorCanvasInner.tsx      # Actual Fabric.js mount point
│   │   ├── GuidesOverlay.tsx          # Bleed/margin/fold lines (HTML/SVG, not canvas)
│   │   ├── RulerH.tsx                 # Horizontal ruler (scrolls with canvas pan)
│   │   ├── RulerV.tsx                 # Vertical ruler
│   │   ├── panels/
│   │   │   ├── ToolBar.tsx            # Left: tool selection (Select/Text/Rect/Circle/Line/Image/Hand)
│   │   │   ├── PropertiesPanel.tsx    # Right: position/size/opacity stubs (Phase 2 fills these out)
│   │   │   └── ContextMenu.tsx        # Right-click context menu
│   │   └── ui/
│   │       ├── Header.tsx             # Project name, save, undo/redo, export
│   │       ├── BottomBar.tsx          # Zoom slider, page indicator, grid toggle
│   │       └── KeyboardShortcutsModal.tsx
│   └── ui/                            # Generic primitives (Button, Toast wrapper)
├── hooks/
│   ├── useFabricCanvas.ts             # Canvas instance lifecycle, event binding
│   ├── useHistory.ts                  # Undo/redo with toDatalessJSON snapshots
│   ├── useElementCreation.ts          # Click-drag creation flow per tool type
│   ├── useKeyboardShortcuts.ts        # Global keyboard handler
│   ├── useAutoSave.ts                 # 30s interval + dirty flag
│   └── useCanvasZoomPan.ts            # Zoom/pan: zoomToPoint, absolutePan
├── stores/
│   ├── canvasStore.ts                 # selection, activeTool, zoom, historyState
│   ├── editorStore.ts                 # panelOpen flags, showGrid, showRulers
│   ├── projectStore.ts                # projects list, active project, pages, auto-save
│   └── brandStore.ts                  # brandColors[], typographyPresets[] (Phase 2 fills)
├── lib/
│   ├── fabric/
│   │   ├── canvas-config.ts           # Default Canvas options, format presets (A4/A5/DL/etc)
│   │   ├── element-factory.ts         # createElement(type, opts) → FabricObject
│   │   ├── serialization.ts           # toDatalessJSON wrapper, loadFromJSON, JSON export/import
│   │   └── guides.ts                  # Bleed/margin position calculations (mm → px)
│   ├── storage/
│   │   ├── imageDb.ts                 # idb wrapper: storeImage(blob) → uuid, getImage(uuid) → blob
│   │   └── projectStorage.ts          # localStorage CRUD with QuotaExceededError handling
│   └── units.ts                       # mmToPx(mm, dpi), pxToMm(px, dpi), format presets
├── types/
│   ├── project.ts                     # Project, Page, LeafletFormat types
│   ├── elements.ts                    # TextFrame, ImageFrame, Shape, ColorBlock types
│   └── brand.ts                       # ColorSwatch, TypographyPreset (stubs for Phase 2)
└── constants/
    ├── formats.ts                     # A4/A5/DL/bifold/trifold dimensions in mm
    └── shortcuts.ts                   # Keyboard shortcut definitions for overlay modal
```

---

### Pattern 1: SSR Boundary — Fabric.js in Next.js 15

**What:** Fabric.js accesses `window`/`document` at module load time, crashing Next.js SSR. The solution is a two-file wrapper pattern: a thin `'use client'` shell that uses `dynamic({ ssr: false })` wrapping the actual canvas component.

**When to use:** Always — the first Fabric.js file created must follow this pattern.

**Example:**
```typescript
// components/editor/EditorCanvas.client.tsx
'use client';
import dynamic from 'next/dynamic';

const EditorCanvasInner = dynamic(
  () => import('./EditorCanvasInner'),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#0a0a0a]" /> }
);

export default EditorCanvasInner;
```

```typescript
// next.config.ts — prevent Webpack bundling node canvas binding
const nextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};
```

**Why:** In Next.js 15 App Router, `dynamic({ ssr: false })` can only be called inside a `'use client'` file. Calling it from a Server Component is a build error. Source: [Fabric.js issue #8444](https://github.com/fabricjs/fabric.js/issues/8444), [Next.js lazy loading docs](https://nextjs.org/docs/app/guides/lazy-loading).

---

### Pattern 2: Canvas as Imperative Island — useFabricCanvas Hook

**What:** The Fabric.js canvas instance lives in a `useRef`. React never renders into the canvas DOM element. Events flow outward from Fabric to Zustand via bridge callbacks; commands flow inward via hook-exposed functions. Panels read only from Zustand snapshots, never from the canvas directly.

**When to use:** Always — this is the foundational sync contract.

**Example:**
```typescript
// hooks/useFabricCanvas.ts
import { useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';

export function useFabricCanvas(canvasEl: HTMLCanvasElement | null) {
  const canvasRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!canvasEl) return;
    const canvas = new Canvas(canvasEl, {
      preserveObjectStacking: true,
      fireRightClick: true,      // Fabric.js 7 default; needed for context menu (CANV-10)
      stopContextMenu: true,     // Prevent browser context menu
    });
    canvasRef.current = canvas;

    // Bridge: Fabric events → Zustand
    const onSelectionCreated = (e: fabric.TEvent) => {
      useCanvasStore.getState().setSelection(e.selected ?? []);
    };
    canvas.on('selection:created', onSelectionCreated);
    canvas.on('selection:updated', onSelectionCreated);
    canvas.on('selection:cleared', () => {
      useCanvasStore.getState().setSelection([]);
    });

    return () => {
      canvas.off('selection:created', onSelectionCreated);
      canvas.off('selection:updated', onSelectionCreated);
      canvas.dispose();
    };
  }, [canvasEl]);

  return canvasRef;
}
```

**Critical:** Always return cleanup in `useEffect` — React Strict Mode double-invokes effects. Without cleanup, event listeners stack up and history records duplicate entries.

---

### Pattern 3: mm-Based Coordinate System

**What:** The canonical unit throughout the codebase is millimeters. Pixels are only computed at render time (screen: 72dpi) or export time (150/300dpi). All Fabric.js object geometry is set in px derived from mm, but the source of truth for project state (positions, sizes) is mm.

**When to use:** Every size/position value stored in project JSON or displayed in the UI must be in mm.

**Example:**
```typescript
// lib/units.ts
const SCREEN_DPI = 72;

export const mmToPx = (mm: number, dpi = SCREEN_DPI): number =>
  (mm * dpi) / 25.4;

export const pxToMm = (px: number, dpi = SCREEN_DPI): number =>
  (px * 25.4) / dpi;

// Format presets
export const FORMATS = {
  A4:      { widthMm: 210,  heightMm: 297,  bleedMm: 3 },
  A5:      { widthMm: 148,  heightMm: 210,  bleedMm: 3 },
  DL:      { widthMm: 99,   heightMm: 210,  bleedMm: 3 },
  bifold:  { widthMm: 420,  heightMm: 297,  bleedMm: 3, pages: 2 },
  trifold: { widthMm: 630,  heightMm: 297,  bleedMm: 3, pages: 3 },
} as const;

// Verification: mmToPx(210, 300) === 2480 (A4 height at 300dpi)
// (210 * 300) / 25.4 = 2480.31... ≈ 2480 ✓
```

---

### Pattern 4: Click-Drag Element Creation (InDesign-Style)

**What:** When a creation tool is active, `mouse:down` records the start point, `mouse:move` previews the object being sized, and `mouse:up` commits the final object. Fabric.js selection is disabled during creation mode.

**When to use:** All element types except group (ELEM-01 through ELEM-04).

**Critical Fabric.js 7 note:** `originX` and `originY` now default to `'center'` in v7. For InDesign-style creation (top-left anchor), you must explicitly set `originX: 'left', originY: 'top'` on all created objects, or use `positionByLeftTop(point)` method.

**Example:**
```typescript
// hooks/useElementCreation.ts
import { Canvas, Rect, Point } from 'fabric';

export function useRectCreation(canvas: Canvas) {
  let isCreating = false;
  let startPoint: Point | null = null;
  let previewRect: Rect | null = null;

  canvas.on('mouse:down', (opt) => {
    if (canvas.getActiveObject()) return; // Don't create over existing selection
    isCreating = true;
    startPoint = canvas.getScenePoint(opt.e);  // Fabric.js 7: getScenePoint replaces getPointer
    previewRect = new Rect({
      left: startPoint.x,
      top: startPoint.y,
      width: 0,
      height: 0,
      originX: 'left',
      originY: 'top',
      fill: 'rgba(99,102,241,0.2)',
      stroke: '#6366f1',
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });
    canvas.add(previewRect);
  });

  canvas.on('mouse:move', (opt) => {
    if (!isCreating || !startPoint || !previewRect) return;
    const current = canvas.getScenePoint(opt.e);
    const width = Math.abs(current.x - startPoint.x);
    const height = Math.abs(current.y - startPoint.y);
    const left = Math.min(current.x, startPoint.x);
    const top = Math.min(current.y, startPoint.y);
    previewRect.set({ left, top, width, height });
    canvas.renderAll();
  });

  canvas.on('mouse:up', (opt) => {
    if (!isCreating || !startPoint || !previewRect) return;
    isCreating = false;
    const current = canvas.getScenePoint(opt.e);
    const width = Math.abs(current.x - startPoint.x);
    const height = Math.abs(current.y - startPoint.y);
    if (width < 5 || height < 5) {
      // Too small — remove preview and abort
      canvas.remove(previewRect);
    } else {
      // Commit as a real selectable object
      previewRect.set({ selectable: true, evented: true });
      canvas.setActiveObject(previewRect);
    }
    canvas.renderAll();
    previewRect = null;
    startPoint = null;
  });
}
```

**API change in Fabric.js 7:** `canvas.getPointer()` is removed. Use `canvas.getScenePoint(e)` (scene/document coordinates) or `canvas.getViewportPoint(e)` (screen coordinates). For element creation, use `getScenePoint`.

---

### Pattern 5: Stack-Based Undo/Redo with toDatalessJSON

**What:** Two arrays (`historyUndo`, `historyRedo`) hold serialized canvas snapshots. A `historyProcessing` boolean prevents recursive event capture during restore. Snapshots are captured only on `mouse:up` (not `object:moving`) and debounced for property panel changes.

**When to use:** The `toDatalessJSON()` call must be established before any other code touches persistence — this is a locked decision from CONTEXT.md.

**Example:**
```typescript
// hooks/useHistory.ts
import { useRef, useCallback } from 'react';
import { Canvas } from 'fabric';

export function useHistory(canvas: Canvas | null, maxSteps = 50) {
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const currentState = useRef<string>('');
  const isProcessing = useRef(false);

  const captureState = useCallback(() => {
    if (!canvas || isProcessing.current) return;
    const snapshot = JSON.stringify(canvas.toDatalessJSON([
      'customType', 'imageId', 'locked', 'name',
    ]));
    undoStack.current.push(currentState.current);
    if (undoStack.current.length > maxSteps) undoStack.current.shift();
    redoStack.current = [];
    currentState.current = snapshot;
  }, [canvas, maxSteps]);

  const undo = useCallback(() => {
    if (!canvas || !undoStack.current.length) return;
    isProcessing.current = true;
    redoStack.current.push(currentState.current);
    currentState.current = undoStack.current.pop()!;
    canvas.loadFromJSON(JSON.parse(currentState.current)).then(() => {
      canvas.renderAll();
      isProcessing.current = false;
    });
  }, [canvas]);

  const redo = useCallback(() => {
    if (!canvas || !redoStack.current.length) return;
    isProcessing.current = true;
    undoStack.current.push(currentState.current);
    currentState.current = redoStack.current.pop()!;
    canvas.loadFromJSON(JSON.parse(currentState.current)).then(() => {
      canvas.renderAll();
      isProcessing.current = false;
    });
  }, [canvas]);

  // Bind to canvas — call in useFabricCanvas after canvas is created
  const bindHistory = useCallback(() => {
    if (!canvas) return;
    // Initialize first state
    currentState.current = JSON.stringify(canvas.toDatalessJSON());
    // Capture on committed actions only (not during drag)
    canvas.on('mouse:up', captureState);
    canvas.on('object:added', captureState);
    canvas.on('object:removed', captureState);
  }, [canvas, captureState]);

  return { undo, redo, bindHistory,
           canUndo: undoStack.current.length > 0,
           canRedo: redoStack.current.length > 0 };
}
```

**Fabric.js 7 note:** `canvas.loadFromJSON()` is now async and returns a Promise. Always `await` it or use `.then()` before calling `renderAll()`.

---

### Pattern 6: Snap Alignment Guides

**What:** The `fabric-guideline-plugin` wraps the Fabric.js canvas with an `AlignGuidelines` class that draws magenta snap guides on `object:moving` and snaps objects to edges/centers of other objects and the canvas. For margin/bleed guide snapping (not covered by the plugin), custom `object:moving` handlers add additional snap targets.

**When to use:** CANV-03 snap behavior.

**Example:**
```typescript
// In useFabricCanvas.ts after canvas creation:
import { AlignGuidelines } from 'fabric-guideline-plugin';

const guideline = new AlignGuidelines({
  canvas: canvas,
  aligningOptions: {
    lineColor: '#FF00FF',  // Magenta — industry standard
    lineWidth: 1,
    lineMargin: 6,         // 6px snap threshold (within 5-8px discretion range)
  },
});
guideline.init();
```

**Custom snap to bleed/margin guides (additional handler):**
```typescript
const SNAP_THRESHOLD = 6; // px

canvas.on('object:moving', (e) => {
  const obj = e.target;
  if (!obj) return;
  const docLeft = documentOffsetX;   // canvas left edge position in scene coords
  const docRight = docLeft + documentWidthPx;
  const marginLeft = docLeft + marginLeftPx;
  const marginRight = docRight - marginRightPx;

  const objLeft = obj.getBoundingRect().left;
  if (Math.abs(objLeft - marginLeft) < SNAP_THRESHOLD) {
    obj.set({ left: marginLeft + obj.getScaledWidth() * obj.originX });
  }
  // ... similar for all margin/bleed edges
});
```

---

### Pattern 7: Guides Overlay (Bleed / Margin / Fold Lines)

**What:** Bleed and margin guides are NOT drawn on the Fabric.js canvas — they are an absolutely positioned HTML/SVG overlay that sits above the canvas container. This avoids mixing guide artifacts into canvas exports and keeps serialization clean.

**When to use:** CANV-05 (bleed/margin) and CANV-06 (fold lines).

**Example:**
```typescript
// components/editor/GuidesOverlay.tsx
// Positioned absolutely over canvas, pointer-events: none
// Bleed zone: red-tinted semi-transparent rect showing 3mm bleed on all sides
// Margin guides: 1px cyan/magenta lines at margin positions
// Fold lines: dashed vertical/horizontal lines at fold positions

// Transform follows canvas viewport:
const style = {
  transform: `matrix(${viewportTransform.join(',')})`,
  transformOrigin: '0 0',
};
```

**Alternative for bleed overlay:** Use Fabric.js `overlayColor` or `overlayImage` with `overlayVpt: false` to fix the overlay to the viewport regardless of zoom. This is simpler but harder to make semi-transparent and shaped correctly.

---

### Pattern 8: Rulers

**What:** Mm-based rulers are React components (canvas or SVG elements) rendered alongside the Fabric.js canvas. They read the current `viewportTransform` from Zustand (updated on `canvas:zoom` / viewport change events) to calculate tick positions and labels.

**When to use:** UXSH rulers requirement in CONTEXT.md.

**Implementation approach:**
```typescript
// RulerH.tsx — horizontal ruler
// Draw tick marks in a <canvas> element
// Tick spacing: mmToPx(10, dpi) * zoom for major ticks (every 10mm)
// Labels: "10", "20", "30"... in mm
// Pan offset from viewportTransform[4] (X translation)
// Zoom from viewportTransform[0] (X scale)

function drawRuler(ctx: CanvasRenderingContext2D, opts: {
  width: number; zoom: number; panOffset: number;
}) {
  const { width, zoom, panOffset } = opts;
  const mmPerPx = 25.4 / (72 * zoom);
  const startMm = -panOffset * mmPerPx;
  // Draw major tick every 10mm, minor tick every 1mm (when zoomed in enough)
  // ...
}
```

---

### Pattern 9: IndexedDB Image Store

**What:** Generated images (Phase 3) and uploaded images are stored as Blobs in IndexedDB via `idb`. The canvas JSON stores only a UUID; the image hook resolves UUID → Blob URL on load.

**When to use:** PERS-03 — must be established in Phase 1 before images are placed on canvas.

**Example:**
```typescript
// lib/storage/imageDb.ts
import { openDB } from 'idb';

const DB_NAME = 'dessy-images';
const STORE_NAME = 'images';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

export async function storeImage(blob: Blob): Promise<string> {
  const id = crypto.randomUUID();
  const db = await dbPromise;
  await db.put(STORE_NAME, blob, id);
  return id;
}

export async function getImage(id: string): Promise<string | null> {
  const db = await dbPromise;
  const blob = await db.get(STORE_NAME, id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
}
```

---

### Pattern 10: Zoom and Pan

**What:** Mouse-wheel zoom uses `canvas.zoomToPoint()` centered on cursor. Pan uses `canvas.relativePan()` in Hand tool mode or Alt+drag in any mode. Both write to Zustand's `canvasStore.zoom` for the bottom bar slider.

**Example:**
```typescript
// hooks/useCanvasZoomPan.ts
canvas.on('mouse:wheel', (opt) => {
  const delta = opt.e.deltaY;
  let zoom = canvas.getZoom();
  zoom *= 0.999 ** delta;
  zoom = Math.min(Math.max(zoom, 0.1), 5); // 10% to 500%
  canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
  useCanvasStore.getState().setZoom(zoom);
  opt.e.preventDefault();
  opt.e.stopPropagation();
});

// Pan in hand tool mode
canvas.on('mouse:down', (opt) => {
  const isHandTool = useCanvasStore.getState().activeTool === 'hand';
  if (isHandTool || opt.e.altKey) {
    canvas.isDragging = true;
    canvas.selection = false;
    canvas.lastPosX = opt.e.clientX;
    canvas.lastPosY = opt.e.clientY;
  }
});

canvas.on('mouse:move', (opt) => {
  if (canvas.isDragging) {
    canvas.relativePan(new Point(
      opt.e.clientX - canvas.lastPosX,
      opt.e.clientY - canvas.lastPosY
    ));
    canvas.lastPosX = opt.e.clientX;
    canvas.lastPosY = opt.e.clientY;
  }
});

canvas.on('mouse:up', () => {
  canvas.isDragging = false;
  canvas.selection = true;
});
```

---

### Anti-Patterns to Avoid

- **Static Fabric.js import:** Never `import { Canvas } from 'fabric'` outside a `'use client'` dynamic import. SSR crash guaranteed.
- **`canvas.toJSON()` for history:** Always use `canvas.toDatalessJSON()`. Base64 images in history = memory explosion.
- **`canvas.getPointer()` in Fabric.js 7:** Removed. Use `canvas.getScenePoint(e)` instead.
- **New Canvas per page:** Single canvas instance, `canvas.clear()` + `canvas.loadFromJSON()` on page switch. Never `new Canvas()` per page.
- **Base64 images in localStorage:** Images go to IndexedDB. localStorage is for project JSON structure only.
- **`@types/fabric` installation:** Fabric.js 7 ships its own types. Installing `@types/fabric` causes type conflicts.
- **`dynamic({ ssr: false })` in a Server Component:** Must be in a `'use client'` file.
- **Fabric.js v5 import syntax:** `import { fabric } from 'fabric'` is v5 style. v6/v7 uses named imports: `import { Canvas, Rect, Textbox } from 'fabric'`.
- **Using `originX: 'center'` default in v7 for creation:** Fabric.js 7 changed default origin to `'center'`. For InDesign-style top-left creation, always explicitly set `originX: 'left', originY: 'top'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Snap alignment guides | Custom guide drawing system | `fabric-guideline-plugin` | Plugin handles zoom-level scaling, threshold adjustments, multi-object alignment; ~200 lines to replicate |
| IndexedDB async wrapper | Raw `indexedDB.open()` boilerplate | `idb` library | Error handling, version upgrades, transaction management are all tricky; `idb` is 5KB and battle-tested |
| Toast notifications | Custom Zustand toast store + component | `react-hot-toast` | Accessibility (aria-live), auto-dismiss, stacking, animation — all handled; 4KB |
| Undo/redo middleware | Manual array + debounce + coalescing logic | `zundo` temporal or proven manual pattern (see Pattern 5) | zundo handles history branching edge cases; if skipping zundo, use the exact pattern from Pattern 5, not a naive push/pop |
| Panel animations | CSS transitions manually | `motion/react` `AnimatePresence` | Height animation with unknown content size is notoriously hard with CSS alone; `motion` handles correctly |

**Key insight:** Every item in this table has at least one non-obvious edge case (zoom-aware snapping, IDB version migrations, toast accessibility, history branching, height animation). The ROI of building custom solutions from scratch in Phase 1 is negative.

---

## Common Pitfalls

### Pitfall 1: Fabric.js 7 `originX/originY` Default Changed to `'center'`
**What goes wrong:** Objects positioned at `(left: 0, top: 0)` will appear at `(-width/2, -height/2)` instead of top-left. Click-drag creation will place objects in wrong positions.
**Why it happens:** Fabric.js 7 changed the default from `'left'/'top'` to `'center'` (breaking change in v7 upgrade).
**How to avoid:** Always pass `originX: 'left', originY: 'top'` in all object constructors in `element-factory.ts`. Document this in a comment. Write a unit test that verifies a created Rect's rendered top-left corner matches the creation start point.
**Warning signs:** Objects created by click-drag appear offset by half their width/height.
**Source:** [Fabric.js v7 upgrade guide](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/) — HIGH confidence.

### Pitfall 2: `canvas.getPointer()` Removed in Fabric.js 7
**What goes wrong:** `canvas.getPointer(e)` is no longer available. Code using it (from tutorials, older examples) throws at runtime.
**Why it happens:** Fabric.js 7 consolidated pointer APIs. Old: `getPointer()`. New: `getScenePoint(e)` (document coords) and `getViewportPoint(e)` (screen coords).
**How to avoid:** Use `canvas.getScenePoint(opt.e)` for element creation coordinates. Use `canvas.getViewportPoint(opt.e)` for ruler cursor indicators.
**Source:** [Fabric.js v7 upgrade guide](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/) — HIGH confidence.

### Pitfall 3: `canvas.loadFromJSON()` is Async in Fabric.js 6+
**What goes wrong:** Code that calls `canvas.loadFromJSON(data, callback)` with a callback (v5 style) or ignores the returned Promise will render before objects are loaded.
**Why it happens:** Fabric.js 6+ made `loadFromJSON` return a Promise. Many examples and tutorials still show the callback form.
**How to avoid:** Always `await canvas.loadFromJSON(data)` then call `canvas.renderAll()`.

### Pitfall 4: Snap Guides at Wrong Positions After Zoom
**What goes wrong:** Snap guide lines appear at wrong canvas positions when zoomed in or out because the guide line coordinates are not adjusted for the viewport transform.
**Why it happens:** Fabric.js draws overlay lines in viewport coordinates; object positions are in scene coordinates. Without compensating for zoom, guides misalign.
**How to avoid:** Use `fabric-guideline-plugin` which handles this correctly. If implementing manually, always transform guide positions with `canvas.viewportTransform` before drawing.

### Pitfall 5: localStorage QuotaExceededError Swallowed Silently
**What goes wrong:** Auto-save stops working with no user-visible error. Data loss occurs.
**Why it happens:** `localStorage.setItem()` throws `QuotaExceededError` which is not caught, or is caught with a generic catch that doesn't surface it to the user.
**How to avoid:** Wrap every `localStorage.setItem()` in a try/catch that specifically handles `QuotaExceededError`. Show a toast notification: "Storage full — export your project to save your work."
**Source:** [PITFALLS.md Pitfall 10] — HIGH confidence.

### Pitfall 6: CORS Tainting Canvas on Image Load
**What goes wrong:** External image URLs loaded without `crossOrigin: 'anonymous'` taint the canvas. `canvas.toDataURL()` throws `SecurityError`. JSON export works but image export / PNG export silently produces a blank or throws.
**Why it happens:** Fabric.js `FabricImage.fromURL()` does not set `crossOrigin` by default. Problem is invisible in development (localhost is same-origin).
**How to avoid:** Always pass `{ crossOrigin: 'anonymous' }` to `FabricImage.fromURL()`. For Phase 1 uploaded images, create Object URLs from the user's file input — these are same-origin and don't need the attribute.
**Source:** [PITFALLS.md Pitfall 5] — HIGH confidence.

### Pitfall 7: Rulers Out of Sync During Rapid Pan
**What goes wrong:** Ruler tick marks lag behind canvas pan because the ruler re-renders are throttled by React's batching.
**Why it happens:** Canvas panning fires many events per second. If ruler state is managed in React state (`useState`), updates are batched and markers appear delayed.
**How to avoid:** Use `useRef` for the ruler canvas element and draw directly with `requestAnimationFrame` on each viewport change event, bypassing React rendering for the ruler draw loop.

---

## Code Examples

### Custom Properties in Fabric.js 7 Serialization
```typescript
// element-factory.ts — register custom properties for round-trip serialization
import { Rect } from 'fabric';

// In Fabric.js v6/v7, pass array of custom property names to toDatalessJSON
const snapshot = canvas.toDatalessJSON([
  'customType',  // 'text' | 'image' | 'shape' | 'colorBlock'
  'imageId',     // UUID referencing IndexedDB entry
  'locked',      // boolean — locked layer
  'name',        // layer display name
]);

// On object creation, set custom props:
const rect = new Rect({
  left: x, top: y, width: w, height: h,
  originX: 'left', originY: 'top',
});
rect.set('customType', 'shape');
rect.set('name', 'Rectangle');
rect.set('locked', false);
```

### Auto-Save with QuotaExceededError Handling
```typescript
// hooks/useAutoSave.ts
export function useAutoSave(canvas: Canvas | null, projectId: string) {
  useEffect(() => {
    if (!canvas) return;
    const interval = setInterval(() => {
      const json = JSON.stringify({
        canvas: canvas.toDatalessJSON(['customType', 'imageId', 'locked', 'name']),
        meta: useProjectStore.getState().getProjectMeta(projectId),
      });
      try {
        localStorage.setItem(`project-${projectId}`, json);
        useProjectStore.getState().setLastSaved(new Date());
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          // Toast: storage full
          toast.error('Storage full — export your project to avoid losing work');
        }
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [canvas, projectId]);
}
```

### Dark Theme Setup with Tailwind CSS 4
```css
/* app/globals.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --color-bg: #0a0a0a;
  --color-surface: #141414;
  --color-surface-raised: #1e1e1e;
  --color-border: #2a2a2a;
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #888888;
  --color-accent: #6366f1;
}
```

```typescript
// app/layout.tsx — apply dark class to html element
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
```

### JSON Export / Import (EXPO-03)
```typescript
// lib/fabric/serialization.ts
export function exportProjectJSON(canvas: Canvas, meta: ProjectMeta): void {
  const data = {
    version: '1.0',
    meta,
    canvas: canvas.toDatalessJSON(['customType', 'imageId', 'locked', 'name']),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${meta.name.replace(/\s+/g, '-')}.dessy.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProjectJSON(
  canvas: Canvas, file: File
): Promise<ProjectMeta> {
  const text = await file.text();
  const data = JSON.parse(text);
  await canvas.loadFromJSON(data.canvas);
  canvas.renderAll();
  return data.meta;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import { fabric } from 'fabric'` (v5 namespace) | Named imports: `import { Canvas, Rect } from 'fabric'` | Fabric.js v6 (2023) | Tree-shaking; cleaner types |
| `canvas.getPointer(e)` | `canvas.getScenePoint(e)` / `canvas.getViewportPoint(e)` | Fabric.js v7 (2024) | Existing tutorials are broken |
| `originX: 'left'` default | `originX: 'center'` default | Fabric.js v7 (2024) | All object positioning affected |
| `canvas.loadFromJSON(data, callback)` | `await canvas.loadFromJSON(data)` | Fabric.js v6 | Async; callback form deprecated |
| `tailwind.config.js` dark mode | `@custom-variant dark` in CSS | Tailwind CSS v4 (Jan 2025) | No JS config needed |
| `framer-motion` package name | `motion` package, import from `motion/react` | motion v12 (2025) | Package renamed; no breaking changes |

**Deprecated/outdated:**
- `fabric-history` npm package: Does not support Fabric.js v6+. Implement history manually (Pattern 5 above).
- `canvas.loadFromDatalessJSON()`: Merged into `loadFromJSON()` in newer versions. Only use `loadFromJSON()`.
- `@types/fabric`: Fabric.js 7 ships its own types. Installing causes conflicts.

---

## Open Questions

1. **zundo peer dep with Zustand 5**
   - What we know: Community reports both work; zundo v2.3.0 added explicit Zustand 5 support per STATE.md
   - What's unclear: Whether there are runtime issues with the `temporal` middleware under React 18 Strict Mode
   - Recommendation: Install and run `npm install zundo` at project init time; verify with a simple temporal store test before committing to it; fallback to the manual Pattern 5 history array if issues arise

2. **fabric-guideline-plugin Fabric.js 7 compatibility**
   - What we know: Plugin exists on npm and GitHub (caijinyc/fabric-guideline-plugin); documentation shows v6 compatibility
   - What's unclear: Whether it has been updated for Fabric.js 7's `getScenePoint` API change and `originX: 'center'` default
   - Recommendation: Check the plugin's GitHub issues for v7 reports at install time. If incompatible, implement snap guides manually using the approach from Discussion #10033 — it is ~80 lines of guide-drawing logic

3. **Ruler performance at 60fps during pan**
   - What we know: HTML canvas redraw of ruler ticks can be slow if triggered via React state updates
   - What's unclear: Whether direct `requestAnimationFrame` draw loop in ruler is necessary or if Zustand + React is fast enough
   - Recommendation: Start with Zustand-driven ruler (simpler); add RAF optimization only if jank is observed during testing

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library (standard for Next.js 15 projects) |
| Config file | `jest.config.ts` — Wave 0 gap |
| Quick run command | `npx jest --testPathPattern="units\|element-factory\|serialization" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CANV-01 | `mmToPx(210, 300) === 2480` (A4 height) | unit | `npx jest units.test -t "mmToPx"` | ❌ Wave 0 |
| CANV-01 | `FORMATS.A4.widthMm === 210` | unit | `npx jest units.test -t "FORMATS"` | ❌ Wave 0 |
| CANV-07 | Undo stack capped at 50 steps | unit | `npx jest useHistory.test -t "cap"` | ❌ Wave 0 |
| PERS-01 | QuotaExceededError shows toast, not crash | unit | `npx jest projectStorage.test -t "quota"` | ❌ Wave 0 |
| PERS-03 | `storeImage` → UUID → `getImage` → Blob URL | unit | `npx jest imageDb.test` | ❌ Wave 0 |
| EXPO-03 | Exported JSON re-imports without error | integration | `npx jest serialization.test` | ❌ Wave 0 |
| UXSH-06 | Shortcut constants cover all Phase 1 shortcuts | unit | `npx jest shortcuts.test` | ❌ Wave 0 |
| CANV-02 | `originX: 'left'` set on all created elements | unit | `npx jest element-factory.test -t "origin"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="units\|element-factory\|serialization" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/units.test.ts` — covers CANV-01 coordinate system
- [ ] `src/lib/__tests__/element-factory.test.ts` — covers CANV-02 origin default
- [ ] `src/lib/__tests__/serialization.test.ts` — covers EXPO-03 round-trip
- [ ] `src/lib/storage/__tests__/imageDb.test.ts` — covers PERS-03
- [ ] `src/lib/storage/__tests__/projectStorage.test.ts` — covers PERS-01 quota handling
- [ ] `src/hooks/__tests__/useHistory.test.ts` — covers CANV-07 50-step cap
- [ ] `src/constants/__tests__/shortcuts.test.ts` — covers UXSH-06
- [ ] `jest.config.ts` + `jest.setup.ts` — framework install: `npm install -D jest @types/jest jest-environment-jsdom ts-jest @testing-library/react @testing-library/jest-dom`

---

## Sources

### Primary (HIGH confidence)
- [Fabric.js v7 upgrade guide](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/) — breaking changes: originX default, getPointer removal, async loadFromJSON
- [Fabric.js Canvas API docs](https://fabricjs.com/api/classes/canvas/) — backgroundVpt, overlayVpt, zoomToPoint, events list
- [Fabric.js Introduction Part 5](https://fabricjs.com/docs/old-docs/fabric-intro-part-5/) — zoom/pan patterns: zoomToPoint, viewportTransform, relativePan
- [Fabric.js Introduction Part 3](https://fabricjs.com/docs/old-docs/fabric-intro-part-3/) — serialization patterns, toObject override, custom properties
- `.planning/research/STACK.md` — verified library versions (HIGH confidence, researched 2026-03-27)
- `.planning/research/ARCHITECTURE.md` — canvas-as-island pattern, Zustand sync contract (HIGH confidence)
- `.planning/research/PITFALLS.md` — toDatalessJSON requirement, CORS, localStorage limits, SSR patterns (HIGH confidence)
- `CLAUDE.md` — tech stack, design system colors, Zustand state shape, keyboard shortcuts

### Secondary (MEDIUM confidence)
- [fabric-guideline-plugin npm/GitHub](https://github.com/caijinyc/fabric-guideline-plugin) — AlignGuidelines usage pattern
- [Fabric.js Discussion #10033 — V6 Aligning Guidelines](https://github.com/fabricjs/fabric.js/discussions/10033) — AligningGuidelines class initialization
- [zundo GitHub](https://github.com/charkour/zundo) — v2.3.0 confirmed Zustand 5 compatible
- [idb npm](https://www.npmjs.com/package/idb) — v8.0.3 current, promise-based IndexedDB
- [Next.js 15 setup guide 2025](https://nextjs.org/docs/app/getting-started/installation) — create-next-app command with Tailwind/TypeScript
- [Fabric.js zoom/pan JSFiddle](https://jsfiddle.net/milanhlinak/7s4w0uLy/8/) — viewport transform pan example

### Tertiary (LOW confidence)
- [Rulers CodePen example](https://codepen.io/hugonoro/pen/ZeXwQy) — ruler tick drawing approach (unverified for Fabric.js 7)
- [SnappyRect HackerNoon article](https://hackernoon.com/mastering-object-snapping-in-fabricjs-introducing-the-snappyrect-class) — manual snap alternative to plugin

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified from existing project research (STACK.md, 2026-03-27), npm registry
- Architecture: HIGH — all patterns from official Fabric.js docs + existing ARCHITECTURE.md (verified against multiple sources)
- Pitfalls: HIGH — documented in PITFALLS.md from official sources; Fabric.js v7 API changes from upgrade guide
- Snap/ruler details: MEDIUM — no single authoritative source; community patterns cross-referenced against official Canvas API docs
- `fabric-guideline-plugin` v7 compatibility: LOW — needs verification at install time

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (Fabric.js ecosystem is stable; Tailwind CSS 4 is recent but now stable)
