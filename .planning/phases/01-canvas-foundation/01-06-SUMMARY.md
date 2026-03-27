---
phase: 01-canvas-foundation
plan: 06
subsystem: persistence
tags: [localStorage, IndexedDB, auto-save, serialization, json-export]
dependency_graph:
  requires: ["01-02", "01-03", "01-05"]
  provides: [project-persistence, json-export, json-import, auto-save]
  affects: [editor-page, canvas-inner, header]
tech_stack:
  added: [idb@8.0.3]
  patterns: [sessionStorage-bridge, zustand-callback-pattern, try-catch-quota-error]
key_files:
  created:
    - src/lib/storage/projectStorage.ts
    - src/lib/storage/imageDb.ts
    - src/lib/fabric/serialization.ts
    - src/hooks/useAutoSave.ts
    - src/lib/storage/__tests__/projectStorage.test.ts
    - src/lib/storage/__tests__/imageDb.test.ts
    - src/lib/__tests__/serialization.test.ts
  modified:
    - src/stores/canvasStore.ts
    - src/components/editor/EditorCanvasInner.tsx
    - src/components/editor/ui/Header.tsx
    - src/app/editor/[projectId]/page.tsx
decisions:
  - "triggerSave/triggerExport/triggerImport stored as callbacks in canvasStore — Header (sibling) calls them without prop drilling, EditorCanvasInner sets them on canvas mount"
  - "Canvas JSON restore uses sessionStorage as bridge — EditorPage writes restore data, EditorCanvasInner reads and clears it on first canvas mount"
  - "CUSTOM_PROPS must be spread ([...CUSTOM_PROPS]) when passed to toDatalessJSON — TypeScript rejects readonly arrays where mutable string[] is expected"
  - "jsdom File.text() not implemented — tests polyfill it via Object.defineProperty; production code uses file.text() which works in all modern browsers"
metrics:
  duration: 12 min
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_changed: 11
---

# Phase 01 Plan 06: Persistence — Auto-save, JSON Export/Import Summary

**One-liner:** localStorage project CRUD with 30s auto-save, IndexedDB image store via idb, and JSON export/import using toDatalessJSON with all custom Fabric.js properties preserved.

## What Was Built

### Task 1: Storage Layer (TDD)

Three storage modules with 14 passing tests:

- `src/lib/storage/projectStorage.ts` — `saveProject` wraps `localStorage.setItem` in try/catch returning `{ success: false, error: 'quota' }` on `QuotaExceededError`; `loadProject`, `listProjects`, `deleteProject` using `dessy-project-` prefix and `dessy-project-list` key
- `src/lib/storage/imageDb.ts` — `storeImage`/`getImage`/`deleteImage` using `idb` library with `typeof window !== 'undefined'` SSR guard; blobs keyed by `crypto.randomUUID()`
- `src/lib/fabric/serialization.ts` — `exportProjectJSON` uses `canvas.toDatalessJSON([...CUSTOM_PROPS])` and triggers anchor download as `.dessy.json`; `importProjectJSON` validates version/canvas/meta fields before calling `canvas.loadFromJSON`

### Task 2: Auto-save Hook + Header Wiring

- `src/hooks/useAutoSave.ts` — `setInterval(30_000)`, checks `isDirty` before saving, calls `setLastSaved` on success, shows "Storage full. Export your project to free up space." toast on quota error
- `EditorCanvasInner.tsx` — marks dirty on `object:modified`, `object:added`, `object:removed`; registers `triggerSave`/`triggerExport`/`triggerImport` in canvasStore; handles canvas JSON restore from sessionStorage; renders hidden `<input type="file">` for JSON import
- `Header.tsx` — Save Project button calls `triggerSave?.()`, Export JSON calls `triggerExport?.()`, Import JSON calls `triggerImport?.()` (opens file picker)
- `EditorPage` — checks `loadProject(projectId)` on mount; if found, restores project state and writes canvas JSON to sessionStorage for EditorCanvasInner to consume

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CUSTOM_PROPS readonly incompatible with toDatalessJSON string[] parameter**
- **Found during:** Task 1 TypeScript check
- **Issue:** `CUSTOM_PROPS` is `readonly` tuple; Fabric's `toDatalessJSON` expects `string[]` (mutable)
- **Fix:** Spread operator `[...CUSTOM_PROPS]` creates a mutable copy at call sites
- **Files modified:** `src/lib/fabric/serialization.ts`, `src/hooks/useAutoSave.ts`, `EditorCanvasInner.tsx`

**2. [Rule 1 - Bug] jsdom File.text() not implemented — serialization tests fail**
- **Found during:** Task 1 test run (GREEN phase)
- **Issue:** jsdom environment lacks `File.prototype.text()` — tests using `new File([data], ...)` and calling `.text()` threw TypeError
- **Fix:** Tests polyfill via `Object.defineProperty(file, 'text', { value: () => Promise.resolve(fileData) })` — production code unchanged (modern browsers all support File.text())
- **Files modified:** `src/lib/__tests__/serialization.test.ts`

**3. [Rule 3 - Blocking] triggerImport needed in canvasStore for Header→EditorCanvasInner communication**
- **Found during:** Task 2 implementation
- **Issue:** Plan described `triggerSave`/`triggerExport` but the import file picker also needs a trigger from Header
- **Fix:** Added `triggerImport` to canvasStore alongside `triggerSave`/`triggerExport`; `setPersistFns` takes all three
- **Files modified:** `src/stores/canvasStore.ts`

## Self-Check: PASSED

All created files verified on disk. Both task commits (dd92a2d, 7540d30) confirmed in git log.
