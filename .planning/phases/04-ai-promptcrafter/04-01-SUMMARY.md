---
phase: 04-ai-promptcrafter
plan: 01
subsystem: ai
tags: [gemini, image-generation, zustand, typescript, tdd, jest]

# Dependency graph
requires:
  - phase: 03-export
    provides: no direct dependency; same codebase patterns used
  - phase: 02-editor-surface
    provides: canvasStore, brandStore, ImageSection frame-replacement pattern

provides:
  - enrichPrompt: Gemini text API prompt enrichment to 3 named variations
  - callGeminiImage: Gemini image API with inline_data extraction
  - assemblePrompt: final prompt assembly from variation + customization knobs
  - snapAspectRatio: frame ratio -> Gemini 5-ratio mapping (log-scale)
  - base64ToBlob, generateThumbnail, placeImageIntoFrame utilities
  - buildEnrichmentSystemPrompt with frame context and brand colors
  - usePromptCrafterStore: history management with localStorage persistence (cap 50)
  - PromptVariations, PromptCustomization, FrameContext, ImageHistoryEntry, PromptStep types

affects:
  - 04-02-PLAN (PromptCrafter UI modal — imports all service functions)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD red-green cycle: types first, then test files (RED), then implementation (GREEN)"
    - "Native fetch for Gemini API calls (same pattern as generate-leaflet.ts — no SDK)"
    - "Log-ratio comparison for perceptually uniform aspect ratio snapping"
    - "Manual localStorage sync in zustand store (load on init, save in set callbacks)"

key-files:
  created:
    - src/types/promptCrafter.ts
    - src/lib/ai/generate-image.ts
    - src/lib/ai/prompts/image-prompt.ts
    - src/stores/promptCrafterStore.ts
    - src/lib/ai/__tests__/generate-image.test.ts
    - src/lib/ai/__tests__/image-prompt.test.ts
    - src/stores/__tests__/promptCrafterStore.test.ts
  modified: []

key-decisions:
  - "Log-ratio (not linear) comparison for snapAspectRatio — perceptually uniform distance across wide and portrait ranges"
  - "generateThumbnail falls back to original dataUrl when OffscreenCanvas unavailable (test/SSR env)"
  - "placeImageIntoFrame converts dataUrl -> blob -> objectUrl before FabricImage.fromURL to avoid render blocking (per research pitfall 2)"

patterns-established:
  - "Image service layer: all Gemini details hidden behind typed function signatures — UI never calls fetch directly"
  - "Store init: loadFromStorage() called at create time, saveToStorage() called inside each set callback"

requirements-completed:
  - AIPC-02
  - AIPC-03
  - AIPC-04
  - AIPC-05
  - AIMG-01
  - AIMG-04

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 04 Plan 01: AI Image Service Layer Summary

**Gemini image generation service layer with enrichPrompt/callGeminiImage/assemblePrompt/snapAspectRatio utilities, system prompt builder, and zustand history store — 27 unit tests all GREEN via TDD.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-29T20:43:56Z
- **Completed:** 2026-03-29T20:47:16Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 7

## Accomplishments

- Full AI image service layer: enrichPrompt (3-variation JSON enrichment via Gemini text API), callGeminiImage (imagen endpoint with 403/missing-image error handling), assemblePrompt (knob joining), snapAspectRatio (5-ratio log-scale mapper)
- System prompt builder (`buildEnrichmentSystemPrompt`) injects frame aspectRatio, positionHint, brand colors, and JSON output format instruction
- `usePromptCrafterStore` with localStorage persistence under `dessy-image-history`, max 50 entries, newest-first
- 27 unit tests covering all exported functions — both service files and store

## Task Commits

1. **Task 1: Unit tests for service layer (TDD RED)** - `587947b` (test)
2. **Task 2: Implement service layer (TDD GREEN)** - `2a587e3` (feat)

## Files Created/Modified

- `src/types/promptCrafter.ts` — PromptVariations, PromptCustomization, FrameContext, ImageHistoryEntry, PromptStep types
- `src/lib/ai/generate-image.ts` — enrichPrompt, callGeminiImage, assemblePrompt, snapAspectRatio, base64ToBlob, generateThumbnail, placeImageIntoFrame
- `src/lib/ai/prompts/image-prompt.ts` — buildEnrichmentSystemPrompt
- `src/stores/promptCrafterStore.ts` — usePromptCrafterStore with localStorage persistence
- `src/lib/ai/__tests__/generate-image.test.ts` — 20 test cases
- `src/lib/ai/__tests__/image-prompt.test.ts` — 4 test cases
- `src/stores/__tests__/promptCrafterStore.test.ts` — 5 test cases

## Decisions Made

- **Log-ratio for snapAspectRatio:** Linear difference was ambiguous for 350x400 (equidistant between 1:1 and 3:4). Log-ratio (perceptually uniform) correctly maps it to 1:1; test updated to use 320x400 as unambiguous 3:4 example.
- **generateThumbnail fallback:** OffscreenCanvas not available in Node/jest/SSR — falls back to original dataUrl rather than throwing.
- **placeImageIntoFrame dataUrl->blob->objectURL:** Converts before FabricImage.fromURL per research pitfall 2 (avoids render blocking).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected test case for snapAspectRatio edge case**
- **Found during:** Task 2 (TDD GREEN)
- **Issue:** Test asserted `snapAspectRatio(350, 400)` returns `"3:4"`, but 350/400=0.875 is equidistant between 1:1 (diff=0.125) and 3:4 (diff=0.125) on linear scale, and actually closer to 1:1 on log scale
- **Fix:** Changed test to `snapAspectRatio(320, 400)` which clearly maps to 3:4; updated implementation to use log-ratio comparison for perceptual correctness
- **Files modified:** `src/lib/ai/__tests__/generate-image.test.ts`, `src/lib/ai/generate-image.ts`
- **Verification:** All 27 tests pass
- **Committed in:** `2a587e3`

---

**Total deviations:** 1 auto-fixed (Rule 1 — test correctness bug)
**Impact on plan:** Fix improves correctness of snapAspectRatio. No scope creep.

## Issues Encountered

None — smooth TDD execution.

## User Setup Required

None — no external service configuration required for this plan. API key is provided at runtime by the UI.

## Next Phase Readiness

- All service functions exported with correct TypeScript signatures
- Plan 02 (PromptCrafter UI modal) can import `enrichPrompt`, `callGeminiImage`, `assemblePrompt`, `snapAspectRatio`, `base64ToBlob`, `generateThumbnail`, `placeImageIntoFrame` from `@/lib/ai/generate-image`
- Types available at `@/types/promptCrafter`
- History store available at `@/stores/promptCrafterStore`

## Self-Check: PASSED

All files verified on disk. Both task commits (587947b, 2a587e3) verified in git log.

---
*Phase: 04-ai-promptcrafter*
*Completed: 2026-03-29*
