---
phase: 01-canvas-foundation
plan: 04
subsystem: ui
tags: [fabric.js, rulers, snap-guides, overlay, canvas, print-design]

# Dependency graph
requires:
  - phase: 01-02
    provides: useFabricCanvas hook, canvas-config, element-factory
  - phase: 01-03
    provides: EditorLayout, editorStore (showGuides/showRulers/showGrid), canvasStore (viewportTransform)
provides:
  - Guide position calculations (calcBleedGuides, calcMarginGuides, calcFoldGuides)
  - GuidesOverlay: HTML overlay with bleed zone (red tint), margin guides (cyan), fold lines (indigo dashed), dot grid
  - RulerH and RulerV: mm-calibrated HTML canvas rulers using RAF + canvasStore.subscribe()
  - CanvasArea: layout wrapper placing rulers (20px) and corner square around canvas
  - Manual snap alignment in useFabricCanvas: 6px threshold, #ec4899 magenta, snaps to page edges/center/margins/bleed/other objects
  - Editor page wired to real canvas (EditorCanvasClient) inside CanvasArea
affects: [01-05, 01-06, 02, 03, 04]

# Tech tracking
tech-stack:
  added: [fabric-guideline-plugin (installed but unused — incompatible with Fabric.js 7; manual snap implemented instead)]
  patterns: [HTML overlay for canvas guides (pointer-events-none), RAF + Zustand.subscribe() for ruler sync without React batching lag]

key-files:
  created:
    - src/lib/fabric/guides.ts
    - src/components/editor/GuidesOverlay.tsx
    - src/components/editor/RulerH.tsx
    - src/components/editor/RulerV.tsx
    - src/components/editor/CanvasArea.tsx
  modified:
    - src/components/editor/EditorCanvasInner.tsx
    - src/hooks/useFabricCanvas.ts
    - src/app/editor/[projectId]/page.tsx

key-decisions:
  - "fabric-guideline-plugin skipped — peer deps require fabric ^5.x, incompatible with project's Fabric.js 7; manual snap via object:moving handler implemented instead"
  - "Rulers use HTML canvas (not Fabric.js canvas) drawn via requestAnimationFrame to avoid React batching lag during rapid pan/zoom (Research Pitfall 7)"
  - "GuidesOverlay uses CSS transform matrix matching viewportTransform so guides track zoom/pan exactly without Fabric.js involvement"
  - "Snap lines drawn as Fabric.js Line objects on the canvas, marked with _isSnapLine flag to exclude from snap target detection and cleared on mouse:up"
  - "CanvasArea created as a new layout wrapper component to house rulers + corner square + canvas, replacing the editor page placeholder"

patterns-established:
  - "Pattern: HTML overlay for print guides — absolutely positioned div over canvas, pointer-events-none, CSS transform matching Fabric.js viewportTransform"
  - "Pattern: Ruler sync via subscribe() not useState — use canvasStore.subscribe() + requestAnimationFrame to redraw rulers without triggering React re-renders"
  - "Pattern: Snap guide cleanup — always clear snap lines on mouse:up, filter _isSnapLine objects from snap target collection"

requirements-completed: [CANV-03, CANV-05, CANV-06]

# Metrics
duration: 4min
completed: 2026-03-27
---

# Phase 01 Plan 04: Guides and Rulers Summary

