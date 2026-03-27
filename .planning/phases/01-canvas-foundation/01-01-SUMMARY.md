---
phase: 01-canvas-foundation
plan: 01
subsystem: ui
tags: [nextjs, tailwind, typescript, zustand, fabric, jest, ts-jest]

# Dependency graph
requires: []
provides:
  - Next.js 15 app scaffolded with TypeScript, Tailwind CSS 4, dark theme
  - mm/px unit conversion library (mmToPx, pxToMm at configurable DPI)
  - Leaflet format presets (A4, A5, DL, bifold, trifold) with bleed values
  - Complete TypeScript type system: Project, Page, DesignElement union (5 variants)
  - Four Zustand stores: canvasStore, editorStore, projectStore, brandStore
  - Keyboard shortcut constants covering Tools, Canvas, Edit, File sections
  - Jest + ts-jest test framework configured with jsdom environment
  - Dashboard stub at / and editor stub at /editor/[projectId]
affects: [02-canvas-integration, 03-panels-ui, 04-dashboard, 05-ai-integration]

# Tech tracking
tech-stack:
  added:
    - next@16.2.1 (App Router, Turbopack)
    - fabric@7.2.0 (canvas, installed but not yet integrated)
    - zustand@5.0.12 (state management)
    - motion@12.38.0 (animations)
    - zundo@2.3.0 (undo/redo middleware)
    - idb@8.0.3 (IndexedDB wrapper)
    - immer@11.1.4 (immutable state helpers)
    - react-hot-toast@2.6.0 (toast notifications)
    - lucide-react@1.7.0 (icon library)
    - jest@latest + ts-jest + jest-environment-jsdom + @testing-library/react
  patterns:
    - Zustand stores as singletons exported from src/stores/
    - mm as canonical unit; px conversion at the component level via mmToPx
    - TypeScript discriminated unions via customType field on DesignElement
    - next.config.ts webpack externals for canvas (Fabric.js SSR safety)
    - Tailwind CSS 4 @theme block with --color-* design tokens
    - dark class applied at html element; @custom-variant dark pattern

key-files:
  created:
    - src/lib/units.ts - mmToPx, pxToMm, SCREEN_DPI
    - src/constants/formats.ts - FORMATS record and getFormatPixelDimensions
    - src/constants/shortcuts.ts - 30 ShortcutDef entries
    - src/types/project.ts - Project, Page, ProjectMeta, LeafletFormatId
    - src/types/elements.ts - DesignElement, TextFrame, ImageFrame, ShapeElement, ColorBlock, GroupElement
    - src/types/brand.ts - ColorSwatch, TypographyPreset
    - src/stores/canvasStore.ts - useCanvasStore
    - src/stores/editorStore.ts - useEditorStore
    - src/stores/projectStore.ts - useProjectStore
    - src/stores/brandStore.ts - useBrandStore
    - src/lib/__tests__/units.test.ts - 4 unit tests
    - src/constants/__tests__/formats.test.ts - 5 format tests
    - jest.config.ts - Jest configuration with ts-jest
    - jest.setup.ts - @testing-library/jest-dom setup
    - src/app/editor/[projectId]/page.tsx - editor stub
  modified:
    - package.json - added all Phase 1 dependencies
    - next.config.ts - added webpack externals + turbopack config
    - src/app/globals.css - Tailwind CSS 4 dark theme with custom color tokens
    - src/app/layout.tsx - Inter + JetBrains Mono fonts, dark class on html
    - src/app/page.tsx - dashboard stub

key-decisions:
  - "Turbopack is default in Next.js 16 - added empty turbopack: {} config to silence webpack config warning"
  - "ts-node required for jest.config.ts - added as dev dependency"
  - "Next.js was version 16.2.1 (not 15 as planned) - fully compatible, Turbopack is the only difference"

patterns-established:
  - "Canonical unit: mm in all design data, mmToPx() only at render/display boundaries"
  - "Zustand store naming: use{StoreName}Store pattern, one slice per concern"
  - "TDD with ts-jest: write failing tests first, implement, verify GREEN before committing feat"
  - "TypeScript discriminated unions: customType field narrows DesignElement to specific variant"

requirements-completed:
  - CANV-01
  - UXSH-01

# Metrics
duration: 6min
completed: 2026-03-27
---

# Phase 01 Plan 01: Next.js Scaffold and Foundation Summary

