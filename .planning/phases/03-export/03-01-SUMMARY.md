---
phase: 03-export
plan: 01
subsystem: export
tags: [export, raster, png, jpeg, zip]
dependency_graph:
  requires: [fabric, element-factory, projectStore, canvasStore]
  provides: [export-utils, raster-export]
  affects: [coreldraw-export, indesign-export]
tech_stack:
  added: [file-saver, jszip]
  patterns: [temp-canvas-render, blob-export, AligningGuidelines-workaround]
key_files:
  created:
    - src/lib/export/export-utils.ts
    - src/lib/export/raster-export.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - hexToRgb returns tuple [r,g,b] per plan spec; pre-existing coreldraw-export uses object destructuring (out of scope)
  - DPI multipliers computed as targetDPI/72 (exact values, not rounded)
  - JPEG quality set to 0.92 for high-quality output
metrics:
  duration: 3 min
  completed: "2026-03-29T20:13:52Z"
---

# Phase 03 Plan 01: Shared Export Utilities and Raster Export Summary

Shared export utility functions (collectAllPageData, hexToRgb, pxToMm/mmToPx, DPI_MULTIPLIERS) plus PNG/JPEG raster export via temp Fabric canvas with AligningGuidelines workaround and file-saver/jszip bundling.

## What Was Built

### export-utils.ts
- `collectAllPageData`: Serializes current canvas live, reads other pages from sessionStorage using `dessy-generated-page-{projectId}-{index}` key pattern
- `hexToRgb`: 3/6-char hex to [r,g,b] tuple
- `pxToMm` / `mmToPx`: 72-DPI pixel/mm conversion
- `DPI_MULTIPLIERS`: { 72: 1, 150: 2.08, 300: 4.17 }
- TypeScript types: `PageExportData`, `RasterFormat`, `DpiOption`

### raster-export.ts
- `exportRasterPages`: Collects all page data, renders each via temp off-screen Fabric canvas
- Uses `_isDocBackground` rect detection for exact document bounds (same pattern as PagesPanel thumbnails)
- Strips `before:render` listeners before rendering (AligningGuidelines workaround)
- Single page: direct `saveAs(blob)` download
- Multi-page: JSZip bundle with `{name}_page{N}.{ext}` naming, downloads as ZIP

## Deviations from Plan

None - plan executed exactly as written.

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | b0e9665 | Shared export utils + raster export + deps installed |
