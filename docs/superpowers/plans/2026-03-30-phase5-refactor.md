# Phase 5 Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor phase 5 code to product-level quality — extract shared utilities, fix bugs, eliminate inline styles, split large components, add tests.

**Architecture:** Five waves of incremental refactoring. Each wave produces a working build. Wave 1 fixes foundations (CUSTOM_PROPS, shared utils, error handling). Wave 2 splits EditorCanvasInner into hooks. Wave 3 converts all inline styles to Tailwind using existing `@theme` variables. Wave 4 cleans up listeners and state. Wave 5 adds type safety and test coverage.

**Tech Stack:** React 19, Zustand, Fabric.js 7, Tailwind CSS 4 (@theme in globals.css), Vitest, react-i18next

**Tailwind note:** This project uses Tailwind 4 with CSS-based configuration. Semantic colors are defined via `@theme` in `src/globals.css` (e.g., `--color-surface`, `--color-border`, `--color-accent`). Use classes like `bg-surface`, `border-border`, `text-accent` etc. No `tailwind.config.ts` file exists.

---

## Task 1: Add `_isDocBackground` and `layerId` to CUSTOM_PROPS

**Files:**
- Modify: `src/lib/fabric/element-factory.ts:8-18`

- [ ] **Step 1: Add properties to CUSTOM_PROPS array**

In `src/lib/fabric/element-factory.ts`, change:

```typescript
export const CUSTOM_PROPS = [
  'customType',
  'imageId',
  'locked',
  'name',
  'id',
  'shapeKind',
  'fitMode',
  'swatchId',
  'presetId',
] as const;
```

to:

```typescript
export const CUSTOM_PROPS = [
  'customType',
  'imageId',
  'locked',
  'name',
  'id',
  'shapeKind',
  'fitMode',
  'swatchId',
  'presetId',
  '_isDocBackground',
  'layerId',
] as const;
```

- [ ] **Step 2: Rename `__layerId` to `layerId` in useCanvasLayers.ts**

In `src/hooks/useCanvasLayers.ts`, replace all occurrences of `__layerId` with `layerId`:

```typescript
// In the FabricObjectWithCustom type (around line 31)
  layerId?: string;

// In getObjectId function (around line 41)
function getObjectId(obj: FabricObjectWithCustom): string {
  if (obj.id) return obj.id;
  if (!obj.layerId) {
    obj.layerId = crypto.randomUUID();
  }
  return obj.layerId;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/fabric/element-factory.ts src/hooks/useCanvasLayers.ts
git commit -m "fix: add _isDocBackground and layerId to CUSTOM_PROPS for save/reload persistence"
```

---

## Task 2: Create shared fabric custom types

**Files:**
- Create: `src/types/fabric-custom.ts`
- Modify: `src/hooks/useCanvasLayers.ts`

- [ ] **Step 1: Create shared type file**

Create `src/types/fabric-custom.ts`:

```typescript
import type { FabricObject } from 'fabric';

export type FabricObjectWithCustom = FabricObject & {
  id?: string;
  name?: string;
  customType?: string;
  locked?: boolean;
  _isDocBackground?: boolean;
  layerId?: string;
  imageId?: string;
  shapeKind?: string;
  fitMode?: string;
  swatchId?: string;
  presetId?: string;
};
```

- [ ] **Step 2: Update useCanvasLayers.ts to import shared type**

In `src/hooks/useCanvasLayers.ts`, remove the local `FabricObjectWithCustom` type definition (lines 26-32) and import from shared:

```typescript
import type { FabricObjectWithCustom } from '@/types/fabric-custom';
```

Keep the local `LayerItem`, `GroupTreeNode`, and `LayerType` types as they are — those are layer-specific.

- [ ] **Step 3: Commit**

```bash
git add src/types/fabric-custom.ts src/hooks/useCanvasLayers.ts
git commit -m "refactor: extract FabricObjectWithCustom to shared types"
```

---

## Task 3: Extract shared thumbnail capture

**Files:**
- Create: `src/lib/thumbnails/capture.ts`
- Modify: `src/App.tsx`
- Modify: `src/hooks/useAutoSave.ts`

- [ ] **Step 1: Create shared capture module**

Create `src/lib/thumbnails/capture.ts`:

```typescript
import type { Canvas } from 'fabric';
import type { LeafletFormatId } from '@/types/project';
import { renderPageToBlob } from '@/lib/export/raster-export';
import { getDocDimensions } from '@/lib/fabric/canvas-config';
import { FORMATS } from '@/constants/formats';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { saveThumbnail } from '@/lib/storage/thumbnailDb';

export async function captureThumbnail(
  canvas: Canvas,
  projectId: string,
  formatId: LeafletFormatId
): Promise<void> {
  const format = FORMATS[formatId] ?? FORMATS['A4'];
  const doc = getDocDimensions(format);

  const canvasJSON = canvas.toDatalessJSON([...CUSTOM_PROPS]);
  const pageData = { pageIndex: 0, canvasJSON, pageId: '', background: '#FFFFFF' };

  const blob = await renderPageToBlob(pageData, doc.width, doc.height, 'png', 1);
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  await saveThumbnail(projectId, dataUrl);
}
```

