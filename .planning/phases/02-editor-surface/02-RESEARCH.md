# Phase 02: Editor Surface - Research

**Researched:** 2026-03-28
**Domain:** Design editor UI — left panel (tools/layers/pages), right panel (properties/typography/style), color system
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Left panel: tabbed layout with 3 tabs (Tools | Layers | Pages), 280px width
- Tools tab: existing ToolBar content becomes tab content
- Layers tab: compact rows — type icon + name + drag handle + eye icon + lock icon
- Pages tab: mini canvas preview thumbnails, right-click for add/duplicate/delete, drag to reorder, "+ Add Page" button
- Layer click selects element on canvas AND auto-switches to Select tool
- Layer double-click to rename inline
- Properties panel: 320px, context-sensitive sections per element type
  - Text selected: Position, Typography, Fill
  - Shape selected: Position, Fill, Stroke, Shadow
  - Image selected: Position, Fit Mode
  - Color block selected: Position, Fill
  - Nothing selected: Page background, document format info, page dimensions
- Position/size: X/Y + W/H in mm, lock aspect ratio toggle, rotation degrees, opacity 0-100%
- Shadow: toggle on/off at section header, expands X/Y offset + blur + color
- Color picker: popover with react-colorful wheel, HEX/RGB/HSL inputs, brand swatches row, recently used colors row, eyedropper button — same popover component reused everywhere
- Brand swatches: live-linked by ID, max 10, editing updates all elements in real-time across all pages
- Swatch editor accessible from Style section (nothing selected)
- Google Fonts: searchable dropdown, fonts rendered in own typeface, ~20 popular pinned, all fonts scrollable below, load on-demand as user scrolls, type to filter
- Typography presets: 5 built-in (Headline, Subhead, Body, Caption, CTA), quick-apply buttons, editable, changes apply globally
- Multi-page: add/remove/duplicate/reorder pages; bifold/trifold auto-create correct page count; existing sessionStorage switching mechanism continues

### Claude's Discretion
- Predefined palettes location (color picker popover vs Style section)
- Palette generator algorithm and UI
- Recently used colors limit
- Font loading batch size and strategy
- Multi-selection property display (mixed values indicator)
- Border style options (solid, dashed, dotted)
- Gradient editor UI for color blocks
- Corner radius input pattern
- Eyedropper implementation approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAGE-01 | User can add, remove, and reorder pages | Pages tab with add/delete/drag-reorder; projectStore.pages CRUD |
| PAGE-02 | User can navigate between pages via thumbnail strip | Pages tab thumbnails + existing BottomBar navigator |
| PAGE-03 | User can duplicate a page | Pages tab right-click context menu; copy sessionStorage JSON to new page |
| PAGE-04 | Bifold/trifold formats auto-create correct page count | Format detection on project init; auto-create pages per LEAFLET_FORMATS constants |
| LPNL-01 | User can select tools via icon buttons | Tools tab wraps existing ToolBar component |
| LPNL-02 | User can see layer list with draggable reorder | @dnd-kit/sortable; Fabric.js canvas.moveTo() for z-index sync |
| LPNL-03 | User can toggle layer visibility and lock | Eye/lock icons call canvas object .set({visible/selectable}) + canvas.renderAll() |
| LPNL-04 | User can click layer to select on canvas, double-click to rename | canvas.setActiveObject(); inline contenteditable rename |
| LPNL-05 | User can see page thumbnails and click to navigate | triggerSwitchPage callback; StaticCanvas.toDataURL({multiplier:0.15}) for thumbnails |
| PROP-01 | User can edit position (X,Y mm), size (W,H mm), rotation | Read from canvas.getActiveObject(); write via obj.set() + setCoords() + renderAll(); pxToMm/mmToPx conversion |
| PROP-02 | User can adjust opacity and corner radius | obj.set({opacity, rx, ry}); opacity 0–1 stored, display 0–100% |
| PROP-03 | User can set border (color, width, style) and fill | obj.set({stroke, strokeWidth, strokeDashArray, fill}); gradient via Gradient class |
| PROP-04 | User can toggle shadow with offset, blur, color | obj.set({shadow: new Shadow({...})}) or obj.set({shadow: null}) |
| TYPO-01 | User can select font family from searchable dropdown with Google Fonts | Fonts API v1 list; FontFace API for on-demand load; clearFabricFontCache after load |
| TYPO-02 | User can set font weight, size, line height, letter spacing, color | obj.set({fontWeight, fontSize, lineHeight, charSpacing, fill}) |
| TYPO-03 | User can set text alignment and transform | obj.set({textAlign}); uppercase/lowercase/capitalize via JS text transform before set |
| TYPO-04 | User can apply typography presets | brandStore.typographyPresets; apply all preset props to selected Textbox |
| STYL-01 | User can define brand colors (up to 10 swatches) | brandStore.brandColors; ColorSwatch type already defined |
| STYL-02 | User can generate complementary palette from single color | HSL color math; generate triadic/complementary variants |
| STYL-03 | User can define and apply typography presets globally | brandStore.typographyPresets; iterate all canvas objects on all pages on preset change |
| STYL-04 | User can set background color per page | projectStore page.background; Fabric.js canvas.backgroundColor |
| COLR-01 | User can pick colors with react-colorful (HEX, RGB, HSL) | react-colorful 5.6.1; HexColorPicker + HexColorInput; RgbColor/HslColor variants |
| COLR-02 | User can use eyedropper to pick color from canvas | EyeDropper API (Chromium); use-eye-dropper hook as wrapper |
| COLR-03 | User can choose from 20+ predefined curated palettes | Static palette data; no dependency needed |
| COLR-04 | User can see recently used colors | Local state (or brandStore); 12-color ring buffer |
| COLR-05 | User can define global swatches that update everywhere | brandStore live-link pattern; swatchId stored as CUSTOM_PROP on objects; on swatch edit iterate all pages |
</phase_requirements>