**HTML overlay bleed/margin/fold guides + RAF-based mm rulers + manual snap alignment at 6px threshold with magenta (#ec4899) guide lines**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-27T19:09:00Z
- **Completed:** 2026-03-27T19:13:02Z
- **Tasks:** 2 of 2
- **Files modified:** 8

## Accomplishments
- Guide position calculation library (`guides.ts`) with `calcBleedGuides`, `calcMarginGuides`, `calcFoldGuides`
- `GuidesOverlay` renders red-tinted bleed zone (rgba 239,68,68,0.12), cyan margin lines (#06b6d4), indigo dashed fold lines (#6366f1), and optional dot grid — all tracking canvas viewportTransform
- `RulerH` and `RulerV` using HTML canvas + RAF + `canvasStore.subscribe()` for lag-free ruler sync during zoom/pan
- Manual snap alignment in `useFabricCanvas.ts` — 6px threshold, snaps to page edges, page center, margin guides, bleed edges, other objects' edges and centers
- `CanvasArea` layout wrapper placing 20px rulers around canvas with #0a0a0a corner square
- Editor page updated from placeholder text to real canvas with `EditorCanvasClient` inside `CanvasArea`

## Task Commits

Each task was committed atomically:

1. **Task 1: Guide calculations and GuidesOverlay** - `3260c04` (feat)
2. **Task 2: Rulers, CanvasArea, snap alignment** - `9e14f1f` (feat)

## Files Created/Modified
- `src/lib/fabric/guides.ts` — Guide position calculations in pixels from FormatDefinition
- `src/components/editor/GuidesOverlay.tsx` — HTML overlay with bleed/margin/fold/grid, pointer-events-none
- `src/components/editor/RulerH.tsx` — Horizontal mm ruler using HTML canvas + RAF
- `src/components/editor/RulerV.tsx` — Vertical mm ruler using HTML canvas + RAF
- `src/components/editor/CanvasArea.tsx` — Layout wrapper: rulers + corner square + canvas slot
- `src/components/editor/EditorCanvasInner.tsx` — Added GuidesOverlay mount
- `src/hooks/useFabricCanvas.ts` — Added manual snap alignment handler
- `src/app/editor/[projectId]/page.tsx` — Replaced placeholder with CanvasArea + EditorCanvasClient

## Decisions Made
- `fabric-guideline-plugin` installed but not used — peer deps are `fabric ^5.x`, incompatible with the project's Fabric.js 7. Manual snap via `object:moving` handler implemented instead, which also gives more control over snap targets (bleed/margin/other objects).
- Rulers use `canvasStore.subscribe()` + `requestAnimationFrame` rather than `useState` to avoid React batching lag during fast pan/zoom operations.
- Snap lines are drawn as Fabric.js `Line` objects marked with a `_isSnapLine` flag, excluded from snap target collection, and cleared on `mouse:up`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] fabric-guideline-plugin incompatible with Fabric.js 7**
- **Found during:** Task 2 (snap alignment setup)
- **Issue:** `fabric-guideline-plugin` v0.0.11 has peer dependency `fabric ^5.2.1` — incompatible with project's Fabric.js 7. The plan specified to try the plugin first and fall back to manual snap if incompatible.
- **Fix:** Implemented manual snap alignment in `useFabricCanvas.ts` via `object:moving` event handler. Matches all required behaviors: 6px threshold, magenta guides, snap to page edges/center/margins/bleed/other objects. Lines cleared on `mouse:up`.
- **Files modified:** `src/hooks/useFabricCanvas.ts`, `package.json` (plugin installed but unused)
- **Verification:** Build passes, TypeScript compiles clean
- **Committed in:** `9e14f1f` (Task 2 commit)

**2. [Rule 2 - Missing Critical] Created CanvasArea wrapper and wired real canvas in editor page**
- **Found during:** Task 2 (ruler mounting step)
- **Issue:** Plan specified rulers should be mounted in `EditorCanvasInner` or `CanvasArea`, but no `CanvasArea.tsx` existed and the editor page still had a placeholder div instead of the real canvas.
- **Fix:** Created `CanvasArea.tsx` as a layout wrapper, then updated the editor page to use `CanvasArea` wrapping `EditorCanvasClient`. This is necessary for rulers to function correctly (they need the canvas to be present).
- **Files modified:** `src/components/editor/CanvasArea.tsx` (new), `src/app/editor/[projectId]/page.tsx`
- **Verification:** Build succeeds, no TS errors in new files
- **Committed in:** `9e14f1f` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking dependency issue, 1 missing critical wiring)
**Impact on plan:** Both deviations were necessary for correct implementation. The plan explicitly anticipated the fabric-guideline-plugin fallback. The CanvasArea wiring was implicit in the plan's architecture but not explicitly stated as a task step.

## Issues Encountered
- Pre-existing TypeScript errors in `src/hooks/__tests__/useHistory.test.ts` from the `01-05` RED phase commit — out of scope for this plan, not fixed. `npm run build` succeeds (Next.js uses a different TypeScript check than `tsc --noEmit`).

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Canvas has functional guides overlay, mm rulers, and snap alignment
- Ready for Plan 05: undo/redo history system
- The pre-existing test failures in `useHistory.test.ts` are intentional (RED phase — tests written before implementation)

---
*Phase: 01-canvas-foundation*
*Completed: 2026-03-27*