- [ ] **Step 2: Update App.tsx — remove captureThumbnail, import shared**

In `src/App.tsx`:

1. Remove the entire `export async function captureThumbnail(...)` function (lines ~31-68)
2. Remove the `import { saveThumbnail } from '@/lib/storage/thumbnailDb'` import
3. Add import: `import { captureThumbnail } from '@/lib/thumbnails/capture';`
4. Update the triggerSave wrapper call (around line 130) — change from `captureThumbnail(projectId)` to:

```typescript
const { currentProject } = useProjectStore.getState();
captureThumbnail(canvas, projectId, currentProject?.meta.format ?? 'A4').catch(() => {});
```

Wait — the triggerSave wrapper doesn't have `canvas` in scope. Instead, use:

```typescript
const canvasRef = useCanvasStore.getState().canvasRef;
if (canvasRef) {
  captureThumbnail(canvasRef, projectId, currentProject?.meta.format ?? 'A4').catch(() => {});
}
```

- [ ] **Step 3: Update useAutoSave.ts — remove local capture, import shared**

In `src/hooks/useAutoSave.ts`:

1. Remove the entire `async function captureThumbnailForAutoSave(...)` function
2. Remove unused imports: `saveThumbnail` from thumbnailDb
3. Add import: `import { captureThumbnail } from '@/lib/thumbnails/capture';`
4. Update the call site (inside setInterval callback, after successful save):

```typescript
// Capture thumbnail after successful auto-save
const canvasRef = canvas;
if (canvasRef) {
  captureThumbnail(canvasRef, projectId, currentProject.meta.format).catch(() => {});
}
```

- [ ] **Step 4: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/thumbnails/capture.ts src/App.tsx src/hooks/useAutoSave.ts
git commit -m "refactor: extract shared captureThumbnail utility, remove duplicates"
```

---

## Task 4: Extract shared template utilities

**Files:**
- Create: `src/lib/templates/template-utils.ts`
- Modify: `src/components/dashboard/EmptyState.tsx`
- Modify: `src/components/dashboard/TemplateGallery.tsx`

- [ ] **Step 1: Create template-utils.ts**

Create `src/lib/templates/template-utils.ts`:

```typescript
import type { TemplateEntry } from '@/lib/templates/templates-index';
import { FORMATS } from '@/constants/formats';
import { getDocDimensions } from '@/lib/fabric/canvas-config';
import { saveProject } from '@/lib/storage/projectStorage';
import type { ProjectMeta } from '@/types/project';

export const CATEGORY_COLORS: Record<string, string> = {
  Sale: '#ef4444',
  Event: '#8b5cf6',
  Restaurant: '#f59e0b',
  'Real Estate': '#3b82f6',
  Corporate: '#6b7280',
  Fitness: '#22c55e',
  Beauty: '#ec4899',
  Education: '#06b6d4',
};

export function createProjectFromTemplate(template: TemplateEntry): string {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const meta: ProjectMeta = {
    id: newId,
    name: template.name,
    format: template.format,
    createdAt: now,
    updatedAt: now,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasJSON = JSON.parse(JSON.stringify(template.canvasJSON)) as { objects?: any[] };

  // Fix for Fabric.js 7: default originX/originY changed to 'center'
  const format = FORMATS[template.format] ?? FORMATS['A4'];
  const doc = getDocDimensions(format);
  for (const obj of canvasJSON.objects ?? []) {
    if (!obj.originX) obj.originX = 'left';
    if (!obj.originY) obj.originY = 'top';
    if (obj._isDocBackground) {
      obj.left = -doc.bleedPx;
      obj.top = -doc.bleedPx;
      obj.width = doc.width;
      obj.height = doc.height;
    }
  }

  const pages = Array.from({ length: template.pageCount }, () => ({
    id: crypto.randomUUID(),
    elements: [],
    background: '#FFFFFF',
  }));

  saveProject(newId, { meta, canvasJSON, pageData: { pages, currentPageIndex: 0 } });
  return newId;
}
```

- [ ] **Step 2: Simplify EmptyState.tsx**

In `src/components/dashboard/EmptyState.tsx`:

1. Remove imports: `FORMATS`, `getDocDimensions`, `saveProject`
2. Add import: `import { CATEGORY_COLORS, createProjectFromTemplate } from '@/lib/templates/template-utils';`
3. Remove local `CATEGORY_COLORS` constant
4. Replace `handleTemplateClick` body:

```typescript
function handleTemplateClick(template: typeof TEMPLATES[number]) {
  const newId = createProjectFromTemplate(template);
  useAppStore.getState().openProject(newId);
}
```

- [ ] **Step 3: Simplify TemplateGallery.tsx**

In `src/components/dashboard/TemplateGallery.tsx`:

1. Remove imports: `FORMATS`, `getDocDimensions`, `saveProject`, `ProjectMeta`
2. Add import: `import { CATEGORY_COLORS, createProjectFromTemplate } from '@/lib/templates/template-utils';`
3. Remove local `CATEGORY_COLORS` constant
4. Replace `handleUseTemplate` body:

```typescript
function handleUseTemplate() {
  if (!selectedTemplate) return;
  const newId = createProjectFromTemplate(selectedTemplate);
  useAppStore.getState().openProject(newId);
  onClose();
}
```

- [ ] **Step 4: Verify build**

Run: `npx vite build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/templates/template-utils.ts src/components/dashboard/EmptyState.tsx src/components/dashboard/TemplateGallery.tsx
git commit -m "refactor: extract createProjectFromTemplate and CATEGORY_COLORS, remove duplicates"
```

---

## Task 5: Fix unhandled promises and error handling

**Files:**
- Modify: `src/components/editor/EditorCanvasInner.tsx`
- Modify: `src/components/dashboard/ProjectCard.tsx`
- Modify: `src/components/dashboard/ProjectCardMenu.tsx`
- Modify: `src/lib/storage/thumbnailDb.ts`

- [ ] **Step 1: Fix thumbnailDb.ts null guard and error handling**

In `src/lib/storage/thumbnailDb.ts`, replace the entire file:

```typescript
import { openDB } from 'idb';

const DB_NAME = 'dessy-thumbnails';
const STORE_NAME = 'thumbnails';

const dbPromise = typeof window !== 'undefined'
  ? openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    })
  : null;

