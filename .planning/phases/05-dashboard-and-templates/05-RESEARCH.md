# Phase 5: Dashboard and Templates - Research

**Researched:** 2026-03-29
**Domain:** React dashboard UI, project management, Fabric.js canvas thumbnails, template bundling
**Confidence:** HIGH

## Summary

Phase 5 replaces the current `WelcomeScreen` with a full project dashboard (Figma/Canva-style) and adds a template gallery. The foundational storage layer is already complete: `projectStorage.ts` provides `saveProject`, `loadProject`, `listProjects`, and `deleteProject`. `imageDb.ts` (IndexedDB via `idb`) provides the pattern for blob storage that will be extended for thumbnails. The project's Zustand-based state management, inline-style component patterns, and `motion/react` animation library are all ready to use.

The core engineering challenges in this phase are: (1) wiring Zustand `currentView` state into `App.tsx` to replace URL-param-based routing, (2) generating and persisting PNG thumbnails on save using the existing Fabric.js `toDataURL()` pattern from `PagesPanel.tsx`, and (3) bundling 10 template JSON files as static assets. No new external libraries are needed — everything required is already installed.

**Primary recommendation:** Build the dashboard as a new top-level view component (`Dashboard.tsx`) rendered conditionally by `App.tsx` based on a `currentView` field added to `editorStore`. Extend `projectStorage.ts` with a `duplicateProject` function. Add thumbnail storage to `imageDb.ts` using a separate object store. Bundle templates as static JSON files imported at build time.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Card grid layout (responsive) — visual, like Figma/Canva home
- Each card shows: canvas thumbnail, project name, format badge (A4/DL/etc.), relative time ("2 min ago"), page count, 3-dot menu on hover
- 3-dot menu actions: Rename, Duplicate, Delete
- Projects sorted by last-edited (updatedAt) by default
- Thumbnails generated as PNG snapshots on save, stored in IndexedDB
- Friendly illustration + "Create your first leaflet" CTA button for empty state
- Show template suggestions below the CTA in empty state
- Template gallery: category tabs (All, Sale, Event, Restaurant, Real Estate, Corporate, Fitness, Beauty, Education)
- Click template opens preview modal with larger preview, name, category, format info, and "Use This Template" button
- 10 starter templates (minimum), ~1-2 per category
- Templates bundled as static JSON files (serialized Fabric.js canvas state per TMPL-02)
- Dashboard is the app's home/landing page — WelcomeScreen is removed
- Simple state-based view switching via Zustand `currentView` (dashboard | editor) — no router library
- Clicking the "Dessy" logo in the editor header returns to dashboard (auto-saves first)
- "New Leaflet" button on dashboard opens a format picker modal
- Modal has two tabs: "Blank" (format cards: A4, A5, DL, Bifold, Trifold, Custom) and "Templates" (gallery)
- Format picker is format-only — creation modes (manual/AI/photo/sketch) remain inside editor header

### Claude's Discretion
- Dashboard header design and branding
- Card hover effects and animations
- Template preview modal exact layout
- Illustration choice for empty state

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DASH-01 | User can see a grid of saved projects with thumbnails, titles, last-edited dates, and format badges | `listProjects()` returns `ProjectMeta[]`; thumbnail stored in IndexedDB under `dessy-thumbnails` store using project id as key |
| DASH-02 | User can create new project via "New Leaflet" button with format picker modal | `FORMATS` constant from `src/constants/formats.ts` provides all format definitions; new project creation follows existing pattern in `App.tsx` |
| DASH-03 | User can delete, duplicate, and rename projects | `deleteProject()` exists; `duplicateProject()` must be added to `projectStorage.ts`; rename = update meta name + re-save `PROJECT_LIST_KEY` |
| DASH-04 | User can start a new project from a template in the template gallery | Templates are static JSON imported at build time; "Use This Template" deep-copies JSON, assigns new project ID, saves via `saveProject()`, then opens editor |
| TMPL-01 | Template gallery has 10-20 starter templates across 8 categories | Static JSON files in `src/templates/` directory, one per template; category metadata in a `templates-index.ts` manifest |
| TMPL-02 | Templates stored as serialized Fabric.js canvas state (JSON) | Fabric.js `canvas.toJSON([...CUSTOM_PROPS])` format — identical to what `saveProject` already persists as `canvasJSON` |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.12 | `currentView` state, `dashboardStore` or extension of `editorStore` | Already the app's state management system |
| idb | ^8.0.3 | IndexedDB thumbnail blob storage | Already used in `imageDb.ts` for generated images |
| motion/react | ^12.38.0 | Card hover animations, modal entrance/exit | Already used in `EditorLayout.tsx` and `KeyboardShortcutsModal.tsx` |
| lucide-react | ^1.7.0 | Dashboard icons (MoreVertical, Plus, Trash2, Copy, Edit2) | Already the icon system |
| react-i18next | ^17.0.1 | All user-facing strings | Required for all text per project convention |
| fabric | ^7.2.0 | Thumbnail generation via `canvas.toDataURL()` | Already used; same `toDataURL()` pattern from `PagesPanel.tsx` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns OR Intl.RelativeTimeFormat | built-in | Relative timestamps ("2 min ago") | `Intl.RelativeTimeFormat` is built-in, no install needed |

