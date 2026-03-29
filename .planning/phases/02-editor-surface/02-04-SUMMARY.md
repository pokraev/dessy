---
phase: 02-editor-surface
plan: 04
subsystem: typography-controls
tags: [typography, google-fonts, fabric-js, ui-panels]
dependency_graph:
  requires: [02-01]
  provides: [useGoogleFonts, loadGoogleFont, GoogleFontsDropdown, TypographySection]
  affects: [useSelectedObject, PropertiesPanel]
tech_stack:
  added: []
  patterns:
    - IntersectionObserver for infinite scroll sentinel and per-row font preview batching
    - CSS FontFace API (document.fonts.load) with 5s timeout for on-demand font loading
    - fabric cache.clearFontCache() to clear text measurement cache after font load
    - Portal-based dropdown at z-index 200
    - Dynamic import of fabric cache to avoid SSR issues
key_files:
  created:
    - src/constants/popular-fonts.ts
    - src/hooks/useGoogleFonts.ts
    - src/components/editor/panels/GoogleFontsDropdown.tsx
    - src/components/editor/panels/sections/TypographySection.tsx
  modified:
    - src/hooks/useSelectedObject.ts
decisions:
  - "fabric v7 exports `cache.clearFontCache(family)` not `clearFabricFontCache` — used correct API"
  - "textTransform stored as custom fabric property; transform applies immediately to obj.text content"
  - "TypographySection uses eslint-disable any casts for canvas.fire() — fabric event types don't allow arbitrary target types"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_changed: 5
---

# Phase 02 Plan 04: Typography Controls Summary

Google Fonts searchable dropdown with on-demand FontFace loading, full typography controls panel (weight, size, line-height, letter-spacing, color, alignment, transform), and 5 quick-apply preset buttons wired to brandStore.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | useGoogleFonts hook, popular-fonts constant, GoogleFontsDropdown | e74ab8b | src/constants/popular-fonts.ts, src/hooks/useGoogleFonts.ts, src/components/editor/panels/GoogleFontsDropdown.tsx |
| 2 | TypographySection with all controls and preset buttons | a238396 | src/components/editor/panels/sections/TypographySection.tsx, src/hooks/useSelectedObject.ts |

## What Was Built

**useGoogleFonts hook** (`src/hooks/useGoogleFonts.ts`):
- `loadGoogleFont(family, weight)` — injects `<link>` stylesheet, awaits `document.fonts.load` with 5s timeout, calls `cache.clearFontCache(family)` on success, shows toast on failure
- `useGoogleFonts()` — returns filtered/paginated font list; fetches full list from Google Fonts API if `NEXT_PUBLIC_GOOGLE_FONTS_API_KEY` is set, otherwise falls back to POPULAR_FONTS only

**GoogleFontsDropdown** (`src/components/editor/panels/GoogleFontsDropdown.tsx`):
- Full-width trigger button showing current font in its own typeface
- Portal dropdown (z-index 200) with search input, "Popular" section, "All fonts" section
- IntersectionObserver on sentinel div for load-more on scroll
- Per-row IntersectionObserver batches font preview loading (5 at a time)

**TypographySection** (`src/components/editor/panels/sections/TypographySection.tsx`):
- Font family (GoogleFontsDropdown), weight select (300/400/500/600/700)
- Size (pt) + line height (x multiplier) side-by-side row
- Letter spacing (charSpacing, step 10)
- Text color (ColorPicker with swatch apply)
- Alignment buttons: AlignLeft, AlignCenter, AlignRight, AlignJustify
- Transform buttons: Aa (none), aa (lowercase), AA (uppercase), Cc (capitalize with `\b\w` regex)
- 5 preset buttons (2+3 layout): Headline, Subhead, Body, Caption, CTA with brandStore integration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] fabric v7 has no `clearFabricFontCache` export**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified `import { clearFabricFontCache } from 'fabric'` but fabric v7 exports a `cache` object with `cache.clearFontCache(family)` instead
- **Fix:** Used `const { cache } = await import('fabric'); cache.clearFontCache(family)` — dynamic import avoids SSR issues
- **Files modified:** src/hooks/useGoogleFonts.ts
- **Commit:** e74ab8b

**2. [Rule 1 - Bug] TypeScript canvas.fire() type incompatibility**
- **Found during:** Task 2 build verification
- **Issue:** Fabric.js `canvas.fire('object:modified', { target: obj })` rejected typed cast via complex generics
- **Fix:** Used `as any` cast with eslint-disable comment — safe since this is a pattern used throughout the codebase
- **Files modified:** src/components/editor/panels/sections/TypographySection.tsx
- **Commit:** a238396

## Self-Check

- [x] src/constants/popular-fonts.ts — created
- [x] src/hooks/useGoogleFonts.ts — created
- [x] src/components/editor/panels/GoogleFontsDropdown.tsx — created
- [x] src/components/editor/panels/sections/TypographySection.tsx — created
- [x] src/hooks/useSelectedObject.ts — modified (textTransform added)
- [x] Commits e74ab8b and a238396 exist
- [x] `npx next build` passes

## Self-Check: PASSED
