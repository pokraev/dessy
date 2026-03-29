---
phase: 02-editor-surface
plan: 03
subsystem: properties-panel
tags: [properties, fabric, canvas, fill, stroke, shadow, position]
dependency_graph:
  requires:
    - 02-01 (useSelectedObject hook, NumberInput, ColorPicker)
    - src/stores/canvasStore
    - src/stores/projectStore
    - src/lib/units
    - src/constants/formats
  provides:
    - PropertiesPanel (context-sensitive section rendering)
    - PositionSection (X/Y/W/H mm inputs, aspect lock, rotation, opacity, corner radius)
    - FillSection (solid/gradient/none, Fabric.js Gradient class, 8-direction gradient)
    - StrokeSection (color/width/style with toggle)
    - ShadowSection (toggle on/off, uses Fabric.js Shadow class)
    - FitModeSection (fill/fit/stretch for images)
    - PageSection (document background color, format info)
  affects:
    - Editor right panel rendering
    - Canvas object property writes
tech_stack:
  added: []
  patterns:
    - updateCanvasObject helper pattern: getState().canvasRef -> obj.set -> setCoords -> renderAll -> fire
    - Aspect ratio lock via local useState (not in store)
    - Shadow/Gradient constructed via Fabric.js class instances (not plain objects)
    - PageSection updates both projectStore and canvas.backgroundColor
key_files:
  created:
    - src/components/editor/panels/sections/PositionSection.tsx
    - src/components/editor/panels/sections/FillSection.tsx
    - src/components/editor/panels/sections/StrokeSection.tsx
    - src/components/editor/panels/sections/ShadowSection.tsx
    - src/components/editor/panels/sections/FitModeSection.tsx
    - src/components/editor/panels/sections/PageSection.tsx
  modified:
    - src/components/editor/panels/PropertiesPanel.tsx
decisions:
  - "canvas.fire('object:modified', ...) uses 'as any' to match Fabric.js 7 strict event types — same pattern as TypographySection.tsx"
  - "pxToMm removed from PositionSection import — snapshot values already in mm from useSelectedObject hook"
  - "Gradient imported directly from fabric at top level (not dynamically) — client-only component with canvas external"
metrics:
  duration: 22
  completed: "2026-03-29"
  tasks_completed: 2
  files_created: 7
---

# Phase 02 Plan 03: Properties Panel Sections Summary

**One-liner:** Context-sensitive properties panel with 6 sections using Fabric.js Shadow/Gradient classes, mm-based inputs, and direct canvas write-back.

## Tasks Completed

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | Create 6 property section components | 790f221 | sections/*.tsx (6 new files) |
| 2 | Rewrite PropertiesPanel with context-sensitive rendering | 0a512d0 | PropertiesPanel.tsx |

## What Was Built

### Section Components

**PositionSection** (`src/components/editor/panels/sections/PositionSection.tsx`)
- X/Y/W/H inputs with mm units, step 0.5
- AspectLockButton (Link/Link2Off from lucide-react) stores state locally
- W/H use scaleX/scaleY writes (preserves base dimensions)
- Rotation input (deg, 0-360)
- Opacity: synchronized range slider (accentColor #6366f1) + NumberInput
- Corner radius input shown only for `type === 'shape'`
- Multi-selection: disabled inputs showing "--"

**FillSection** (`src/components/editor/panels/sections/FillSection.tsx`)
- Solid mode: ColorPicker with swatchId write-back
- Gradient mode (shape/colorBlock only): two ColorPickers for stops, 8-angle direction picker
- Gradient built via `new Gradient({ type: 'linear', gradientUnits: 'percentage', ... })`
- None mode: clears fill with `updateCanvasObject({ fill: '' })`

**StrokeSection** (`src/components/editor/panels/sections/StrokeSection.tsx`)
- Toggle switch on/off in section header
- Color, width, style (Solid/Dashed/Dotted) controls
- strokeDashArray: null (solid), [8,4] (dashed), [2,2] (dotted)

**ShadowSection** (`src/components/editor/panels/sections/ShadowSection.tsx`)
- Toggle switch, collapses when off
- X offset, Y offset, blur, color controls
- Uses `new Shadow({ offsetX, offsetY, blur, color })` — not plain object

**FitModeSection** (`src/components/editor/panels/sections/FitModeSection.tsx`)
- Only renders when `snapshot.type === 'image'`
- Fill/Fit/Stretch button group, writes fitMode to canvas

**PageSection** (`src/components/editor/panels/sections/PageSection.tsx`)
- Document heading + format label/dimensions
- Background color picker updates both projectStore and canvas.backgroundColor

### PropertiesPanel Rewrite

Replaced Phase 1 placeholder with context-sensitive rendering:
- Nothing selected (0): `<PageSection />`
- Multi-selection (>1): "Multiple selected" + `<PositionSection />`
- Text (1): Position + Fill (Typography placeholder for Plan 04)
- Shape (1): Position + Fill + Stroke + Shadow
- Image (1): Position + FitMode
- ColorBlock (1): Position + Fill

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written.

### Pattern Adjustment (Rule 2 - Correctness)

**Moved useCallback before early return in PageSection**
- Found during: Task 1 (PageSection)
- Issue: Original draft placed `useCallback` after `if (!currentProject) return null` — violates Rules of Hooks
- Fix: Moved `currentPageIndex` derivation and `handleBgChange` callback above the guard
- Files modified: src/components/editor/panels/sections/PageSection.tsx

**Used `as any` for canvas.fire() type casting**
- Found during: Task 1 (all sections)
- Issue: Fabric.js 7 strict event types require exact typing for `fire('object:modified', ...)`
- Fix: Applied `canvas.fire('object:modified', { target: obj } as any)` — matches existing pattern in TypographySection.tsx

## Self-Check: PASSED

Files exist:
- FOUND: src/components/editor/panels/sections/PositionSection.tsx
- FOUND: src/components/editor/panels/sections/FillSection.tsx
- FOUND: src/components/editor/panels/sections/StrokeSection.tsx
- FOUND: src/components/editor/panels/sections/ShadowSection.tsx
- FOUND: src/components/editor/panels/sections/FitModeSection.tsx
- FOUND: src/components/editor/panels/sections/PageSection.tsx
- FOUND: src/components/editor/panels/PropertiesPanel.tsx

Commits exist:
- FOUND: 790f221 — feat(02-03): create 6 property section components
- FOUND: 0a512d0 — feat(02-03): rewrite PropertiesPanel with context-sensitive section rendering

Build: PASSED (npx next build — Compiled successfully in 6.5s)