export async function saveThumbnail(projectId: string, dataUrl: string): Promise<void> {
  if (!dbPromise) return;
  try {
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const db = await dbPromise;
    await db.put(STORE_NAME, blob, projectId);
  } catch {
    // Thumbnail save failure is non-critical
  }
}

export async function getThumbnail(projectId: string): Promise<string | null> {
  if (!dbPromise) return null;
  try {
    const db = await dbPromise;
    const blob = await db.get(STORE_NAME, projectId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function deleteThumbnail(projectId: string): Promise<void> {
  if (!dbPromise) return;
  try {
    const db = await dbPromise;
    await db.delete(STORE_NAME, projectId);
  } catch {
    // Thumbnail delete failure is non-critical
  }
}
```

- [ ] **Step 2: Fix ProjectCard.tsx — add .catch to getThumbnail**

In `src/components/dashboard/ProjectCard.tsx`, around line 31, add `.catch`:

```typescript
getThumbnail(project.id).then((url) => {
  if (cancelled) {
    if (url) URL.revokeObjectURL(url);
    return;
  }
  objectUrl = url;
  setThumbUrl(url);
}).catch(() => {
  // Thumbnail load failure — card shows placeholder
});
```

- [ ] **Step 3: Fix ProjectCardMenu.tsx — handle duplicate/delete errors**

In `src/components/dashboard/ProjectCardMenu.tsx`:

Add `import toast from 'react-hot-toast';` and `import { useTranslation } from 'react-i18next';` (already imported).

Update `handleDuplicate`:

```typescript
function handleDuplicate() {
  const newId = duplicateProject(project.id);
  if (!newId) {
    toast.error(t('dashboard.errorDeleteProject'));
    return;
  }
  onRefresh();
  onClose();
}
```

Update `handleDeleteConfirm`:

```typescript
function handleDeleteConfirm() {
  deleteProject(project.id);
  deleteThumbnail(project.id).catch(() => {});
  onRefresh();
  onClose();
}
```

- [ ] **Step 4: Fix EditorCanvasInner.tsx — add .catch to loadFromJSON**

In `src/components/editor/EditorCanvasInner.tsx`, in the canvas restore effect, add error handling:

```typescript
canvas.loadFromJSON(canvasJSON).then(() => {
  canvas.renderAll();
  setHasElements(canvas.getObjects().length > 0);
}).catch(() => {
  // Corrupt canvas data — canvas stays with default doc background
});
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage/thumbnailDb.ts src/components/dashboard/ProjectCard.tsx src/components/dashboard/ProjectCardMenu.tsx src/components/editor/EditorCanvasInner.tsx
git commit -m "fix: add error handling to all unhandled promises"
```

---

## Task 6: Fix functional bugs

**Files:**
- Modify: `src/hooks/useKeyboardShortcuts.ts`
- Modify: `src/App.tsx`
- Modify: `src/hooks/useAutoSave.ts`
- Modify: `src/lib/storage/projectStorage.ts`
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/bg.json`

- [ ] **Step 1: Make paste undoable**

In `src/hooks/useKeyboardShortcuts.ts`, in the paste handler (around line 127-139), add history capture before adding:

```typescript
// Paste
if (key === 'v') {
  e.preventDefault();
  if (clipboardRef.current) {
    const pasted = await clipboardRef.current.clone() as FabricObject;
    pasted.set({
      left: (pasted.left ?? 0) + 10,
      top: (pasted.top ?? 0) + 10,
    });
    historyFns.captureState(canvas);
    canvas.add(pasted);
    canvas.setActiveObject(pasted);
    canvas.requestRenderAll();
  }
  return;
}
```

Note: `historyFns` is the second parameter to `useKeyboardShortcuts`. Check the function signature — it receives `{ undo, redo }`. We need to also pass `captureState`. Read the hook signature and the call site in EditorCanvasInner to ensure `captureState` is available. If not, add it to the interface and pass it from EditorCanvasInner where `historyRef.current.captureState` is available.

- [ ] **Step 2: Fix busy modal — add Escape dismiss and timeout**

In `src/App.tsx`, in the `EditorRoot` component, wrap the busy modal with escape handling. Add a useEffect inside EditorRoot:

```typescript
// Auto-dismiss stuck busy modal after 30s
useEffect(() => {
  if (!busyMessage) return;
  const timeout = setTimeout(() => {
    useCanvasStore.getState().setBusyMessage(null);
  }, 30_000);
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') useCanvasStore.getState().setBusyMessage(null);
  };
  document.addEventListener('keydown', handleEscape);
  return () => {
    clearTimeout(timeout);
    document.removeEventListener('keydown', handleEscape);
  };
}, [busyMessage]);
```

Check that `setBusyMessage` exists on canvasStore. If it doesn't, find the actual setter name (likely just setting `busyMessage` directly via `useCanvasStore.setState({ busyMessage: null })`).

- [ ] **Step 3: Prevent overlapping auto-saves**

In `src/hooks/useAutoSave.ts`, add an `isSaving` guard:

```typescript
export function useAutoSave(canvas: Canvas | null, projectId: string) {
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!canvas) return;

    const interval = setInterval(async () => {
      if (isSavingRef.current) return;
      const { currentProject, isDirty } = useProjectStore.getState();
      if (!currentProject || !isDirty) return;

      isSavingRef.current = true;
      try {
        // ... existing save logic ...
      } finally {
        isSavingRef.current = false;
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [canvas, projectId]);
}
```

Add `import { useRef } from 'react';` to the imports.

- [ ] **Step 4: i18n the "Copy of" prefix**

In `src/lib/storage/projectStorage.ts`, update `duplicateProject`:

```typescript
export function duplicateProject(sourceId: string, copyPrefix = 'Copy of'): string | null {
  const source = loadProject(sourceId);
  if (!source) return null;
  const newId = crypto.randomUUID();
  const newMeta: ProjectMeta = {
    ...source.meta,
    id: newId,
    name: `${copyPrefix} ${source.meta.name}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveProject(newId, { ...source, meta: newMeta });
  return newId;
}
```

In `src/i18n/en.json`, add under `dashboard`:
```json
"copyOf": "Copy of"
```

In `src/i18n/bg.json`, add under `dashboard`:
```json
"copyOf": "Копие на"
```

Update caller in `ProjectCardMenu.tsx`:
```typescript
function handleDuplicate() {
  const newId = duplicateProject(project.id, t('dashboard.copyOf'));
  // ...
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useKeyboardShortcuts.ts src/App.tsx src/hooks/useAutoSave.ts src/lib/storage/projectStorage.ts src/i18n/en.json src/i18n/bg.json src/components/dashboard/ProjectCardMenu.tsx
git commit -m "fix: undoable paste, dismissible busy modal, auto-save guard, i18n copy prefix"
```

---

## Task 7: Split EditorCanvasInner — extract useImageUpload

**Files:**
- Create: `src/hooks/useImageUpload.ts`
- Modify: `src/components/editor/EditorCanvasInner.tsx`

- [ ] **Step 1: Read EditorCanvasInner.tsx fully**

Read the entire file to identify all image-upload-related code: the `imageUploadRef`, double-click upload handler, drag-drop handlers, and the `handleImageUpload` callback. Note exact line ranges.

- [ ] **Step 2: Create useImageUpload.ts**

Extract the image upload and drag-drop logic into `src/hooks/useImageUpload.ts`. The hook should:

- Accept `canvas: Canvas | null` parameter
- Own the `imageUploadRef` for the hidden file input
- Own the `isDragOver` state
- Handle the `dessy-image-upload` custom event listener
- Handle drag-and-drop with `FabricImage.fromURL` including:
  - `isMountedRef` to prevent updates after unmount
  - `.catch()` on `FabricImage.fromURL` that removes the placeholder frame
- Handle the file input `onChange` for image upload
- Return `{ imageUploadRef, isDragOver, handleDrop, handleDragOver, handleDragLeave }`

- [ ] **Step 3: Remove image code from EditorCanvasInner.tsx**

Remove the extracted code from EditorCanvasInner. Import and use the hook:

```typescript
const { imageUploadRef, isDragOver, handleDrop, handleDragOver, handleDragLeave } = useImageUpload(canvasInstance);
```

- [ ] **Step 4: Verify build**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useImageUpload.ts src/components/editor/EditorCanvasInner.tsx
git commit -m "refactor: extract useImageUpload hook from EditorCanvasInner"
```

---

## Task 8: Split EditorCanvasInner — extract useProjectIO

**Files:**
- Create: `src/hooks/useProjectIO.ts`
- Modify: `src/components/editor/EditorCanvasInner.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create useProjectIO.ts**

Extract from EditorCanvasInner:
- `triggerSave`, `triggerExport`, `triggerImport` setup (the code that calls `useCanvasStore.getState().setPersistFns(...)`)
- Canvas restore from sessionStorage effect
- File import handler (`handleImportFile`)
- The `importFileRef`

Also move from App.tsx EditorRoot:
- The `triggerSave` subscription wrapping (thumbnail capture on save)

The hook should:
- Accept `(canvas: Canvas | null, projectId: string, formatId: string)`
- Return `{ importFileRef, handleImportFile }`

- [ ] **Step 2: Remove IO code from EditorCanvasInner and App.tsx**

Remove the extracted code. Import and use:

```typescript
const { importFileRef, handleImportFile } = useProjectIO(canvasInstance, projectId, formatId);
```

Remove the triggerSave subscription wrapping from App.tsx EditorRoot useEffect.

- [ ] **Step 3: Verify build**

Run: `npx vite build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useProjectIO.ts src/components/editor/EditorCanvasInner.tsx src/App.tsx
git commit -m "refactor: extract useProjectIO hook from EditorCanvasInner and App.tsx"
```

---

## Task 9: Split EditorCanvasInner — extract usePageSwitching

**Files:**
- Create: `src/hooks/usePageSwitching.ts`
- Modify: `src/components/editor/EditorCanvasInner.tsx`

- [ ] **Step 1: Create usePageSwitching.ts**

Extract from EditorCanvasInner:
- `triggerSwitchPage` function
- `triggerClearCanvas` function
- The code that registers these in canvasStore (`setSwitchPageFn`, `setClearCanvasFn`)

The hook should:
- Accept `(canvas: Canvas | null, projectId: string)`
- Register functions in canvasStore via useEffect
- Return `void`

- [ ] **Step 2: Remove page switching code from EditorCanvasInner**

Import and call: `usePageSwitching(canvasInstance, projectId);`

- [ ] **Step 3: Verify EditorCanvasInner is now ~100-150 lines**

Run: `wc -l src/components/editor/EditorCanvasInner.tsx`
Expected: Significantly reduced from 428 lines.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/usePageSwitching.ts src/components/editor/EditorCanvasInner.tsx
git commit -m "refactor: extract usePageSwitching hook, EditorCanvasInner now ~100 lines"
```

---

## Task 10: Tailwind config — verify semantic colors

**Files:**
- Modify: `src/globals.css` (if needed)

- [ ] **Step 1: Verify existing @theme colors**

Read `src/globals.css`. The existing `@theme` block defines:
- `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-border`
- `--color-text-primary`, `--color-text-secondary`
- `--color-accent`, `--color-accent-hover`
- `--color-success`, `--color-warning`, `--color-danger`

Check if any colors used in inline styles are missing from the theme. The dashboard uses:
- `#0a0a0a` → `bg` ✓
- `#141414` → `surface` ✓
- `#1e1e1e` → `surface-raised` ✓
- `#2a2a2a` → `border` ✓
- `#f5f5f5` → `text-primary` ✓
- `#888` / `#888888` → `text-secondary` ✓
- `#6366f1` → `accent` ✓
- `#818cf8` → `accent-hover` ✓
- `#ef4444` → `danger` ✓

If all colors are covered, no changes needed. If any are missing, add them.

- [ ] **Step 2: Commit (only if changes needed)**

```bash
git add src/globals.css
git commit -m "feat: extend Tailwind theme colors for dashboard components"
```

---

## Task 11: Convert Dashboard.tsx to Tailwind

**Files:**
- Modify: `src/components/dashboard/Dashboard.tsx`

- [ ] **Step 1: Read the current file**

Read `src/components/dashboard/Dashboard.tsx` fully to understand all inline styles.

- [ ] **Step 2: Replace all inline styles with Tailwind classes**

Convert every `style={{...}}` to `className="..."`. Use semantic color classes from the theme. Remove `fontFamily` properties — use `font-sans`. Ensure no `style={{}}` attributes remain.

- [ ] **Step 3: Verify visually**

Start dev server (`npm run dev`), open http://localhost:3002/dessy/, verify dashboard looks identical.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/Dashboard.tsx
git commit -m "refactor: convert Dashboard.tsx inline styles to Tailwind"
```

---

## Task 12: Convert ProjectGrid.tsx to Tailwind

**Files:**
- Modify: `src/components/dashboard/ProjectGrid.tsx`

- [ ] **Step 1: Read and convert all inline styles to Tailwind**

This is a small component (~30 lines). Convert grid layout styles to Tailwind:
- `gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'` → `grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))]`
- `gap: '24px'` → `gap-6`
- Motion div stagger animations can keep their motion props.

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ProjectGrid.tsx
git commit -m "refactor: convert ProjectGrid.tsx inline styles to Tailwind"
```

---

## Task 13: Convert ProjectCard.tsx to Tailwind

**Files:**
- Modify: `src/components/dashboard/ProjectCard.tsx`

- [ ] **Step 1: Read and convert all inline styles**

This is ~240 lines with ~15 style objects. Convert:
- Card container: `bg-surface rounded-xl border border-border overflow-hidden cursor-pointer transition-colors hover:border-accent`
- Thumbnail area: `h-40 overflow-hidden p-3 box-border flex items-center justify-center`
- Image: `w-full h-full object-contain`
- Metadata: `p-3`, text sizes, colors
- 3-dot button: `absolute top-2 right-2 bg-black/70 rounded-md p-1`
- Replace `onMouseEnter`/`onMouseLeave` inline style manipulation with Tailwind `hover:` classes

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ProjectCard.tsx
git commit -m "refactor: convert ProjectCard.tsx inline styles to Tailwind"
```

---

## Task 14: Convert ProjectCardMenu.tsx to Tailwind

**Files:**
- Modify: `src/components/dashboard/ProjectCardMenu.tsx`

- [ ] **Step 1: Read and convert all inline styles**

Convert:
- Menu container: `absolute top-8 right-0 bg-surface-raised border border-border rounded-lg p-1 z-10 min-w-[140px]`
- Menu items: `block w-full text-left px-3 py-2 text-sm rounded cursor-pointer bg-transparent border-none text-text-primary hover:bg-border`
- Delete button: `text-danger hover:bg-danger/10`
- Delete confirm: buttons with `flex-1 px-2 py-1.5 text-xs font-medium rounded-md`
- Remove the `menuItemBase` CSS object and `onMouseEnter`/`onMouseLeave` handlers — use Tailwind `hover:` instead

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ProjectCardMenu.tsx
git commit -m "refactor: convert ProjectCardMenu.tsx inline styles to Tailwind"
```

---

## Task 15: Convert EmptyState.tsx to Tailwind

**Files:**
- Modify: `src/components/dashboard/EmptyState.tsx`

- [ ] **Step 1: Read and convert all inline styles**

~20 style objects. Convert the flex column layout, illustration SVG container, heading, body text, CTA button, and template suggestion cards. Remove all `fontFamily` references.

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/EmptyState.tsx
git commit -m "refactor: convert EmptyState.tsx inline styles to Tailwind"
```

---

## Task 16: Convert NewLeafletModal.tsx to Tailwind

**Files:**
- Modify: `src/components/dashboard/NewLeafletModal.tsx`

- [ ] **Step 1: Read and convert all inline styles**

~30 style objects. This is the largest conversion. Convert:
- Modal backdrop: `fixed inset-0 bg-black/75 z-50 flex items-center justify-center`
- Panel: `bg-surface border border-border rounded-xl w-[560px] max-h-[80vh] overflow-hidden relative`
- Tab bar: flex with bottom border
- Tab buttons: conditional `border-b-2 border-accent` or `border-transparent`
- Format cards: grid with hover states
- Custom dimension inputs: `bg-surface-raised border border-border rounded px-2 py-1`
- Close button: absolute positioned
- Remove ALL `fontFamily: 'Arial'` — use `font-sans`

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/NewLeafletModal.tsx
git commit -m "refactor: convert NewLeafletModal.tsx inline styles to Tailwind"
```

---

## Task 17: Convert TemplateGallery.tsx to Tailwind

**Files:**
- Modify: `src/components/dashboard/TemplateGallery.tsx`

- [ ] **Step 1: Read and convert all inline styles**

~25 style objects. Convert:
- Category pills: `rounded-full px-4 py-2 text-sm cursor-pointer` with conditional bg
- Template grid: `grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 p-6`
- Template cards: `bg-surface-raised border border-border rounded-lg overflow-hidden cursor-pointer hover:border-accent`
- Preview modal: fixed overlay, two-column grid layout
- Remove ALL `fontFamily: 'Arial'` — use `font-sans`

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/TemplateGallery.tsx
git commit -m "refactor: convert TemplateGallery.tsx inline styles to Tailwind"
```

---

## Task 18: Convert App.tsx busy modal and LayersPanel.tsx to Tailwind

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/editor/panels/LayersPanel.tsx`

- [ ] **Step 1: Convert App.tsx busy modal**

The busy overlay (around lines 148-179) uses ~6 inline style objects. Convert:
- Overlay: `fixed inset-0 bg-black/70 z-[999] flex items-center justify-center pointer-events-auto`
- Modal box: `bg-surface-raised border border-border rounded-xl px-8 py-6 flex items-center gap-3 shadow-2xl`
- Spinner: Use Tailwind `animate-spin` with border utility
- Remove the inline `<style>` tag for `@keyframes spin`

- [ ] **Step 2: Convert LayersPanel.tsx**

This is the largest editor conversion (~40 inline style objects). Read the full file first. Convert:
- Layer rows: hover states, selected states, padding, font sizes
- Group headers: uppercase text, chevron icons
- Tree indent: use `pl-[${depth * 16 + 8}px]` — this needs a dynamic style since Tailwind can't do runtime values. Use `style={{ paddingLeft: ${8 + depth * 16}px }}` for just the tree indent depth. All other styles convert to Tailwind.
- View toggle tabs: `flex-1 p-1.5 text-[10px] font-semibold uppercase tracking-wider`
- Buttons: visibility/lock icon buttons

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/components/editor/panels/LayersPanel.tsx
git commit -m "refactor: convert App.tsx busy modal and LayersPanel.tsx to Tailwind"
```

---

## Task 19: Fix listener accumulation in useCanvasLayers

**Files:**
- Modify: `src/hooks/useCanvasLayers.ts`

- [ ] **Step 1: Add attached canvas tracking**

Add a ref to track the currently attached canvas, and guard against duplicate attachments:

```typescript
const attachedCanvasRef = useRef<Canvas | null>(null);

function attachCanvasListeners(canvas: Canvas) {
  if (attachedCanvasRef.current === canvas) return;
  if (attachedCanvasRef.current) detachCanvasListeners(attachedCanvasRef.current);
  canvas.on('object:added', syncLayers);
  canvas.on('object:removed', syncLayers);
  canvas.on('object:modified', syncLayers);
  attachedCanvasRef.current = canvas;
}

function detachCanvasListeners(canvas: Canvas) {
  canvas.off('object:added', syncLayers);
  canvas.off('object:removed', syncLayers);
  canvas.off('object:modified', syncLayers);
  if (attachedCanvasRef.current === canvas) attachedCanvasRef.current = null;
}
```

Add `import { useRef } from 'react'` to imports (if not already present).

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCanvasLayers.ts
git commit -m "fix: prevent duplicate canvas listener accumulation in useCanvasLayers"
```

---

## Task 20: Fix stale closures in useCanvasZoomPan

**Files:**
- Modify: `src/hooks/useCanvasZoomPan.ts`

- [ ] **Step 1: Read the full file**

Identify all `async` event handlers that use `await import('fabric')`.

- [ ] **Step 2: Add try/catch and mounted guard**

For each async handler:
1. Wrap `await import('fabric')` in try/catch
2. After each await, check `if (!isMounted) return;` using an `isMountedRef`

Add to the useEffect:
```typescript
const isMountedRef = { current: true };
// ... existing code ...
return () => {
  isMountedRef.current = false;
  // ... existing cleanup ...
};
```

- [ ] **Step 3: Remove file-level eslint-disable**

Remove `/* eslint-disable @typescript-eslint/no-explicit-any */` from the top of the file. Add targeted `// eslint-disable-next-line` only where needed for Fabric event types that truly need `any`.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCanvasZoomPan.ts
git commit -m "fix: add mounted guards and error handling to useCanvasZoomPan async handlers"
```

---

## Task 21: Replace `any` casts with shared types

**Files:**
- Modify: `src/components/editor/EditorCanvasInner.tsx`
- Modify: `src/lib/export/raster-export.ts`
- Modify: `src/App.tsx`
- Modify: `src/hooks/useAutoSave.ts` (if any remain)

- [ ] **Step 1: Import FabricObjectWithCustom where `any` is used for custom props**

In each file that casts to `any` to access `_isDocBackground`, `customType`, etc., import and use the shared type:

```typescript
import type { FabricObjectWithCustom } from '@/types/fabric-custom';

// Replace: (o: any) => o._isDocBackground
// With:    (o) => (o as FabricObjectWithCustom)._isDocBackground
```

Apply to:
- `raster-export.ts` — bgRect find
- `App.tsx` — any remaining custom prop access
- `EditorCanvasInner.tsx` — all custom prop access

- [ ] **Step 2: Commit**

```bash
git add src/components/editor/EditorCanvasInner.tsx src/lib/export/raster-export.ts src/App.tsx src/types/fabric-custom.ts
git commit -m "refactor: replace any casts with shared FabricObjectWithCustom type"
```

---

## Task 22: Write tests for template-utils

**Files:**
- Create: `src/lib/templates/__tests__/template-utils.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProjectFromTemplate, CATEGORY_COLORS } from '../template-utils';

// Mock saveProject
vi.mock('@/lib/storage/projectStorage', () => ({
  saveProject: vi.fn(() => ({ success: true })),
}));

describe('CATEGORY_COLORS', () => {
  it('has entries for all 8 categories', () => {
    expect(Object.keys(CATEGORY_COLORS)).toHaveLength(8);
    expect(CATEGORY_COLORS['Real Estate']).toBe('#3b82f6');
  });
});

describe('createProjectFromTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTemplate = {
    id: 'test-01',
    name: 'Test Template',
    category: 'Sale' as const,
    format: 'A4' as const,
    pageCount: 1,
    canvasJSON: {
      version: '7.0.0',
      objects: [
        { type: 'Rect', left: 0, top: 0, width: 595, height: 842, _isDocBackground: true, customType: 'background' },
        { type: 'Textbox', left: 40, top: 60, width: 200, text: 'Hello' },
      ],
    },
  };

  it('returns a valid UUID project ID', () => {
    const id = createProjectFromTemplate(mockTemplate);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('sets originX/originY to left/top on all objects', () => {
    const { saveProject } = require('@/lib/storage/projectStorage');
    createProjectFromTemplate(mockTemplate);
    const savedData = saveProject.mock.calls[0][1];
    for (const obj of savedData.canvasJSON.objects) {
      expect(obj.originX).toBe('left');
      expect(obj.originY).toBe('top');
    }
  });

  it('fixes doc background position with bleed offset', () => {
    const { saveProject } = require('@/lib/storage/projectStorage');
    createProjectFromTemplate(mockTemplate);
    const savedData = saveProject.mock.calls[0][1];
    const bg = savedData.canvasJSON.objects.find((o: { _isDocBackground?: boolean }) => o._isDocBackground);
    expect(bg.left).toBeLessThan(0); // negative bleed offset
    expect(bg.top).toBeLessThan(0);
    expect(bg.width).toBeGreaterThan(595); // includes bleed
    expect(bg.height).toBeGreaterThan(842);
  });

  it('creates correct number of pages', () => {
    const { saveProject } = require('@/lib/storage/projectStorage');
    const multiPage = { ...mockTemplate, pageCount: 3 };
    createProjectFromTemplate(multiPage);
    const savedData = saveProject.mock.calls[0][1];
    expect(savedData.pageData.pages).toHaveLength(3);
  });

  it('does not mutate the original template', () => {
    const original = JSON.parse(JSON.stringify(mockTemplate.canvasJSON));
    createProjectFromTemplate(mockTemplate);
    expect(mockTemplate.canvasJSON).toEqual(original);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/lib/templates/__tests__/template-utils.test.ts`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/templates/__tests__/template-utils.test.ts
git commit -m "test: add tests for createProjectFromTemplate and CATEGORY_COLORS"
```

---

## Task 23: Write tests for projectStorage

**Files:**
- Modify: `src/lib/storage/__tests__/projectStorage.test.ts`

- [ ] **Step 1: Read existing test stubs**

Read the file to see what stubs exist.

- [ ] **Step 2: Fill in test implementations**

Write tests for: `saveProject`, `loadProject`, `deleteProject`, `duplicateProject`, `updateProjectName`, `listProjects`. Mock `localStorage` with a simple in-memory implementation.

Key tests:
- Save and load round-trip preserves data
- Delete removes from storage and list
- Duplicate creates new entry with "Copy of" prefix
- updateProjectName changes name and updatedAt
- Quota exceeded returns `{ success: false, error: 'quota' }`

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/storage/__tests__/projectStorage.test.ts`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/storage/__tests__/projectStorage.test.ts
git commit -m "test: fill projectStorage test stubs with implementations"
```

---

## Task 24: Write tests for relativeTime and useCanvasLayers

**Files:**
- Create or modify: `src/lib/utils/__tests__/relativeTime.test.ts`
- Create: `src/hooks/__tests__/useCanvasLayers.test.ts`

- [ ] **Step 1: Write relativeTime tests**

Test edge cases: just now (< 1 min ago), minutes, hours, days, weeks, months, future dates. Test that it returns localized strings.

- [ ] **Step 2: Write useCanvasLayers unit tests**

Test `extractLayers` and `buildGroupTree` functions. These are internal but can be tested by creating mock canvas objects. Focus on:
- Flat objects produce flat layers list
- Grouped objects are flattened in extractLayers
- buildGroupTree creates proper tree with children
- `_isDocBackground` objects are filtered out
- `getObjectId` generates stable IDs

Since these are hook internals, consider exporting the pure functions for testing or testing via the hook with `renderHook`.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils/__tests__/relativeTime.test.ts src/hooks/__tests__/useCanvasLayers.test.ts
git commit -m "test: add relativeTime edge case tests and useCanvasLayers unit tests"
```

---

## Task 25: Final verification

- [ ] **Step 1: Full build check**

Run: `npx vite build 2>&1 | tail -10`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 3: Grep for remaining inline styles**

Run: `grep -rn 'style={{' src/components/dashboard/ src/components/editor/panels/LayersPanel.tsx src/App.tsx | grep -v node_modules`

Expected: Zero matches (except the LayersPanel tree depth indent which requires dynamic padding).

- [ ] **Step 4: Grep for remaining `any` casts**

Run: `grep -rn ': any' src/hooks/ src/components/ src/lib/ --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v eslint-disable`

Review: should be minimal. File-level eslint-disable-any should be gone.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "refactor: phase 5 quality pass complete — zero inline styles, DRY, full error handling"
```
