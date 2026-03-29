---
phase: 01-scaffold
plan: 02
subsystem: ui
tags: [preact, uxp, indesign, vite, file-picker, dom-access]

# Dependency graph
requires:
  - phase: 01-scaffold/01-01
    provides: Vite build, Preact entry point, manifest v5 with localFileSystem permission
provides:
  - UXP Storage file picker wrapper (openXlsxPicker, readFileAsArrayBuffer)
  - Interactive panel with InDesign DOM test and file picker test buttons
  - Verified .item(n) collection access pattern works at runtime
  - Confirmed plugin loads and panel is functional in InDesign via UDT
affects: [02-excel-parse, 03-mapping-ui, 04-fill-engine]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UXP Storage file picker via uxp.storage.localFileSystem.getFileForOpening()"
    - "InDesign DOM access via require('indesign') called inside function body (not module top-level)"
    - ".item(n) collection access — never bracket notation"
    - "No-document guard: app.documents.length === 0 check before DOM access"
    - "ESM imports in source with rollup externals for uxp/indesign — Preact bundled inline"

key-files:
  created:
    - src/utils/fileIO.js
  modified:
    - src/ui/App.jsx
    - vite.config.js

key-decisions:
  - "require('indesign') must be called inside function body, not at module top-level — avoids build-time import errors outside InDesign"
  - "Switched source from CJS require() to ESM imports after bundling investigation — uxp and indesign externalized via rollup externals, Preact bundled inline"
  - "vite.config.js relative paths required for UXP compatibility (absolute paths break plugin loading)"

patterns-established:
  - "Pattern: UXP file picker — uxp.storage.localFileSystem.getFileForOpening() returns null on cancel, File Entry on success"
  - "Pattern: InDesign DOM guard — always check app.documents.length before accessing document properties"
  - "Pattern: collection access always uses .item(n) syntax, never arr[n]"

requirements-completed: []

# Metrics
duration: ~60min (including bundling fix investigation)
completed: 2026-03-29
---

# Phase 01 Plan 02: DOM Access and File Picker Scaffold Summary

**Preact UXP panel with verified InDesign DOM access (.item(n)), UXP Storage file picker, and confirmed plugin load in InDesign via UDT — all Phase 1 platform contracts proven**

## Performance

- **Duration:** ~60 min (including post-task bundling investigation and fix)
- **Started:** 2026-03-29
- **Completed:** 2026-03-29
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 3

## Accomplishments

- Created `src/utils/fileIO.js` with `openXlsxPicker` and `readFileAsArrayBuffer` — reusable UXP Storage wrappers for Phase 2
- Rewrote `src/ui/App.jsx` with interactive test buttons for InDesign DOM access and file picker, using `.item(n)` collection patterns and no-document guard
- Fixed bundling issue post-task: switched to ESM imports and added rollup externals for `uxp`/`indesign`, ensuring Preact is bundled inline while platform APIs stay external
- All Phase 1 success criteria verified by user in InDesign — plugin loads, panel visible, DOM accessible, file picker works

## Task Commits

Each task was committed atomically:

1. **Task 1: Create fileIO utility and update App with interactive test buttons** - `94b10c2` (feat)
2. **Bundling fix (post-task deviation):** ESM + rollup externals - `9cef7f7` (fix), `5b6fcd1` (fix), `0ffbe47` (chore)
3. **Task 2: Verify plugin loads and works in InDesign via UDT** - Approved by user (no code commit — verification only)

## Files Created/Modified

- `src/utils/fileIO.js` - UXP Storage file picker (`openXlsxPicker`) and binary reader (`readFileAsArrayBuffer`) wrappers
- `src/ui/App.jsx` - Preact panel with "Test InDesign DOM" and "Test File Picker" buttons, .item(n) pattern, no-document guard
- `vite.config.js` - Switched to relative paths and added rollup externals for uxp/indesign

## Decisions Made

- `require('indesign')` called inside function body, not at module top-level — avoids errors when the bundle is evaluated outside InDesign context during UXP loading
- ESM imports used in source (not CJS require) with `rollup.external` for `uxp` and `indesign` — Preact bundled inline, platform modules left as UXP-provided externals
- Relative output paths in vite.config.js required for UXP to resolve assets correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed bundling: ESM imports + rollup externals for UXP compatibility**
- **Found during:** Post-Task 1, before human verification
- **Issue:** Plugin built with CJS require() caused Preact to not bundle correctly; uxp/indesign were being treated as Node modules instead of UXP-provided externals
- **Fix:** Switched source to ESM imports; added `rollup: { external: ['uxp', 'indesign'] }` to vite.config.js; set relative paths for output
- **Files modified:** `src/ui/App.jsx`, `src/utils/fileIO.js`, `vite.config.js`
- **Verification:** `npm run build` passes; plugin loads in InDesign via UDT with no errors
- **Committed in:** `9cef7f7`, `5b6fcd1`, `0ffbe47`

---

**Total deviations:** 1 auto-fixed (bundling/blocking issue)
**Impact on plan:** Fix was necessary for plugin to load at all — no scope creep.

## Issues Encountered

- CJS `require()` syntax conflicted with Vite's ESM bundling pipeline, causing uxp/indesign to be incorrectly resolved. Resolved by switching to ESM imports and externalizing platform modules.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 1 platform contracts proven and committed
- `src/utils/fileIO.js` is ready for Phase 2 (Excel parse) — `openXlsxPicker` returns a UXP File Entry, `readFileAsArrayBuffer` returns an ArrayBuffer for SheetJS
- `.item(n)` DOM access pattern established and verified — Phase 4 fill engine can rely on it
- No blockers for Phase 2

---
*Phase: 01-scaffold*
*Completed: 2026-03-29*
