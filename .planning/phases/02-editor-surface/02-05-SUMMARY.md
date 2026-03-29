---
phase: 02-editor-surface
plan: 05
subsystem: ui
tags: [react, zustand, sessionStorage, dnd-kit, fabric, page-management]

# Dependency graph
requires:
  - phase: 02-02
    provides: PagesPanel with thumbnail capture and DnD reorder already scaffolded
provides:
  - Pure page CRUD utility module (page-crud.ts) with sessionStorage key remapping
  - projectStore extended with addPage, duplicatePage, deletePage, reorderPages, ensureFormatPageCount
  - PagesPanel refactored to delegate all CRUD to store actions
affects: [02-06, 02-07, phase-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function extraction from component into lib/, store actions wrapping pure functions]

key-files:
  created:
    - src/lib/pages/page-crud.ts
  modified:
    - src/stores/projectStore.ts
    - src/components/editor/panels/PagesPanel.tsx

key-decisions:
  - "Pure page CRUD functions live in src/lib/pages/page-crud.ts — no React, no hooks; store actions are thin wrappers"
  - "deletePage throws 'Cannot delete the last page' at the pure function level, guarding both store and any future callers"
  - "ensureFormatPageCount uses FORMATS[format].pages — returns project unchanged for custom/unknown formats"
  - "PagesPanel thumbnail index shifting handled in component before calling deletePageAction (UI concern, not store concern)"

patterns-established:
  - "Page CRUD pattern: pure fn in lib/ → store action wrapper → component calls store action"
  - "sessionStorage key remapping always uses full re-write for reorder, shift-down for delete"

requirements-completed: [PAGE-01, PAGE-02, PAGE-03, PAGE-04]

# Metrics
duration: 12min
completed: 2026-03-29
---

# Phase 02 Plan 05: Multi-Page CRUD Summary

**Pure page CRUD utility (add/duplicate/delete/reorder/ensureFormatPageCount) extracted into src/lib/pages/page-crud.ts, projectStore extended with page actions, PagesPanel refactored to use store actions**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-29T07:00:00Z
- **Completed:** 2026-03-29T07:12:00Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- Created `src/lib/pages/page-crud.ts` with 5 pure functions handling all page CRUD with correct sessionStorage key remapping
- Extended `projectStore.ts` with `addPage`, `duplicatePage`, `deletePage`, `reorderPages`, `ensureFormatPageCount` actions
- Refactored PagesPanel from 128 lines of inline CRUD logic to 24 lines delegating to store actions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create page-crud utility and extend projectStore** - `e499855` (feat)
2. **Task 2: Wire page CRUD into PagesPanel and enhance BottomBar navigation** - `041a11e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/pages/page-crud.ts` - Pure functions: addPage, duplicatePage, deletePage, reorderPages, ensureFormatPageCount
- `src/stores/projectStore.ts` - Page CRUD actions added, imports page-crud functions
- `src/components/editor/panels/PagesPanel.tsx` - Refactored to use store actions; inline CRUD removed

## Decisions Made
- Pure functions in `src/lib/pages/page-crud.ts` — zero React, zero hooks — so they can be called from server actions or tests in future
- `deletePage` throws at pure function level (not just store) so any future caller also gets the guard
- Thumbnail index shifting kept in PagesPanel component (not in the store or pure fn) because it's a UI concern
- BottomBar already used `triggerSwitchPage` correctly — no changes needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 page requirements (PAGE-01..04) complete
- `ensureFormatPageCount` is ready for call-sites during project creation (bifold/trifold auto-create)
- Store actions return `{ newPageIndex }` / `{ newCurrentIndex }` so callers can navigate after mutation
- BottomBar and PagesPanel both route page navigation through `triggerSwitchPage` consistently

---
*Phase: 02-editor-surface*
*Completed: 2026-03-29*
