---
phase: 04-ai-promptcrafter
plan: 02
subsystem: ui
tags: [react, zustand, fabric, gemini, i18n, modal, prompt-crafting, image-generation]

requires:
  - phase: 04-01
    provides: enrichPrompt, callGeminiImage, assemblePrompt, snapAspectRatio, placeImageIntoFrame, promptCrafterStore, imageDb, types/promptCrafter

provides:
  - PromptCrafterModal with 5-step flow (idle -> enriching -> customizing -> generating -> result)
  - History strip with thumbnail grid and clear action
  - AI Image button in Header
  - AI Generate button in ImageSection
  - promptCrafterModalOpen state in editorStore
  - promptCrafter i18n keys (28 keys in en.json and bg.json)

affects: [05-export-and-polish, future-feature-phases]

tech-stack:
  added: []
  patterns:
    - "PromptCrafterModal follows GenerateLeafletModal dark theme pattern"
    - "useEffect on step transition drives async side effects (enrichPrompt, callGeminiImage)"
    - "Object URL refs tracked in useRef and revoked on unmount"
    - "History stored in promptCrafterStore (localStorage) with thumbnail data URLs"

key-files:
  created:
    - src/components/editor/modals/PromptCrafterModal.tsx
  modified:
    - src/stores/editorStore.ts
    - src/i18n/en.json
    - src/i18n/bg.json
    - src/components/editor/ui/Header.tsx
    - src/components/editor/panels/sections/ImageSection.tsx

key-decisions:
  - "Combined Task 1 and Task 2 modal implementation into a single component with all steps (idle/enriching/customizing/generating/result/history) — cleaner than two partial implementations"
  - "useEffect on step='generating' drives callGeminiImage — separates trigger (button click) from async work"
  - "History strip rendered as shared HistoryStrip sub-component used in both customizing and result steps"
  - "element-factory.ts: replaced require() with ESM import to fix browser runtime crash"
  - "Gemini Imagen API: correct model is imagen-3.0-generate-002; aspectRatio belongs in generationConfig not parameters"
  - "API errors parsed to human-readable messages before display — raw JSON never shown to user"

patterns-established:
  - "PromptCrafter step machine: step state drives conditional rendering of each workflow phase"
  - "assembledPrompt is both derived (from variation + knobs) and directly editable by user"

requirements-completed:
  - AIPC-01
  - AIPC-02
  - AIPC-03
  - AIPC-04
  - AIPC-05
  - AIMG-01
  - AIMG-02
  - AIMG-03
  - AIMG-04

duration: 5min
completed: 2026-03-29
---

# Phase 4 Plan 02: PromptCrafter UI Summary

**PromptCrafter modal with 5-step flow (describe->enrich->customize->generate->result), image history strip, and AI Image entry points in Header and ImageSection**

## Performance

- **Duration:** ~15 min (including human verification and bug fixes)
- **Started:** 2026-03-29T20:49:58Z
- **Completed:** 2026-03-29T21:05:00Z
- **Tasks:** 3 (2 auto + 1 human-verify — approved after bug fixes)
- **Files modified:** 7

## Accomplishments

- Full PromptCrafterModal component with idle->enriching->customizing->generating->result state machine
- 3 variation cards (Editorial, Lifestyle, Bold) with 5 customization knobs and live prompt assembly
- Image generation with loading state, preview, "Use This"/"Regenerate"/"Edit Prompt" actions
- History strip with 48x48 thumbnails, localStorage persistence via promptCrafterStore, and clear action
- Frame placement via placeImageIntoFrame with fallback to canvas center if frame lost
- AI Image button in Header (Wand2 icon) and AI Generate button in ImageSection panel
- 28 i18n keys added to both en.json and bg.json

## Task Commits

1. **Task 1: editorStore + i18n + PromptCrafterModal shell** - `bd63e5a` (feat)
2. **Task 2: Wire into Header and ImageSection** - `6639f8c` (feat)
3. **Task 3: Human verification (bugs found and fixed)**
   - `4e30a6a` (fix) — replace require() with ESM import in element-factory.ts
   - `8666d0f` (fix) — correct Gemini API model name, aspectRatio location, human-readable errors

## Files Created/Modified

