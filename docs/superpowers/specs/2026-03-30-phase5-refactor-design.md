# Phase 5 Refactoring: Dashboard, Templates & Editor Quality Pass

**Date:** 2026-03-30
**Scope:** Full sweep — all dashboard components, editor components, shared utilities, tests
**Goal:** Product-level code quality, zero inline styles, DRY, proper error handling, high test coverage

---

## Wave 1: Foundation Fixes

No UI changes. Highest impact-to-risk ratio.

### 1.1 Add `_isDocBackground` to CUSTOM_PROPS

**File:** `src/lib/fabric/element-factory.ts`

Add `'_isDocBackground'` to the CUSTOM_PROPS array. This ensures the property survives `toDatalessJSON` → `loadFromJSON` round-trips.

**Why:** Without this, reloaded projects lose doc background identity — breaking thumbnail capture, raster export crop bounds, layer filtering, and canvas zoom centering.

### 1.2 Extract shared thumbnail capture

**New file:** `src/lib/thumbnails/capture.ts`

```typescript
export async function captureThumbnail(
  canvas: Canvas,
  projectId: string,
  formatId: LeafletFormatId
): Promise<void>
```

- Uses `renderPageToBlob` from `raster-export.ts` (PNG, multiplier 1)
- Converts blob → dataUrl via FileReader
- Saves via `saveThumbnail()`

**Delete from:** `App.tsx` (export function captureThumbnail), `useAutoSave.ts` (captureThumbnailForAutoSave)

**Callers:** Both import shared `captureThumbnail`.

### 1.3 Extract shared template utilities

**New file:** `src/lib/templates/template-utils.ts`

```typescript
export const CATEGORY_COLORS: Record<string, string> = { ... };

export function createProjectFromTemplate(template: TemplateEntry): string;
```

`createProjectFromTemplate`:
1. Deep clones `template.canvasJSON`
2. Sets `originX: 'left'`, `originY: 'top'` on all objects missing them
3. Fixes `_isDocBackground` rect position/dimensions to match format bleed
4. Creates page array
5. Calls `saveProject()`
6. Returns new project ID

**Delete from:** `EmptyState.tsx` (handleTemplateClick body), `TemplateGallery.tsx` (handleUseTemplate body), and both copies of `CATEGORY_COLORS`.

**Fix:** Real Estate color mismatch (EmptyState had `#10b981`, TemplateGallery had `#3b82f6`). Use `#3b82f6` (blue).

### 1.4 Fix all unhandled promises

| File | Line | Fix |
|------|------|-----|
| `EditorCanvasInner.tsx` | loadFromJSON | Add `.catch()`, log error, show toast |
| `EditorCanvasInner.tsx` | FabricImage.fromURL (drag-drop) | Add `.catch()`, remove placeholder frame on failure |
| `ProjectCard.tsx` | getThumbnail | Add `.catch(() => null)` |
| `ProjectCardMenu.tsx` | duplicateProject | Check return value, show error toast if null |
| `ProjectCardMenu.tsx` | deleteThumbnail | Add `.catch()` (fire-and-forget is OK, but catch to prevent unhandled rejection) |
| `thumbnailDb.ts` | All 3 functions | Guard `dbPromise` null (return early/null), wrap IDB ops in try/catch |

### 1.5 Fix functional bugs

| Bug | File | Fix |
|-----|------|-----|
| Paste not undoable | `useKeyboardShortcuts.ts:130` | Call `historyFns.captureState()` before `canvas.add(pasted)` |
| Busy modal stuck | `App.tsx` | Add Escape key listener + 30s auto-dismiss timeout |
| Overlapping auto-saves | `useAutoSave.ts` | Add `isSaving` ref guard, skip interval tick if previous save still running |
| "Copy of " not i18n'd | `projectStorage.ts:62` | Accept optional `copyPrefix` parameter, caller passes `t('dashboard.copyOf')` |

---

## Wave 2: Split EditorCanvasInner

Current: 428 lines mixing 6+ concerns. Target: ~100 lines composing focused hooks.

### 2.1 `src/hooks/useImageUpload.ts`

**Extracts from EditorCanvasInner:**
- Double-click image upload event handler
- Drag-and-drop image handling (`onDrop`, `onDragOver`, `onDragLeave`)
- `imageUploadRef` and file input change handler

**Fixes:**
- Drag-drop race condition: track `isMounted` ref, abort pending `FabricImage.fromURL` on cleanup
- Remove placeholder frame if image load fails

**Interface:**
```typescript
export function useImageUpload(canvas: Canvas | null): {
  imageUploadRef: RefObject<HTMLInputElement>;
  isDragOver: boolean;
  handleDrop: (e: DragEvent) => void;
  handleDragOver: (e: DragEvent) => void;
  handleDragLeave: () => void;
}
```