---

## Summary

Phase 2 builds the entire editing surface UI on top of the Phase 1 canvas foundation. The work is primarily React component construction — no new architectural patterns are needed. The canvas integration points are all established: Fabric.js fires events that drive Zustand state, and the properties panel writes back through the canvas object model.

The three high-risk areas requiring careful design are: (1) **layer drag-reorder** must stay in sync with Fabric.js z-index (canvas.moveTo is the right API), (2) **Google Fonts on-demand loading** requires the CSS FontFace API pattern to avoid FOUT and broken bounding boxes in Fabric.js, and (3) **live-linked brand swatches** require storing a `swatchId` as a CUSTOM_PROP on canvas objects and iterating all pages when a swatch changes color. Page thumbnail generation is straightforward via `canvas.toDataURL({multiplier: 0.15})` but requires the canvas to be briefly loaded with that page's JSON.

**Primary recommendation:** Build in five waves — (1) left panel tabbed restructure + layers + pages, (2) properties panel with position/size/opacity, (3) color picker popover, (4) typography section + Google Fonts, (5) brand system (swatches + presets + palette generator). Each wave produces immediately usable UI.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fabric | 7.2.0 | Canvas object model + read/write properties | Already the canvas engine; all property edits go through it |
| zustand | 5.0.12 | Store: canvasStore, brandStore, projectStore | Already established; granular selector pattern prevents re-renders |
| motion | 12.38.0 | Panel animations | Already used in EditorLayout |
| lucide-react | 1.7.0 | Icons (eye, lock, grip handle, etc.) | Already used throughout |
| react-hot-toast | 2.6.0 | Feedback toasts | Already established pattern |

### New Dependencies Required
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| react-colorful | 5.6.1 | Color picker wheel + input | 2.8 KB, actively maintained, ships TS types, React 19 compatible (`>=16.8.0` peer dep) |
| @dnd-kit/core | 6.3.1 | Drag-and-drop for layer/page reorder | React 19 compatible (`>=16.8.0`). More flexible than @hello-pangea/dnd for non-list reorder |
| @dnd-kit/sortable | 10.0.0 | Sortable list abstraction over @dnd-kit/core | Pair with core for layer/page sortable lists |
| use-eye-dropper | latest | EyeDropper API hook (COLR-02) | Wraps native EyeDropper API, handles unsupported browsers gracefully |

**Installation:**
```bash
npm install react-colorful @dnd-kit/core @dnd-kit/sortable use-eye-dropper
```

**Version verification (confirmed 2026-03-28):**
- react-colorful: 5.6.1 (npm view)
- @dnd-kit/core: 6.3.1 (npm view)
- @dnd-kit/sortable: 10.0.0 (npm view)
- @hello-pangea/dnd: 18.0.1 — alternative but @dnd-kit is lighter

### Not Needed
| Avoid | Why |
|-------|-----|
| @hello-pangea/dnd | react-beautiful-dnd fork; more opinionated list model; @dnd-kit is preferred for custom UIs |
| fontfaceobserver | Native FontFace API (`document.fonts.load()`) is sufficient for all modern browsers |
| color-convert | Manual HSL math for palette generation is 10 lines; no dep needed |
| google-fonts-loader-v2 | Direct Google Fonts API v1 fetch + FontFace API covers the use case cleanly |

---

## Architecture Patterns