**Next.js 16 app with Tailwind CSS 4 dark theme, 4 Zustand stores, mm/px unit system, format presets, and Jest+ts-jest test framework — all 9 unit tests passing, TypeScript clean**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-27T18:48:42Z
- **Completed:** 2026-03-27T18:54:23Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Next.js 16 (App Router, Turbopack) scaffolded with all Phase 1 dependencies installed including fabric, zustand, motion, zundo, idb, immer, react-hot-toast, lucide-react
- Dark theme established via Tailwind CSS 4 @theme block with 11 custom color tokens; Inter + JetBrains Mono loaded via next/font/google
- Complete TypeScript type system: 5-variant DesignElement union, Project/Page/ProjectMeta, ColorSwatch/TypographyPreset, 30 keyboard shortcut definitions
- 4 Zustand stores (canvas, editor, project, brand) covering all state described in CLAUDE.md
- mm/px unit conversion library and format presets with 9 passing Jest tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project, install dependencies, configure dark theme and routing** - `b8380fc` (feat)
2. **Task 2: RED phase - failing unit and format tests** - `2ea3b59` (test)
3. **Task 2: GREEN phase - type system, unit conversion, format constants, Zustand stores** - `fdbe48c` (feat)

_Note: TDD task 2 produced two commits (test → feat)_

## Files Created/Modified
- `src/lib/units.ts` - mmToPx, pxToMm, SCREEN_DPI exports (72dpi screen default)
- `src/constants/formats.ts` - FORMATS record (A4/A5/DL/bifold/trifold) + getFormatPixelDimensions
- `src/constants/shortcuts.ts` - 30 ShortcutDef entries for all keyboard shortcuts
- `src/types/project.ts` - Project, Page, ProjectMeta, LeafletFormatId types
- `src/types/elements.ts` - DesignElement union with TextFrame, ImageFrame, ShapeElement, ColorBlock, GroupElement
- `src/types/brand.ts` - ColorSwatch, TypographyPreset types
- `src/stores/canvasStore.ts` - Canvas state (activeTool, zoom, selectedObjectIds, viewportTransform)
- `src/stores/editorStore.ts` - Editor UI state (showGrid, showRulers, showGuides, panel open states)
- `src/stores/projectStore.ts` - Project state (currentProject, projectList, isDirty, lastSaved)
- `src/stores/brandStore.ts` - Brand state (brandColors, typographyPresets)
- `src/lib/__tests__/units.test.ts` - 4 unit tests for mm/px conversion
- `src/constants/__tests__/formats.test.ts` - 5 tests for format presets
- `src/app/globals.css` - Tailwind CSS 4 dark theme with @custom-variant dark
- `src/app/layout.tsx` - Inter + JetBrains Mono fonts, dark class on html element
- `src/app/page.tsx` - Dashboard stub
- `src/app/editor/[projectId]/page.tsx` - Editor stub with 'use client' directive
- `next.config.ts` - webpack canvas externals + empty turbopack config
- `jest.config.ts` - ts-jest config with jsdom, @/* alias, setupFilesAfterEnv
- `jest.setup.ts` - @testing-library/jest-dom import

## Decisions Made
- **Next.js 16 vs 15**: create-next-app installed Next.js 16.2.1 (latest). Fully compatible; only difference is Turbopack is default instead of webpack. Added `turbopack: {}` to next.config.ts to satisfy Next.js requirement when webpack config also present.
- **ts-node required**: jest.config.ts in TypeScript format requires ts-node. Added as dev dependency (Rule 3 auto-fix).
- **Canonical mm units**: All design data stored in mm; px conversion happens only at render boundaries via mmToPx(). This makes export to print formats straightforward.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js 16 Turbopack conflict with webpack config**
- **Found during:** Task 1 (build verification)
- **Issue:** Next.js 16 enables Turbopack by default and raises an error when a webpack config exists without a turbopack config
- **Fix:** Added `turbopack: {}` to next.config.ts to resolve the conflict while keeping webpack externals for canvas
- **Files modified:** next.config.ts
- **Verification:** `npm run build` exits 0
- **Committed in:** b8380fc (Task 1 commit)

**2. [Rule 3 - Blocking] ts-node missing for jest.config.ts**
- **Found during:** Task 2 (first jest run)
- **Issue:** Jest requires ts-node to parse TypeScript config files; it was not in package.json
- **Fix:** `npm install -D ts-node`
- **Files modified:** package.json, package-lock.json
- **Verification:** Jest runs successfully
- **Committed in:** 2ea3b59 (Task 2 RED commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking)
**Impact on plan:** Both were necessary infrastructure fixes. No scope creep.

## Issues Encountered
- create-next-app refused the name "Dessy" due to npm naming restrictions (capital letters). Worked around by creating in /tmp/dessy-init and copying files to the project directory.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All types, stores, and unit system ready for canvas integration (Plan 02)
- Fabric.js installed and webpack-externaled, ready for dynamic import
- Test framework configured and passing — follow TDD for Plan 02 canvas components

---
*Phase: 01-canvas-foundation*
*Completed: 2026-03-27*