### 2.2 `src/hooks/useProjectIO.ts`

**Extracts from EditorCanvasInner + App.tsx:**
- `triggerSave`, `triggerExport`, `triggerImport` wiring
- The triggerSave subscription wrapping (currently in App.tsx EditorRoot useEffect)
- Canvas restore from sessionStorage
- File import handler

**Interface:**
```typescript
export function useProjectIO(
  canvas: Canvas | null,
  projectId: string,
  formatId: string
): {
  importFileRef: RefObject<HTMLInputElement>;
  handleImportFile: (e: ChangeEvent<HTMLInputElement>) => void;
}
```

### 2.3 `src/hooks/usePageSwitching.ts`

**Extracts from EditorCanvasInner:**
- `triggerSwitchPage` function (save current page JSON to sessionStorage, load target page)
- `triggerClearCanvas` function

**Interface:**
```typescript
export function usePageSwitching(
  canvas: Canvas | null,
  projectId: string
): void  // Registers functions in canvasStore, no return needed
```

### 2.4 Slim EditorCanvasInner.tsx (~100 lines)

**Keeps:**
- Canvas element ref + `useFabricCanvas` call
- Composition of useImageUpload, useProjectIO, usePageSwitching, useAutoSave, useCanvasZoomPan, useKeyboardShortcuts
- Render: canvas element, GuidesOverlay, ContextMenu, KeyboardShortcutsModal, hidden file inputs
- `hasElements` state for empty canvas detection

---

## Wave 3: Inline Styles → Tailwind

Zero `style={{}}` attributes when complete.

### 3.1 Dashboard components

| Component | Inline style objects | Approach |
|-----------|---------------------|----------|
| `Dashboard.tsx` | ~8 | Header → flex layout classes, main → min-h-screen bg classes |
| `ProjectGrid.tsx` | ~3 | Grid → `grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6` |
| `ProjectCard.tsx` | ~15 | Card → rounded-xl border transition classes, thumbnail → h-40 overflow-hidden |
| `ProjectCardMenu.tsx` | ~12 | Dropdown → absolute bg-surface rounded-lg shadow, items → hover:bg classes |
| `EmptyState.tsx` | ~20 | Flex column center layout, CTA button → primary button classes |
| `NewLeafletModal.tsx` | ~30 | Modal backdrop → fixed inset-0, panel → bg-surface rounded-xl, tabs, format cards |
| `TemplateGallery.tsx` | ~25 | Category pills → rounded-full px-4, grid → auto-fill grid, preview modal |

### 3.2 Editor components

| Component | Inline style objects | Approach |
|-----------|---------------------|----------|
| `App.tsx` busy modal | ~6 | Fixed overlay → `fixed inset-0 bg-black/70 z-[999] flex items-center justify-center` |
| `LayersPanel.tsx` | ~40 | Layer rows, group headers, tree indent, buttons — all to Tailwind |
| `EditorCanvasInner.tsx` | ~5 | Drop overlay, root container |

### 3.3 Tailwind config additions

Add semantic color aliases to `tailwind.config.ts`:

```javascript
colors: {
  surface: { DEFAULT: '#141414', secondary: '#1e1e1e', tertiary: '#0a0a0a' },
  border: { DEFAULT: '#2a2a2a' },
  text: { primary: '#f5f5f5', secondary: '#888888' },
  primary: { DEFAULT: '#6366f1', hover: '#818cf8' },
}
```

### 3.4 Fix font inconsistency

Remove all `fontFamily: 'Arial'` (19 occurrences in NewLeafletModal + TemplateGallery). Use `font-sans` class which resolves to Inter via Tailwind config.

---

## Wave 4: Listener & State Cleanup

### 4.1 Fix duplicate listener accumulation

**File:** `src/hooks/useCanvasLayers.ts`

Track whether listeners are attached via a ref. Detach before re-attaching:

```typescript
const attachedCanvasRef = useRef<Canvas | null>(null);

function attachCanvasListeners(canvas: Canvas) {
  if (attachedCanvasRef.current === canvas) return; // already attached
  if (attachedCanvasRef.current) detachCanvasListeners(attachedCanvasRef.current);
  canvas.on('object:added', syncLayers);
  // ...
  attachedCanvasRef.current = canvas;
}
```

### 4.2 Fix stale closures in useCanvasZoomPan

- Wrap dynamic `import('fabric')` calls in try/catch
- Check `isMounted` ref after each await in mouse move handler
- Remove file-level `eslint-disable` — type the Fabric event objects properly

### 4.3 Layer ID persistence