**No new dependencies required.** All needed libraries are already installed.

**Version verification (confirmed at research time):**
- All packages confirmed via `package.json` — no additional npm view needed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── dashboard/
│   │   ├── Dashboard.tsx              # Top-level dashboard view
│   │   ├── ProjectGrid.tsx            # Responsive card grid
│   │   ├── ProjectCard.tsx            # Individual project card with 3-dot menu
│   │   ├── EmptyState.tsx             # Illustration + CTA + template suggestions
│   │   ├── NewLeafletModal.tsx        # Format picker (Blank + Templates tabs)
│   │   └── TemplateGallery.tsx        # Category tabs + template cards + preview modal
│   └── editor/  (existing)
├── lib/
│   ├── storage/
│   │   ├── projectStorage.ts          # ADD: duplicateProject(), updateProjectMeta()
│   │   └── thumbnailDb.ts             # NEW: IndexedDB store for project thumbnails
│   └── templates/
│       └── templates-index.ts         # Template manifest (id, name, category, format, previewUrl)
├── templates/                         # NEW: static JSON template files
│   ├── sale-flyer-01.json
│   ├── event-poster-01.json
│   └── ... (10+ files)
└── stores/
    └── appStore.ts                    # NEW: currentView ('dashboard' | 'editor'), activeProjectId
```

### Pattern 1: View Switching Without Router
**What:** A `appStore.ts` (or extension of `editorStore`) holds `currentView: 'dashboard' | 'editor'` and `activeProjectId: string | null`. `App.tsx` renders conditionally.
**When to use:** Always — this is the locked decision.
**Example:**
```typescript
// src/stores/appStore.ts
import { create } from 'zustand';

interface AppState {
  currentView: 'dashboard' | 'editor';
  activeProjectId: string | null;
  openProject: (projectId: string) => void;
  goToDashboard: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  activeProjectId: null,
  openProject: (projectId) => set({ currentView: 'editor', activeProjectId: projectId }),
  goToDashboard: () => set({ currentView: 'dashboard', activeProjectId: null }),
}));
```

```typescript
// src/App.tsx — simplified root switch
const currentView = useAppStore((s) => s.currentView);
const activeProjectId = useAppStore((s) => s.activeProjectId);

if (currentView === 'dashboard') return <Dashboard />;
return <EditorRoot projectId={activeProjectId!} />;
```

**Critical:** `App.tsx` currently reads `id` and `format` from URL params — this entire block must be replaced. The dashboard passes `projectId` directly via `openProject()`. New projects get `id = crypto.randomUUID()` generated at creation time in the dashboard.

### Pattern 2: Thumbnail Generation on Save
**What:** After each manual save (triggerSave) and auto-save, capture `canvas.toDataURL()` and store the result in IndexedDB under the project ID.
**When to use:** Every save operation — both manual (Header Save button) and auto-save (useAutoSave).
**Example:**
```typescript
// src/lib/storage/thumbnailDb.ts
import { openDB } from 'idb';

const DB_NAME = 'dessy-thumbnails';
const STORE_NAME = 'thumbnails';

const dbPromise = typeof window !== 'undefined'
  ? openDB(DB_NAME, 1, {
      upgrade(db) { db.createObjectStore(STORE_NAME); },
    })
  : null;