### Recommended File Structure (new files only)
```
src/components/editor/panels/
├── LeftPanel.tsx              # Tabbed container (Tools | Layers | Pages)
├── LayersPanel.tsx            # Layer list with @dnd-kit/sortable
├── PagesPanel.tsx             # Page thumbnails with @dnd-kit/sortable
├── PropertiesPanel.tsx        # REPLACE placeholder — context-sensitive sections
├── sections/
│   ├── PositionSection.tsx    # X/Y/W/H/Rotation/Opacity inputs
│   ├── FillSection.tsx        # Fill color + gradient toggle
│   ├── StrokeSection.tsx      # Stroke color/width/style
│   ├── ShadowSection.tsx      # Shadow toggle + offset/blur/color
│   ├── TypographySection.tsx  # Font family/weight/size/align/presets
│   ├── FitModeSection.tsx     # Image fit mode (fill/fit/stretch)
│   └── PageSection.tsx        # Background color + doc info (nothing selected)
└── ColorPicker.tsx            # Reusable popover — react-colorful + inputs + swatches

src/components/editor/ui/
└── StylePanel.tsx             # Brand swatches editor + preset editor + palette gen

src/stores/
└── brandStore.ts              # EXTEND: add swatchId tracking, preset wiring (file exists)

src/hooks/
├── useSelectedObject.ts       # Read selected Fabric object properties → typed snapshot
├── useCanvasLayers.ts         # Sync canvas object order → layer list
└── useGoogleFonts.ts          # Fetch font list, on-demand FontFace loader
```

### Pattern 1: Reading Object Properties for the Properties Panel

**What:** On `selection:created` / `selection:updated` / `object:modified`, read the selected object's properties into a lightweight typed snapshot stored in canvasStore (or local component state). The panel renders from the snapshot, not by querying the canvas live.

**Why:** Direct `canvas.getActiveObject().get('property')` calls from render functions cause re-render loops and are fragile. A snapshot pattern keeps the panel declarative.

**Example:**
```typescript
// hooks/useSelectedObject.ts
// Source: Architecture pattern from .planning/research/ARCHITECTURE.md

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

export interface ObjectSnapshot {
  type: 'text' | 'image' | 'shape' | 'colorBlock' | null;
  x: number; y: number; w: number; h: number; // in mm
  rotation: number; opacity: number;
  fill?: string; stroke?: string; strokeWidth?: number;
  shadow?: { x: number; y: number; blur: number; color: string } | null;
  // text-only
  fontFamily?: string; fontSize?: number; fontWeight?: number;
  lineHeight?: number; charSpacing?: number; fill_text?: string;
  textAlign?: string;
  // shape-only
  rx?: number; ry?: number;
}

export function useSelectedObject(): ObjectSnapshot | null {
  const [snapshot, setSnapshot] = useState<ObjectSnapshot | null>(null);
  const canvasRef = useCanvasStore((s) => s.canvasRef);

  useEffect(() => {
    if (!canvasRef) return;
    const refresh = () => {
      const obj = canvasRef.getActiveObject();
      if (!obj) { setSnapshot(null); return; }
      const { pxToMm } = require('@/lib/units');
      setSnapshot({
        type: (obj as Record<string, unknown>).customType as ObjectSnapshot['type'],
        x: pxToMm((obj.left ?? 0)),
        y: pxToMm((obj.top ?? 0)),
        w: pxToMm((obj.getScaledWidth())),
        h: pxToMm((obj.getScaledHeight())),
        rotation: obj.angle ?? 0,
        opacity: (obj.opacity ?? 1) * 100,
        fill: obj.fill as string,
        // ... etc
      });
    };
    canvasRef.on('selection:created', refresh);
    canvasRef.on('selection:updated', refresh);
    canvasRef.on('object:modified', refresh);
    canvasRef.on('selection:cleared', refresh);
    return () => {
      canvasRef.off('selection:created', refresh);
      canvasRef.off('selection:updated', refresh);
      canvasRef.off('object:modified', refresh);
      canvasRef.off('selection:cleared', refresh);
    };
  }, [canvasRef]);

  return snapshot;
}
```

### Pattern 2: Writing Properties Back to Canvas

**What:** Panel input `onChange` calls a command function that mutates the Fabric object directly and calls `canvas.renderAll()`. A 300ms debounce groups rapid input changes into a single history snapshot.

**Critical:** Call `obj.setCoords()` after changing position/size so selection handles update correctly.

**Example:**
```typescript
// Inside PositionSection.tsx
function updateX(mm: number) {
  const canvas = useCanvasStore.getState().canvasRef;
  const obj = canvas?.getActiveObject();
  if (!obj || !canvas) return;
  obj.set({ left: mmToPx(mm) });
  obj.setCoords();
  canvas.renderAll();
  // debounced: canvas.fire('object:modified') to record history
}
```

### Pattern 3: Layer List Sync with Fabric.js Z-Index