Add `'__layerId'` to CUSTOM_PROPS (or rename to `layerId` to drop the dunder prefix). This ensures layer IDs survive save/reload.

---

## Wave 5: Type Safety & Tests

### 5.1 Remove `any` casts

| File | Current | Fix |
|------|---------|-----|
| `useCanvasZoomPan.ts` | File-level `eslint-disable any` | Type events as `TPointerEventInfo` from Fabric |
| `EditorCanvasInner.tsx` | `(obj as any)` for custom props | Create `FabricObjectWithCustom` interface, reuse from useCanvasLayers |
| `raster-export.ts` | `(o: any) => o._isDocBackground` | Use shared `FabricObjectWithCustom` type |
| `useCanvasLayers.ts` | Multiple `any` casts | Already has `FabricObjectWithCustom` — export and reuse |

**New shared type file:** `src/types/fabric-custom.ts`
```typescript
export interface FabricObjectCustomProps {
  id?: string;
  name?: string;
  customType?: string;
  locked?: boolean;
  _isDocBackground?: boolean;
  __layerId?: string;
  imageId?: string;
  shapeKind?: string;
  fitMode?: string;
  swatchId?: string;
  presetId?: string;
}
```

### 5.2 Test coverage

| Test file | What it covers |
|-----------|---------------|
| `src/lib/templates/__tests__/template-utils.test.ts` | createProjectFromTemplate: origin fix, bleed fix, save call, ID return |
| `src/lib/thumbnails/__tests__/capture.test.ts` | captureThumbnail: calls renderPageToBlob, saves result |
| `src/lib/storage/__tests__/projectStorage.test.ts` | Fill existing stubs: save, load, delete, duplicate, rename |
| `src/lib/storage/__tests__/thumbnailDb.test.ts` | Fill existing stubs: save, get, delete, null dbPromise guard |
| `src/hooks/__tests__/useCanvasLayers.test.ts` | extractLayers with groups, buildGroupTree, findObjectById recursion |
| `src/lib/utils/__tests__/relativeTime.test.ts` | Edge cases: future dates, just now, locale switching |

---

## Dependency Order

```
Wave 1 (no deps)
  ├── 1.1 CUSTOM_PROPS fix
  ├── 1.2 Thumbnail utility
  ├── 1.3 Template utility
  ├── 1.4 Promise error handling
  └── 1.5 Functional bugs

Wave 2 (depends on 1.2, 1.5)
  ├── 2.1 useImageUpload
  ├── 2.2 useProjectIO
  ├── 2.3 usePageSwitching
  └── 2.4 Slim EditorCanvasInner

Wave 3 (independent, can parallel with Wave 2)
  ├── 3.1 Dashboard Tailwind
  ├── 3.2 Editor Tailwind
  ├── 3.3 Tailwind config
  └── 3.4 Font fix

Wave 4 (depends on Wave 2)
  ├── 4.1 Listener cleanup
  ├── 4.2 Zoom/pan closures
  └── 4.3 Layer ID persistence

Wave 5 (depends on all above)
  ├── 5.1 Type safety
  └── 5.2 Tests
```

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/templates/template-utils.ts` | createProjectFromTemplate, CATEGORY_COLORS |
| `src/lib/thumbnails/capture.ts` | Shared captureThumbnail |
| `src/types/fabric-custom.ts` | Shared FabricObjectCustomProps interface |
| `src/hooks/useImageUpload.ts` | Image upload + drag-drop |
| `src/hooks/useProjectIO.ts` | Save/export/import/restore |
| `src/hooks/usePageSwitching.ts` | Page switch + clear canvas |

## Files Deleted

None — all changes are extractions and edits.

## Files Significantly Modified

| File | Change |
|------|--------|
| `src/lib/fabric/element-factory.ts` | Add `_isDocBackground`, `__layerId` to CUSTOM_PROPS |
| `src/App.tsx` | Remove captureThumbnail, remove triggerSave wrapping, fix busy modal |
| `src/hooks/useAutoSave.ts` | Remove captureThumbnailForAutoSave, add isSaving guard |
| `src/components/editor/EditorCanvasInner.tsx` | Extract to hooks, slim to ~100 lines |
| `src/components/dashboard/*.tsx` (7 files) | Inline styles → Tailwind |
| `src/components/editor/panels/LayersPanel.tsx` | Inline styles → Tailwind |
| `src/hooks/useCanvasLayers.ts` | Listener dedup, export shared types |
| `src/hooks/useCanvasZoomPan.ts` | Type safety, stale closure fixes |
| `src/hooks/useKeyboardShortcuts.ts` | Undoable paste |
| `src/lib/storage/projectStorage.ts` | i18n "Copy of" |
| `src/lib/storage/thumbnailDb.ts` | Null guards, error handling |