export async function saveThumbnail(projectId: string, dataUrl: string): Promise<void> {
  // Convert dataUrl to blob for efficient IndexedDB storage
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const db = await dbPromise!;
  await db.put(STORE_NAME, blob, projectId);
}

export async function getThumbnail(projectId: string): Promise<string | null> {
  const db = await dbPromise!;
  const blob = await db.get(STORE_NAME, projectId);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function deleteThumbnail(projectId: string): Promise<void> {
  const db = await dbPromise!;
  await db.delete(STORE_NAME, projectId);
}
```

Thumbnail capture uses the **same pattern** as `PagesPanel.captureCurrentThumbnail()` — temporarily remove `before:render` AligningGuidelines listener, call `canvas.toDataURL({ multiplier: 0.15, format: 'jpeg', quality: 0.6 })`, then restore listener.

### Pattern 3: Template Bundling
**What:** Templates are static JSON files imported at build time via Vite's static asset handling.
**When to use:** Always — locked decision (TMPL-02).
**Example:**
```typescript
// src/lib/templates/templates-index.ts
export interface TemplateEntry {
  id: string;
  name: string;
  category: 'Sale' | 'Event' | 'Restaurant' | 'Real Estate' | 'Corporate' | 'Fitness' | 'Beauty' | 'Education';
  format: 'A4' | 'A5' | 'DL' | 'bifold' | 'trifold';
  pageCount: number;
  previewDataUrl?: string; // optional — can be rendered on first load
}

// Template JSON files imported directly (Vite handles static JSON imports)
import saleFlyer01 from '@/templates/sale-flyer-01.json';
export const TEMPLATES: Array<TemplateEntry & { canvasJSON: object }> = [
  { id: 'sale-flyer-01', name: 'Sale Flyer', category: 'Sale', format: 'A4', pageCount: 1, canvasJSON: saleFlyer01 },
  // ...
];
```

**Template JSON structure** — same as `saveProject` `canvasJSON` field (Fabric.js `canvas.toJSON([...CUSTOM_PROPS])`). A template is opened by deep-copying, assigning a new project ID, calling `saveProject()`, then `openProject(newId)`.

### Pattern 4: Duplicate Project
**What:** Load project JSON from localStorage, assign new ID and name ("Copy of X"), save under new key.
**When to use:** "Duplicate" in the 3-dot menu.
**Example:**
```typescript
// Addition to src/lib/storage/projectStorage.ts
export function duplicateProject(sourceId: string): string | null {
  const source = loadProject(sourceId);
  if (!source) return null;
  const newId = crypto.randomUUID();
  const newMeta: ProjectMeta = {
    ...source.meta,
    id: newId,
    name: `Copy of ${source.meta.name}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveProject(newId, { ...source, meta: newMeta });
  return newId;
}
```

### Pattern 5: Relative Time Formatting
**What:** Display "2 min ago", "3 days ago" using `Intl.RelativeTimeFormat` — no library needed.
**When to use:** Project card last-edited display.
**Example:**
```typescript
export function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (seconds < 60) return rtf.format(-seconds, 'second');
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour');
  return rtf.format(-Math.floor(seconds / 86400), 'day');
}
```

### Anti-Patterns to Avoid
- **Creating a new Zustand store for every concern:** Add `currentView` and `activeProjectId` to a single new `appStore` — not spread across `editorStore`, `projectStore`, etc.
- **Storing thumbnail dataUrls in localStorage:** DataURLs are large (50–200KB each). Store blobs in IndexedDB via `thumbnailDb.ts`. `localStorage` will hit the 5MB quota quickly with thumbnails.
- **Importing template JSON in a giant manifest array:** Keep each template as a separate JSON file imported individually so Vite can tree-shake and bundle efficiently.
- **Generating thumbnails off-screen during dashboard load:** Thumbnails should already be stored from save time. Do not render a Fabric.js canvas during dashboard rendering — only read stored thumbnails from IndexedDB.
- **Using router library:** Locked decision is state-based switching via Zustand. Do not introduce `react-router-dom` or `next/navigation`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Thumbnail generation | Custom canvas-to-PNG pipeline | `canvas.toDataURL()` — same as PagesPanel.tsx lines 242–247 | Already battle-tested with AligningGuidelines workaround |
| Blob storage | Custom IndexedDB wrapper | `openDB` from `idb` — same pattern as `imageDb.ts` | Already handles upgrade, versioning, promises |
| Animation on card hover | Custom CSS keyframes | `motion/react` — already imported in codebase | Consistent with EditorLayout and KeyboardShortcutsModal |
| Modal backdrop/dismiss | Custom focus trap | Inline `position: fixed; inset: 0` pattern — already in Header.tsx clear confirm dialog | Project pattern is settled; no dedicated modal library needed |
| Relative timestamps | date-fns | `Intl.RelativeTimeFormat` (built-in) | Zero bytes added, covers all needed cases |

**Key insight:** This phase is primarily UI composition. All the hard infrastructure (storage, canvas, state) already exists. The implementation risk is in correctly wiring the view switching without breaking the existing editor.

---

## Common Pitfalls

### Pitfall 1: URL params vs. state-based routing conflict
**What goes wrong:** `App.tsx` currently reads `?id=` and `?format=` from URL params on mount (line 43). If not removed, the dashboard-created project gets overridden by a stale URL.
**Why it happens:** URL params were the original routing mechanism before the dashboard existed.
**How to avoid:** The `App.tsx` `useEffect` that reads `window.location.search` must be completely replaced. The dashboard view passes `projectId` via `useAppStore.getState().openProject(id)`.
**Warning signs:** Projects open with wrong format or reload "default" project ID.

### Pitfall 2: AligningGuidelines crash in thumbnail generation
**What goes wrong:** `canvas.toDataURL()` internally creates a temporary canvas; the AligningGuidelines plugin's `before:render` listener tries to access an overlay context that doesn't exist on temp canvases — throws a runtime error.
**Why it happens:** `fabric-guideline-plugin` hooks `before:render` event globally.
**How to avoid:** Follow the exact pattern from `PagesPanel.tsx` lines 237–250: save listeners, clear them, call `toDataURL()`, restore. Use a try/finally block.
**Warning signs:** `Cannot read properties of undefined (reading 'getContext')` errors during save.

### Pitfall 3: Object URL memory leaks from getThumbnail
**What goes wrong:** `URL.createObjectURL(blob)` creates a URL that must be revoked when the component unmounts, otherwise memory accumulates with each project list render.
**Why it happens:** Blob URLs are not garbage-collected automatically.
**How to avoid:** In `ProjectCard`, call `URL.revokeObjectURL(url)` in the `useEffect` cleanup:
```typescript
useEffect(() => {
  let objectUrl: string | null = null;
  getThumbnail(projectId).then((url) => { objectUrl = url; setThumbUrl(url); });
  return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
}, [projectId]);
```
**Warning signs:** Memory usage grows each time dashboard is opened.

### Pitfall 4: Stale projectList after mutations
**What goes wrong:** After rename, delete, or duplicate, the dashboard still shows the old list.
**Why it happens:** `listProjects()` reads from localStorage synchronously; `projectStore.projectList` is not automatically updated after mutations.
**How to avoid:** After every mutation (delete/duplicate/rename), call `useProjectStore.getState().setProjectList(listProjects())` to refresh. Better: create a `refreshProjectList()` action in projectStore.
**Warning signs:** Dashboard shows deleted or pre-rename project cards until full page reload.

### Pitfall 5: i18n keys missing for new strings
**What goes wrong:** Dashboard strings are hardcoded in English, bypassing `react-i18next`.
**Why it happens:** Easy to forget during rapid UI development.
**How to avoid:** Add all dashboard + template strings to `en.json` and `bg.json` before or during component build. Follow existing key naming convention (e.g., `"dashboard": { "newLeaflet": "New Leaflet", ... }`).
**Warning signs:** Missing translation warnings in console; Bulgarian locale breaks.

### Pitfall 6: Template JSON files with base64-embedded images
**What goes wrong:** Template canvas JSON includes inline base64 image data, making each JSON file 1–5MB. This bloats the app bundle.
**Why it happens:** If templates are created by saving a project that has uploaded images, those images get embedded.
**How to avoid:** Templates should use image placeholder elements (`customType: 'imagePlaceholder'`) rather than real embedded images. Use `canvas.toDatalessJSON([...CUSTOM_PROPS])` (not `toJSON`) to exclude image data when creating template files.
**Warning signs:** `src/templates/*.json` files larger than ~200KB.

---

## Code Examples

Verified patterns from existing codebase:

### Thumbnail Capture (from PagesPanel.tsx)
```typescript
// Source: src/components/editor/panels/PagesPanel.tsx lines 220-252
const canvas = useCanvasStore.getState().canvasRef;
if (!canvas) return;

const bgRect = canvas.getObjects().find((o: any) => o._isDocBackground);
const left = bgRect?.left ?? 0;
const top = bgRect?.top ?? 0;
const width = (bgRect?.width ?? 595) * (bgRect?.scaleX ?? 1);
const height = (bgRect?.height ?? 842) * (bgRect?.scaleY ?? 1);

const listeners = (canvas as any).__eventListeners?.['before:render'];
if (listeners) (canvas as any).__eventListeners['before:render'] = [];
let dataUrl: string;
try {
  dataUrl = canvas.toDataURL({
    left, top, width, height,
    multiplier: 0.15,
    format: 'jpeg',
    quality: 0.6,
  });
} finally {
  if (listeners) (canvas as any).__eventListeners['before:render'] = listeners;
}
```

### IndexedDB Storage Pattern (from imageDb.ts)
```typescript
// Source: src/lib/storage/imageDb.ts
import { openDB } from 'idb';
const dbPromise = typeof window !== 'undefined'
  ? openDB('dessy-thumbnails', 1, {
      upgrade(db) { db.createObjectStore('thumbnails'); },
    })
  : null;
```

### Save Project (from projectStorage.ts)
```typescript
// Source: src/lib/storage/projectStorage.ts
export function saveProject(
  projectId: string,
  data: { meta: ProjectMeta; canvasJSON: object; pageData: object; brandData?: object }
): SaveResult { ... }
```

### Format Definitions (from constants/formats.ts)
```typescript
// Source: src/constants/formats.ts
export const FORMATS: Record<string, FormatDefinition> = {
  A4:      { widthMm: 210, heightMm: 297, bleedMm: 3, pages: 1, label: 'A4 Single' },
  A5:      { widthMm: 148, heightMm: 210, bleedMm: 3, pages: 1, label: 'A5' },
  DL:      { widthMm: 99,  heightMm: 210, bleedMm: 3, pages: 1, label: 'DL' },
  bifold:  { widthMm: 420, heightMm: 297, bleedMm: 3, pages: 2, label: 'A4 Bifold' },
  trifold: { widthMm: 630, heightMm: 297, bleedMm: 3, pages: 3, label: 'A4 Trifold' },
};
```

### Inline Modal Pattern (from Header.tsx — clear canvas confirmation)
```typescript
// Source: src/components/editor/ui/Header.tsx lines 299-370
{showModal && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}
       onClick={() => setShowModal(false)}>
    <div onClick={(e) => e.stopPropagation()}
         style={{ background: '#141414', border: '1px solid #2a2a2a',
                  borderRadius: '12px', padding: '24px', width: '360px' }}>
      {/* modal content */}
    </div>
  </div>
)}
```

### Motion Animation Pattern (from EditorLayout.tsx)
```typescript
// Source: src/components/editor/EditorLayout.tsx
import { AnimatePresence, motion } from 'motion/react';
// Panel slide animation:
<motion.div
  initial={{ x: -240, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: -240, opacity: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| URL params (`?id=&format=`) for project opening | Zustand `currentView` + `activeProjectId` | Phase 5 (this phase) | App.tsx useEffect must be fully replaced |
| WelcomeScreen as landing | Dashboard as landing | Phase 5 (this phase) | WelcomeScreen.tsx deleted; Dashboard.tsx replaces it |
| No project thumbnails | IndexedDB thumbnail on save | Phase 5 (this phase) | New `thumbnailDb.ts` + save hook integration |

**Deprecated/outdated:**
- `WelcomeScreen.tsx`: Replaced by `Dashboard.tsx` in this phase — delete after dashboard is complete
- URL param routing in `App.tsx` (`window.location.search` parse block): Replaced by `appStore` view state

---

## Open Questions

1. **Template JSON creation workflow**
   - What we know: Templates must be Fabric.js canvas JSON matching the `canvasJSON` field format from `saveProject`
   - What's unclear: Who creates the 10 template files? Manual creation via the editor + export is the practical path, but the planner needs to decide if placeholder templates (minimal JSON with colored blocks) count for TMPL-01, or if realistic layouts are required for v1
   - Recommendation: Create minimal but visually distinct placeholder templates using basic Fabric.js objects (colored rectangles, text frames) — avoids embedding images, keeps JSON small, satisfies TMPL-02

2. **"Custom" format in New Leaflet modal**
   - What we know: CONTEXT.md lists "Custom" as one of the format cards in the Blank tab
   - What's unclear: Custom format requires width/height inputs — is this in scope for this phase or does clicking "Custom" just open the editor with a default size?
   - Recommendation: Custom format card opens a simple dimension input form (mm values, numeric inputs) within the modal before creating the project. Use the existing `custom` FormatId which has no fixed dimensions in `formats.ts`.

3. **Thumbnail display before first save**
   - What we know: New projects have no stored thumbnail until first save
   - What's unclear: Should the dashboard show a placeholder card or wait for save?
   - Recommendation: Show a format-colored placeholder (matching accent color `#6366f1`) with the format label until a real thumbnail exists.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 + ts-jest + jsdom |
| Config file | `jest.config.ts` (project root) |
| Quick run command | `npx jest --testPathPattern="dashboard\|thumbnail\|projectStorage" --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | `listProjects()` returns sorted list with correct meta | unit | `npx jest --testPathPattern="projectStorage" -x` | ❌ Wave 0 |
| DASH-02 | New project created with correct ID, format, and name | unit | `npx jest --testPathPattern="projectStorage" -x` | ❌ Wave 0 |
| DASH-03 | `duplicateProject()` creates copy with new ID and "Copy of" prefix | unit | `npx jest --testPathPattern="projectStorage" -x` | ❌ Wave 0 |
| DASH-03 | `deleteProject()` removes from list and storage | unit | `npx jest --testPathPattern="projectStorage" -x` | ❌ Wave 0 |
| DASH-04 | Template open creates new project, saves to storage, returns new ID | unit | `npx jest --testPathPattern="templates" -x` | ❌ Wave 0 |
| TMPL-01 | TEMPLATES array has >= 10 entries, covers all 8 categories | unit | `npx jest --testPathPattern="templates-index" -x` | ❌ Wave 0 |
| TMPL-02 | Each template entry has `canvasJSON` with `objects` array | unit | `npx jest --testPathPattern="templates-index" -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="projectStorage\|templates" --passWithNoTests`
- **Per wave merge:** `npx jest --passWithNoTests`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/storage/__tests__/projectStorage.test.ts` — covers DASH-01, DASH-02, DASH-03
- [ ] `src/lib/templates/__tests__/templates-index.test.ts` — covers TMPL-01, TMPL-02
- [ ] `src/lib/storage/__tests__/thumbnailDb.test.ts` — covers thumbnail store/retrieve (IndexedDB mock needed)

*(Dashboard React component tests are manual-only — visual grid, hover states, and modal flows are not suitable for jsdom unit testing given the project's existing test approach)*

---

## Sources

### Primary (HIGH confidence)
- `src/lib/storage/projectStorage.ts` — full project CRUD API surface, localStorage keys
- `src/lib/storage/imageDb.ts` — IndexedDB pattern via `idb` library
- `src/components/editor/panels/PagesPanel.tsx` (lines 220-252) — exact thumbnail capture pattern with AligningGuidelines workaround
- `src/App.tsx` — current URL param routing that must be replaced
- `src/stores/editorStore.ts` — Zustand store pattern; `currentView` follows same shape
- `src/constants/formats.ts` — all format definitions for format picker
- `src/types/project.ts` — `ProjectMeta` type (id, name, format, createdAt, updatedAt)
- `package.json` — confirmed all required libraries already installed

### Secondary (MEDIUM confidence)
- `src/components/editor/ui/Header.tsx` (inline modal pattern) — confirmed inline style + fixed overlay approach
- `src/components/editor/EditorLayout.tsx` — `motion/react` animation patterns (AnimatePresence, motion.div)
- `src/lib/export/raster-export.ts` (lines 18-60) — off-screen Fabric canvas pattern for reference

### Tertiary (LOW confidence)
- None — all findings verified from codebase directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in package.json, no new installs needed
- Architecture: HIGH — view switching, storage, and thumbnail patterns all verified from existing code
- Pitfalls: HIGH — AligningGuidelines crash confirmed in two existing files; URL param conflict is visible in App.tsx; ObjectURL leak is a known Blob URL hazard

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable codebase — no fast-moving dependencies)