**What:** The layer list renders canvas objects in reverse z-order (top of list = front of canvas). On drag-reorder, call `canvas.moveTo(object, newIndex)`. On canvas events (`object:added`, `object:removed`, `stack:changed`), refresh the layer list from `canvas.getObjects()`.

**Critical:** `canvas.getObjects()` returns objects in z-order (index 0 = bottom). The layer panel must display them reversed (index 0 = top).

**Example:**
```typescript
// hooks/useCanvasLayers.ts
export function useCanvasLayers() {
  const canvasRef = useCanvasStore((s) => s.canvasRef);
  const [layers, setLayers] = useState<LayerItem[]>([]);

  useEffect(() => {
    if (!canvasRef) return;
    const refresh = () => {
      const objs = canvasRef.getObjects();
      setLayers([...objs].reverse().map(obj => ({
        id: (obj as Record<string,unknown>).id as string,
        name: (obj as Record<string,unknown>).name as string,
        type: (obj as Record<string,unknown>).customType as string,
        visible: obj.visible ?? true,
        locked: (obj as Record<string,unknown>).locked as boolean ?? false,
        fabricObj: obj,
      })));
    };
    canvasRef.on('object:added', refresh);
    canvasRef.on('object:removed', refresh);
    canvasRef.on('object:modified', refresh);
    refresh();
    return () => {
      canvasRef.off('object:added', refresh);
      canvasRef.off('object:removed', refresh);
      canvasRef.off('object:modified', refresh);
    };
  }, [canvasRef]);

  function moveLayer(fromIndex: number, toIndex: number) {
    if (!canvasRef) return;
    const objs = canvasRef.getObjects();
    // layers array is reversed, convert back to canvas index
    const canvasFrom = objs.length - 1 - fromIndex;
    const canvasTo = objs.length - 1 - toIndex;
    canvasRef.moveTo(objs[canvasFrom], canvasTo);
    canvasRef.renderAll();
  }

  return { layers, moveLayer };
}
```

### Pattern 4: Google Fonts On-Demand Loading

**What:** Fetch the font list from Google Fonts API v1 once on mount (or from a static bundled list of popular fonts). When user selects a font, use the CSS FontFace API to load it before applying to the canvas object. Clear Fabric.js font cache after loading.

**Critical:** If the font cache is not cleared, Fabric.js will use stale character width measurements, causing wrong cursor positions and bounding boxes.