- `src/components/editor/modals/PromptCrafterModal.tsx` - Full 5-step PromptCrafter modal (300+ lines)
- `src/stores/editorStore.ts` - Added promptCrafterModalOpen + setPromptCrafterModalOpen
- `src/i18n/en.json` - Added promptCrafter (28 keys) and image.aiGenerate
- `src/i18n/bg.json` - Added Bulgarian translations for same keys
- `src/components/editor/ui/Header.tsx` - AI Image button + PromptCrafterModal render
- `src/components/editor/panels/sections/ImageSection.tsx` - AI Generate button
- `src/lib/element-factory.ts` - Replaced require() with ESM import (bug fix)
- `src/lib/ai/generate-image.ts` - Corrected Gemini model name, aspectRatio field location, error formatting

## Decisions Made

- Combined generate/result/history into Task 1 implementation since separating them would create a partially non-functional component; it's cleaner to implement the full modal in one pass.
- useEffect on `step === 'generating'` drives callGeminiImage — keeps the button onClick simple and avoids passing async function directly.
- HistoryStrip extracted as sub-component to share between customizing and result steps without duplication.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replace require() with ESM import in element-factory.ts**
- **Found during:** Task 3 (human verification)
- **Issue:** `element-factory.ts` used `require()` which fails in the browser ESM context, causing a runtime crash when the editor loads
- **Fix:** Replaced `require()` call with proper ESM `import` statement
- **Files modified:** `src/lib/element-factory.ts`
- **Verification:** Editor loads without error in browser
- **Committed in:** `4e30a6a`

**2. [Rule 1 - Bug] Correct Gemini Imagen API model name and aspectRatio field location**
- **Found during:** Task 3 (human verification — image generation returning errors)
- **Issue 1:** Wrong model name used — correct Gemini image model is `imagen-3.0-generate-002`
- **Issue 2:** `aspectRatio` placed in the wrong part of the API payload; must be inside `generationConfig`, not `parameters`
- **Fix:** Updated `callGeminiImage` in `src/lib/ai/generate-image.ts` with the correct model identifier and correct field nesting
- **Files modified:** `src/lib/ai/generate-image.ts`
- **Verification:** Image generation succeeds and returns base64 image data
- **Committed in:** `8666d0f`

**3. [Rule 1 - Bug] Human-readable error messages instead of raw JSON**
- **Found during:** Task 3 (human verification — error banner showing raw JSON)
- **Issue:** API error responses were displayed verbatim as JSON strings in the modal error banner — confusing and unreadable for users
- **Fix:** Added error parsing logic that extracts the human-readable message field from API error JSON; falls back to a generic message when parsing fails
- **Files modified:** `src/lib/ai/generate-image.ts`, `src/components/editor/modals/PromptCrafterModal.tsx`
- **Verification:** Error banners show plain English text instead of raw JSON
- **Committed in:** `8666d0f`

---

**Total deviations:** 3 auto-fixed (Rule 1 — runtime and API integration bugs found during human verification)
**Impact on plan:** All three fixes were necessary for the feature to work. No scope creep.

## Issues Encountered

Three bugs surfaced during the human-verify checkpoint and were fixed before final approval:

1. `element-factory.ts` require() — pre-existing issue exposed by new modal code path; caused editor load failure
2. Gemini Imagen API spec mismatch — wrong model name and wrong field location for aspectRatio
3. Raw JSON error strings shown to user — UX issue making the error banner unhelpful

All three fixed in `4e30a6a` and `8666d0f`. User re-tested and approved.

## Next Phase Readiness

- Phase 04 is complete — full AI PromptCrafter feature is live and verified end-to-end
- PromptCrafter modal is accessible from both Header (Wand2 button) and ImageSection ("AI Generate" button)
- Phase 05 (export) can proceed — no dependencies on PromptCrafter internals
- Any component can open the modal via `useEditorStore.getState().setPromptCrafterModalOpen(true)`

## Self-Check: PASSED

- `src/components/editor/modals/PromptCrafterModal.tsx` — exists (verified in key-files)
- Commits `bd63e5a`, `6639f8c`, `4e30a6a`, `8666d0f` — all present in git log

---
*Phase: 04-ai-promptcrafter*
*Completed: 2026-03-29*