**Example:**
```typescript
// hooks/useGoogleFonts.ts
export async function loadGoogleFont(family: string, weight = 400): Promise<void> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  // Inject @import link if not already present
  const linkId = `gf-${family.replace(/\s+/g, '-')}-${weight}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }
  // Wait for font to be ready
  await document.fonts.load(`${weight} 16px "${family}"`);
  // Clear Fabric.js internal font cache for this family
  const { clearFabricFontCache } = await import('fabric');
  if (typeof clearFabricFontCache === 'function') {
    clearFabricFontCache(family);
  }
}
```

For the font picker dropdown rendering (each font in its own typeface), load fonts lazily as the dropdown list item scrolls into view using `IntersectionObserver`.

### Pattern 5: Live-Linked Brand Swatches

**What:** When a brand swatch is edited, iterate all pages (load each page JSON from sessionStorage, find all objects with matching `swatchId` CUSTOM_PROP, update their `fill`, re-serialize to sessionStorage). The current page is updated live via the canvas instance.

**New CUSTOM_PROP needed:** `swatchId` (string | null) — must be added to the `CUSTOM_PROPS` array in `element-factory.ts`.

**Example:**
```typescript
// When user edits a swatch hex in StylePanel:
function updateSwatch(swatchId: string, newHex: string) {
  // 1. Update brandStore
  useBrandStore.getState().setBrandColors(
    brandColors.map(s => s.id === swatchId ? { ...s, hex: newHex } : s)
  );
  // 2. Update current page canvas live
  const canvas = useCanvasStore.getState().canvasRef;
  canvas?.getObjects().forEach(obj => {
    if ((obj as Record<string,unknown>).swatchId === swatchId) {
      obj.set({ fill: newHex });
    }
  });
  canvas?.renderAll();
  // 3. Update other pages in sessionStorage
  const project = useProjectStore.getState().currentProject;
  if (!project) return;
  project.pages.forEach((page, i) => {
    if (i === project.currentPageIndex) return; // already done
    const key = `dessy-generated-page-${project.meta.id}-${i}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) return;
    try {
      const json = JSON.parse(stored);
      json.objects?.forEach((obj: Record<string,unknown>) => {
        if (obj.swatchId === swatchId) obj.fill = newHex;
      });
      sessionStorage.setItem(key, JSON.stringify(json));
    } catch { /* ignore */ }
  });
}
```

### Pattern 6: Page Thumbnail Generation

**What:** Use `canvas.toDataURL({ multiplier: 0.15, format: 'jpeg', quality: 0.6 })` on the current canvas to capture a thumbnail when saving/switching pages. For non-current pages, thumbnails are generated from the page JSON in sessionStorage by loading into an off-screen `StaticCanvas`.

**Performance note:** Thumbnail generation for the current page is cheap (just a downscaled toDataURL). Generating thumbnails for other pages is more expensive — do it lazily only when the Pages tab is visible.

**Example:**
```typescript
// Capture current page thumbnail
const thumb = canvas.toDataURL({ multiplier: 0.15, format: 'jpeg', quality: 0.6 });
// Store in component state for Pages tab display
```

### Pattern 7: Multi-Page CRUD

**What:** Add/remove/duplicate/reorder pages in `projectStore`. Page content (canvas JSON) lives in sessionStorage. The `triggerSwitchPage` callback already handles save + load.

**Add page:**
```typescript
// projectStore: add new page to pages array
const newPage: Page = { id: crypto.randomUUID(), elements: [], background: '#FFFFFF' };
setCurrentProject({ ...project, pages: [...project.pages, newPage] });
// Switch to new page
triggerSwitchPage(project.pages.length); // loads empty canvas
```

**Duplicate page:**
```typescript
// Copy current page JSON from sessionStorage under new key
const currentJSON = sessionStorage.getItem(`dessy-generated-page-${projectId}-${currentIdx}`);
const newIdx = project.pages.length;
sessionStorage.setItem(`dessy-generated-page-${projectId}-${newIdx}`, currentJSON ?? '{}');
// Add page to store
```

**Reorder pages:** Update `project.pages` array order in store AND remap all sessionStorage keys to new indices.

**PAGE-04 (bifold/trifold auto-create):** Check `project.meta.format` on project init. If format is `bifold`, ensure pages.length === 2; if `trifold`, ensure pages.length === 3. Add blank pages if count is less.

### Anti-Patterns to Avoid
- **Reading Fabric object properties directly in render:** Never call `canvas.getActiveObject().get('prop')` inside a React render function. Use the snapshot pattern (Pattern 1).
- **Updating canvas on every keypress in a text input:** Debounce property panel inputs at 150ms for visual feedback, 300ms for history snapshot. Do not fire `object:modified` on each keypress.
- **Storing FontFace objects in React state:** Load fonts imperatively via the FontFace API, do not try to model font loading state with React effects.
- **Forgetting `setCoords()` after position/size changes:** Any `obj.set({left, top, width, height, scaleX, scaleY})` must be followed by `obj.setCoords()` for selection handles to be correct.
- **Re-creating layer list from scratch on every canvas event:** Diff the layer list rather than rebuilding; avoids expensive re-renders during animations/drags.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-to-reorder layer list | Custom mouse event drag system | @dnd-kit/sortable | Touch support, keyboard accessibility, drag overlays, scroll into view — all handled |
| Color picker wheel | HTML5 canvas arc drawing | react-colorful | HSL/HSB wheel with pointer, correct color math, tiny bundle |
| Eyedropper color pick | Canvas pixel sampling workaround | EyeDropper API + use-eye-dropper | Native browser API on Chrome/Edge; hook handles feature detection |
| Google Font rendering in dropdown | @font-face injection per list item | CSS FontFace API + IntersectionObserver | Batch load as user scrolls; native API, no library overhead |
| Drag handle for layers | onMouseDown + global mousemove | @dnd-kit DragOverlay | Handles pointer capture, pointer events on canvas overlap, drag cancel |

**Key insight:** The drag-and-drop implementation for layers is the single most complex UI piece. @dnd-kit handles the hard cases (pointer capture over canvas, keyboard a11y, touch devices) that a hand-rolled solution will miss.

---

## Common Pitfalls

### Pitfall 1: Fabric.js Font Cache Not Cleared After Google Font Load
**What goes wrong:** User selects a new Google Font. The font loads via FontFace API. `obj.set({ fontFamily: 'Playfair Display' })` is called. Canvas re-renders but text bounding boxes are wrong — selection handles don't fit the text. Cursor positions are off when editing.
**Why it happens:** Fabric.js caches character width measurements per font family. If the cache isn't cleared, it reuses measurements from before the font loaded (using fallback font metrics).
**How to avoid:** Always call `clearFabricFontCache(fontFamily)` (imported from `fabric`) after `document.fonts.load(...)` resolves, then call `canvas.renderAll()`.
**Warning signs:** Selection handle is too narrow after font change; cursor jumps to wrong position during text edit.

### Pitfall 2: Layer Drag Conflicts with Canvas Mouse Events
**What goes wrong:** @dnd-kit drag starts on a layer row, but the Fabric.js canvas underneath intercepts pointer events, causing the drag to cancel.
**Why it happens:** Fabric.js canvas element has `pointer-events: auto` on its container. When the drag overlay moves over the canvas area, pointer events route to the canvas.
**How to avoid:** The layer panel is in the left panel (280px), which does not overlap the canvas. The drag overlay (`DragOverlay` component) renders in a portal — set `style={{ pointerEvents: 'none' }}` on the overlay. If any overlap occurs, temporarily set `canvas.getElement().style.pointerEvents = 'none'` during drag and restore on `DragEnd`.
**Warning signs:** Drag starts but immediately cancels when moving toward center of screen.

### Pitfall 3: Page Reorder Invalidates sessionStorage Keys
**What goes wrong:** User drags pages to reorder. Pages 0/1/2 are now 2/0/1. But sessionStorage still has the old keys (`dessy-generated-page-X-0`, `-1`, `-2`). Switching to the reordered pages loads wrong content.
**Why it happens:** sessionStorage keys are index-based. Reordering the `project.pages` array doesn't move the stored canvas JSON.
**How to avoid:** On page reorder, implement a key-remap step: read all page JSONs into an array, update `project.pages` order, re-write all sessionStorage keys in the new order.

### Pitfall 4: Opacity Input Shows 0-100 but Fabric.js Uses 0-1
**What goes wrong:** User sets opacity to 50. The input shows 50. But `obj.opacity` is 50 instead of 0.5. Canvas re-render shows almost fully transparent element.
**Why it happens:** Display value and storage value differ. Developer forgets the conversion.
**How to avoid:** Convert at the boundary: `obj.set({ opacity: displayValue / 100 })` when writing; `Math.round((obj.opacity ?? 1) * 100)` when reading.

### Pitfall 5: Shadow Object Requires Fabric.js Shadow Class
**What goes wrong:** Setting `obj.set({ shadow: { offsetX: 5, offsetY: 5, blur: 10, color: '#000' } })` does nothing.
**Why it happens:** Fabric.js expects a `Shadow` instance, not a plain object.
**How to avoid:**
```typescript
import { Shadow } from 'fabric';
obj.set({ shadow: new Shadow({ offsetX: 5, offsetY: 5, blur: 10, color: '#000000' }) });
// To remove shadow:
obj.set({ shadow: null });
canvas.renderAll();
```

### Pitfall 6: Multi-Page Typography Preset Apply
**What goes wrong:** User edits a typography preset. Changes apply to all text elements on current page but not to text on other pages.
**Why it happens:** Other pages are not loaded in the canvas — their JSON is in sessionStorage. Preset apply only iterates the live canvas.
**How to avoid:** Same sessionStorage iteration pattern as live-linked swatches (Pattern 5). When a preset changes, update the live canvas AND update the JSON in sessionStorage for all other pages.

### Pitfall 7: @dnd-kit and Zustand Selector Misuse on Drag
**What goes wrong:** Layer list causes all components subscribed to canvasStore to re-render on every drag frame.
**Why it happens:** Drag state is stored in a Zustand store with broad selectors.
**How to avoid:** Keep drag state local (`useState` inside LayersPanel) or in @dnd-kit's own context — do not pump drag position into Zustand. Only commit the final reorder to Zustand/canvas on `DragEnd`.

---

## Code Examples

### Installing react-colorful with HEX input
```typescript
// Source: https://github.com/omgovich/react-colorful
import { HexColorPicker, HexColorInput } from 'react-colorful';

function ColorPickerPopover({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div style={{ padding: '12px', background: '#1e1e1e', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
      <HexColorPicker color={value} onChange={onChange} />
      <HexColorInput
        color={value}
        onChange={onChange}
        prefixed  // shows # prefix
        style={{ /* dark theme inputs */ }}
      />
    </div>
  );
}
```

### @dnd-kit Sortable Layer List
```typescript
// Source: https://docs.dndkit.com/presets/sortable
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function LayerRow({ id, name }: { id: string; name: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <span {...listeners} {...attributes} style={{ cursor: 'grab' }}>⠿</span>
      {name}
    </div>
  );
}

function LayersPanel() {
  const { layers, moveLayer } = useCanvasLayers();
  const ids = layers.map(l => l.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    moveLayer(from, to);
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {layers.map(layer => <LayerRow key={layer.id} id={layer.id} name={layer.name} />)}
      </SortableContext>
    </DndContext>
  );
}
```

### Reading/Writing Fabric.js Shadow
```typescript
// Source: Fabric.js official API — Shadow class
import { Shadow } from 'fabric';

// Read shadow from selected object
const obj = canvas.getActiveObject();
const shadow = obj?.shadow as (Shadow & { offsetX: number; offsetY: number; blur: number; color: string }) | null;
const hasShadow = !!shadow;

// Write shadow
obj.set({
  shadow: hasShadow ? null : new Shadow({
    offsetX: 4, offsetY: 4, blur: 8, color: 'rgba(0,0,0,0.5)'
  })
});
canvas.renderAll();
```

### Fabric.js Gradient Fill for Color Blocks
```typescript
// Source: Fabric.js Gradient API
import { Gradient } from 'fabric';

const gradient = new Gradient({
  type: 'linear',
  gradientUnits: 'percentage',
  coords: { x1: 0, y1: 0, x2: 1, y2: 0 }, // left to right
  colorStops: [
    { offset: 0, color: '#6366f1' },
    { offset: 1, color: '#8b5cf6' },
  ],
});
obj.set({ fill: gradient });
canvas.renderAll();
```

### EyeDropper via use-eye-dropper hook
```typescript
// Source: https://github.com/woofers/use-eye-dropper
import useEyeDropper from 'use-eye-dropper';

function EyedropperButton({ onPick }: { onPick: (hex: string) => void }) {
  const { open, isSupported } = useEyeDropper();
  if (!isSupported()) return null;
  return (
    <button onClick={() => open().then(({ sRGBHex }) => onPick(sRGBHex)).catch(() => {})}>
      Eyedropper
    </button>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fabric.js `fabric.Shadow({...})` (namespace import) | `new Shadow({...})` (named import from 'fabric') | Fabric.js v6 | Code in this phase must use named imports |
| `react-beautiful-dnd` | `@dnd-kit` | 2022-2023 | react-beautiful-dnd is unmaintained; @dnd-kit is the current standard |
| Google Fonts v1 CSS `@import` only | CSS FontFace API + `document.fonts.load()` | Evergreen browsers | Fine-grained control, loads on demand, compatible with canvas export |
| `HexColorPicker` from `react-color` (casesandberg) | `react-colorful` | 2021 | react-color is unmaintained (2022), no TypeScript, 31KB |

**Deprecated/outdated:**
- `fabric.Shadow` namespace-style (v5): replaced by `import { Shadow } from 'fabric'`
- `canvas.toJSON()` with images: always use `canvas.toDatalessJSON(CUSTOM_PROPS)` — already established in Phase 1

---

## Open Questions

1. **Brand Swatch CUSTOM_PROP serialization**
   - What we know: `CUSTOM_PROPS` array in `element-factory.ts` controls what gets serialized in canvas JSON
   - What's unclear: `swatchId` is not currently in CUSTOM_PROPS — it must be added or swatch linking breaks on save/load
   - Recommendation: Add `'swatchId'` and `'presetId'` to `CUSTOM_PROPS` in Wave 1 before any swatch/preset wiring

2. **Typography Preset Global Apply — Performance**
   - What we know: Iterating all pages' sessionStorage JSON is O(pages × objects per page)
   - What's unclear: With 6 pages and 50 elements per page, this is 300 JSON mutations — likely <10ms
   - Recommendation: Synchronous iteration is fine for MVP; add loading indicator if > 100ms observed

3. **Google Fonts API Key**
   - What we know: Google Fonts API v1 requires an API key for the font list endpoint
   - What's unclear: Whether a Next.js API route proxy is needed or if the key can be a public NEXT_PUBLIC_ env var (Google Fonts key is not a secret — it's rate-limited per key, not billing-sensitive like Gemini)
   - Recommendation: Use `NEXT_PUBLIC_GOOGLE_FONTS_API_KEY` — Google Fonts API keys are public-facing by design. Alternatively, embed a static JSON list of the top 100 fonts as a bundled asset to avoid the API call entirely.

4. **Page Thumbnail Updates**
   - What we know: Thumbnail for current page is easy. Thumbnails for other pages require loading their JSON.
   - What's unclear: Whether to generate thumbnails eagerly (on page switch) or lazily (when Pages tab opens)
   - Recommendation: Lazy — only generate when Pages tab is visible. Cache thumbnails as data URLs in component state, invalidate when `triggerSwitchPage` is called.

5. **Project.brandColors vs brandStore.brandColors**
   - What we know: `Project` type has a `brandColors: string[]` (hex values). `brandStore` has `ColorSwatch[]` with IDs.
   - What's unclear: These are inconsistent. Swatch IDs are needed for live-linking (COLR-05) but not in the Project type.
   - Recommendation: Extend `Project` type to include `brandSwatches: ColorSwatch[]` and deprecate `brandColors: string[]`. Migrate `brandStore` to load from `project.brandSwatches` on project open.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + ts-jest 29.4.6 + jest-environment-jsdom |
| Config file | `jest.config.ts` (exists) |
| Quick run command | `npx jest --testPathPattern="src/lib|src/stores|src/hooks" --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAGE-01 | Add/remove/reorder pages in project store | unit | `npx jest --testPathPattern="projectStore" -x` | ❌ Wave 0 |
| PAGE-03 | Duplicate page copies sessionStorage JSON | unit | `npx jest --testPathPattern="pages" -x` | ❌ Wave 0 |
| PAGE-04 | Bifold auto-creates 2 pages, trifold 3 pages | unit | `npx jest --testPathPattern="pageInit" -x` | ❌ Wave 0 |
| PROP-01 | pxToMm/mmToPx round-trip for property inputs | unit | `npx jest --testPathPattern="units" -x` | ✅ exists |
| PROP-04 | Shadow: `new Shadow({...})` round-trip serialize | unit | `npx jest --testPathPattern="shadow" -x` | ❌ Wave 0 |
| COLR-05 | Swatch edit updates sessionStorage page JSON | unit | `npx jest --testPathPattern="swatch" -x` | ❌ Wave 0 |
| STYL-03 | Preset apply updates sessionStorage page JSON | unit | `npx jest --testPathPattern="preset" -x` | ❌ Wave 0 |
| TYPO-01 | loadGoogleFont resolves and clears font cache | unit (mock FontFace API) | `npx jest --testPathPattern="googleFonts" -x` | ❌ Wave 0 |

**Manual-only (reasonable for UI):**
- LPNL-02/03/04: Layer drag-reorder, visibility toggle, inline rename — visual interaction, not unit-testable
- COLR-01/02: Color picker popover, eyedropper — browser UI interaction
- TYPO-02/03/04: Typography inputs rendering in correct font — visual

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="projectStore|units|swatch|preset" --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/__tests__/projectStore.test.ts` — covers PAGE-01, PAGE-03, PAGE-04
- [ ] `src/lib/__tests__/shadow.test.ts` — covers PROP-04 Shadow class usage
- [ ] `src/lib/__tests__/swatch.test.ts` — covers COLR-05 sessionStorage swatch propagation
- [ ] `src/lib/__tests__/preset.test.ts` — covers STYL-03 sessionStorage preset propagation
- [ ] `src/hooks/__tests__/useGoogleFonts.test.ts` — covers TYPO-01 (mock document.fonts)

---

## Sources

### Primary (HIGH confidence)
- [Fabric.js FabricText API docs](https://fabricjs.com/api/classes/fabrictext/) — typography properties: fontFamily, fontSize, fontWeight, charSpacing, lineHeight
- [Fabric.js Loading Custom Fonts demo](https://fabricjs.com/demos/loading-custom-fonts/) — FontFace API pattern, clearFabricFontCache requirement
- [Fabric.js Custom Properties docs](https://fabricjs.com/docs/using-custom-properties/) — CUSTOM_PROPS serialization pattern
- [react-colorful GitHub](https://github.com/omgovich/react-colorful) — HexColorPicker, HexColorInput components, peer deps
- [@dnd-kit/core npm](https://www.npmjs.com/package/@dnd-kit/core) — version 6.3.1, React >= 16.8 peer dep
- [@dnd-kit/sortable npm](https://www.npmjs.com/package/@dnd-kit/sortable) — version 10.0.0
- [EyeDropper API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API) — Chromium-only, experimental
- [use-eye-dropper GitHub](https://github.com/woofers/use-eye-dropper) — React hook wrapper for EyeDropper API
- [Google Fonts Developer API](https://developers.google.com/fonts/docs/developer_api) — v1 REST endpoint for font list
- [CSS Font Loading API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API) — `document.fonts.load()` pattern

### Secondary (MEDIUM confidence)
- Phase 1 research: `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md` — Zustand patterns, canvas-as-imperative-island, sync contract
- Verified from existing code: `CUSTOM_PROPS`, `pxToMm/mmToPx`, `triggerSwitchPage`, `brandStore` types, `SectionHeader` pattern

### Tertiary (LOW confidence)
- Fabric.js Shadow class constructor signature — verified by docs but exact parameter names (`offsetX` vs `x`) should be confirmed against Fabric.js 7 source at implementation time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library versions verified against npm registry 2026-03-28
- Architecture patterns: HIGH — based on existing Phase 1 codebase + official Fabric.js docs
- Pitfalls: HIGH — sourced from official Fabric.js docs + directly observed in existing code review
- Google Fonts loading: HIGH — official CSS Font Loading API (MDN), Fabric.js official demo
- @dnd-kit integration: MEDIUM — peer deps verified, API confirmed from docs, but not yet integration-tested with this specific Fabric.js canvas setup

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (30 days — stable libraries)
