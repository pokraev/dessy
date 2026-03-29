---
phase: 04-ai-promptcrafter
verified: 2026-03-29T21:37:10Z
status: gaps_found
score: 12/13 must-haves verified
re_verification: false
gaps:
  - truth: "callGeminiImage sends correct payload to Gemini and extracts base64 from inline_data response"
    status: partial
    reason: "Implementation was updated during human verification to throw a human-readable 403 error message (no '403' in text), but the test still asserts the message contains '403'. The implementation is correct; the test is stale."
    artifacts:
      - path: "src/lib/ai/__tests__/generate-image.test.ts"
        issue: "Line 126: expects rejects.toThrow('403') but implementation now throws 'Image generation access denied...' (no status code in message)"
      - path: "src/lib/ai/generate-image.ts"
        issue: "Line 119: 403 error message does not include '403' — intentional UX change, but test was not updated"
    missing:
      - "Update test at line 126 to assert rejects.toThrow('image generation access') or rejects.toThrow('access denied') to match the updated implementation"
human_verification:
  - test: "Full PromptCrafter flow end-to-end"
    expected: "User can type description, enrich to 3 variations, customize knobs (live-updating prompt), generate image, see loading state, preview result, use this to place in frame, regenerate, edit prompt, and browse history"
    why_human: "Visual UI flow, real Gemini API call, canvas frame placement, loading animation, history thumbnail rendering — cannot verify programmatically"
  - test: "AI Image button in Header and AI Generate button in ImageSection"
    expected: "Both buttons open the PromptCrafter modal; modal shows no-frame error when no image frame is selected"
    why_human: "UI interaction and conditional rendering based on canvas selection state"
---

# Phase 4: AI PromptCrafter Verification Report

**Phase Goal:** AI PromptCrafter — build the AI image generation feature with prompt enrichment, customization knobs, and canvas integration
**Verified:** 2026-03-29T21:37:10Z
**Status:** gaps_found (1 gap: stale test)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | enrichPrompt returns 3 named variations (editorial, lifestyle, bold) from a base description | VERIFIED | `src/lib/ai/generate-image.ts` lines 14-72; 17/18 generate-image tests pass including enrichPrompt cases |
| 2 | callGeminiImage sends correct payload to Gemini and extracts base64 from inline_data response | PARTIAL | Implementation correct (lines 78-142); 403 test is stale — test expects `'403'` in message but implementation was updated post-human-verify to throw human-readable message without status code |
| 3 | assemblePrompt builds final prompt text from a variation + customization knobs | VERIFIED | Lines 149-172; test cases all pass |
| 4 | promptCrafterStore persists history entries with thumbnails, capped at 50 | VERIFIED | `src/stores/promptCrafterStore.ts` — localStorage key `dessy-image-history`, MAX_HISTORY=50, addToHistory slices to 50; 5/5 store tests pass |
| 5 | snapAspectRatio maps any frame ratio to one of Gemini's 5 supported ratios | VERIFIED | Lines 175-201; log-ratio comparison; tests pass |
| 6 | User can type a basic image description in a text area | VERIFIED | `PromptCrafterModal.tsx` lines 400-443 — textarea with onChange, disabled Enrich button when empty |
| 7 | User can click Enrich and see 3 prompt variations (Editorial, Lifestyle, Bold) | VERIFIED | `handleEnrich` at line 193 calls enrichPrompt; variation cards rendered at lines 476-503 |
| 8 | User can customize prompt via mood, lighting, composition, style, and background dropdowns | VERIFIED | 5 dropdowns with preset options at lines 509-530 |
| 9 | Each customization change live-updates the visible prompt text | VERIFIED | `handleCustomizationChange` at line 218 calls assemblePrompt and sets assembledPromptText; editable textarea at lines 534-554 |
| 10 | User can click Generate Image and see a loading state then preview | VERIFIED | step='generating' spinner at lines 459-469; useEffect drives callGeminiImage at lines 143-191; result step shows img at lines 593-664 |
| 11 | User can click Use This to place image into selected canvas frame | VERIFIED | `handleUseThis` at lines 228-267 calls placeImageIntoFrame; fallback to canvas center with toast if frame lost |
| 12 | User can click Regenerate or Edit Prompt without losing prior work | VERIFIED | Regenerate sets step='generating' (line 623); Edit Prompt sets step='customizing' (line 639) — variations/customization state preserved |
| 13 | User can browse image history and click to reuse any image | VERIFIED | HistoryStrip component at lines 681-733; `handleHistoryEntryClick` at lines 269-276 loads from IndexedDB via getImage |

**Score:** 12/13 truths verified (1 partial due to stale test)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/promptCrafter.ts` | PromptVariation, PromptCustomization, ImageHistoryEntry, FrameContext types | VERIFIED | 37 lines; exports PromptStep, PromptVariations, PromptCustomization, FrameContext, ImageHistoryEntry |
| `src/lib/ai/generate-image.ts` | callGeminiImage, enrichPrompt, assemblePrompt, snapAspectRatio, base64ToBlob, generateThumbnail, placeImageIntoFrame | VERIFIED | 310 lines; all 7 functions exported |
| `src/lib/ai/prompts/image-prompt.ts` | buildEnrichmentSystemPrompt | VERIFIED | 35 lines; exports buildEnrichmentSystemPrompt with frame context injection |
| `src/stores/promptCrafterStore.ts` | usePromptCrafterStore with history management | VERIFIED | 50 lines; localStorage persistence, addToHistory, clearHistory |
| `src/components/editor/modals/PromptCrafterModal.tsx` | Full PromptCrafter modal with 5-step flow | VERIFIED | 733 lines (min 200 required); complete 5-step state machine |
| `src/stores/editorStore.ts` | promptCrafterModalOpen state | VERIFIED | Lines 12, 21, 33, 42 add promptCrafterModalOpen + setter |
| `src/components/editor/ui/Header.tsx` | AI Image button in header | VERIFIED | Imports PromptCrafterModal, Wand2 icon, renders button and modal |
| `src/components/editor/panels/sections/ImageSection.tsx` | Generate AI Image button when frame selected | VERIFIED | Imports Wand2, calls setPromptCrafterModalOpen on click |
| `src/lib/ai/__tests__/generate-image.test.ts` | Unit tests for service layer | PARTIAL | 221 lines, 18 tests; 1 test stale (403 message assertion) |
| `src/lib/ai/__tests__/image-prompt.test.ts` | Unit tests for prompt builder | VERIFIED | 40 lines; all pass |
| `src/stores/__tests__/promptCrafterStore.test.ts` | Unit tests for store | VERIFIED | 73 lines; all 5 pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/editor/modals/PromptCrafterModal.tsx` | `src/lib/ai/generate-image.ts` | imports enrichPrompt, callGeminiImage, assemblePrompt, placeImageIntoFrame | WIRED | Line 9-17: all 7 functions imported and used |
| `src/components/editor/modals/PromptCrafterModal.tsx` | `src/stores/promptCrafterStore.ts` | imports usePromptCrafterStore for history | WIRED | Line 7: imported; history, addToHistory, clearHistory used |
| `src/components/editor/modals/PromptCrafterModal.tsx` | `src/lib/storage/imageDb.ts` | imports storeImage and getImage for IndexedDB persistence | WIRED | Line 18: storeImage used in generation flow (line 161), getImage in history click (line 270) |
| `src/components/editor/panels/sections/ImageSection.tsx` | `src/stores/editorStore.ts` | opens PromptCrafter modal via setPromptCrafterModalOpen | WIRED | Line 5 import, line 188 click handler |
| `src/lib/ai/generate-image.ts` | `src/lib/storage/imageDb.ts` | storeImage for IndexedDB persistence in placeImageIntoFrame | WIRED | Dynamic import at line 260; used at line 309 |
| `src/stores/promptCrafterStore.ts` | localStorage | persist middleware for history | WIRED | STORAGE_KEY='dessy-image-history'; loadFromStorage on init, saveToStorage in every set callback |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| AIPC-01 | 04-02-PLAN | User can type a basic image description in a text area | SATISFIED | PromptCrafterModal idle step: textarea at line 403 |
| AIPC-02 | 04-01-PLAN, 04-02-PLAN | User can click "Enrich" to get 3 prompt variations (Editorial, Lifestyle, Bold) via Gemini | SATISFIED | enrichPrompt in service layer; 3 variation cards in modal |
| AIPC-03 | 04-01-PLAN, 04-02-PLAN | Prompt enrichment uses leaflet context, frame dimensions, frame position, and brand colors | SATISFIED | buildEnrichmentSystemPrompt injects aspectRatio, positionHint, brandColors; FrameContext captured on modal open |
| AIPC-04 | 04-01-PLAN, 04-02-PLAN | User can customize prompt via mood, lighting, composition, style, and background controls | SATISFIED | 5 select dropdowns in customizing step |
| AIPC-05 | 04-01-PLAN, 04-02-PLAN | Each customization change live-updates the visible/editable prompt text | SATISFIED | handleCustomizationChange calls assemblePrompt and updates assembledPromptText |
| AIMG-01 | 04-01-PLAN, 04-02-PLAN | User can generate an image from the enriched prompt via Gemini | SATISFIED | callGeminiImage called in generating step useEffect |
| AIMG-02 | 04-02-PLAN | User can see loading state during generation and preview the result | SATISFIED | Loader2 spinner in generating step; img preview in result step |
| AIMG-03 | 04-02-PLAN | User can "Use This" to place image into selected canvas frame, or "Regenerate" / "Edit Prompt" | SATISFIED | 3 buttons in result step wired to handleUseThis, setStep('generating'), setStep('customizing') |
| AIMG-04 | 04-01-PLAN, 04-02-PLAN | User can see history of all generated images and click to reuse any | SATISFIED | HistoryStrip rendered in both customizing and result steps; handleHistoryEntryClick loads from IndexedDB |

**Note on REQUIREMENTS.md tracking table:** The table lists AIPC-01 through AIMG-04 as "Phase 3" but these are implemented in the ROADMAP's Phase 4 (04-ai-promptcrafter). The `[x]` completion markers are accurate. The phase number in the tracking table is a labeling inconsistency (the roadmap was renumbered) — not an implementation gap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/ai/__tests__/generate-image.test.ts` | 126 | Stale test assertion: `rejects.toThrow('403')` but implementation throws message without '403' | WARNING | 1 test fails in CI; test intent (verify 403 error is distinguishable) is preserved by the implementation, assertion string just needs updating |
| `src/lib/ai/generate-image.ts` | 250 | Comment text contains 'placeholder' | INFO | Inline comment only — "Fabric.js image frame, replacing the placeholder" — not a placeholder implementation |

TypeScript compilation has errors but they are pre-existing (not introduced by phase 4):
- `EditorCanvasInner.tsx` — `Cannot find name 'FabricObject'` (unrelated to phase 4)
- `element-factory.test.ts` — vitest/jest module mismatch (pre-existing)
- `canvas-loader.ts` — `ImportMeta.env` (pre-existing)

None of the phase 4 files produce TypeScript errors.

### Human Verification Required

#### 1. Full PromptCrafter Flow

**Test:** Open editor, select an image frame, click "AI Generate" or Header AI Image button (Wand2). Type "a fresh salad on a wooden table", click "Enrich Prompt", select a variation, change Mood to "warm", verify prompt updates live, click "Generate Image", verify spinner shows, verify image previews, click "Use This", verify image placed in frame.
**Expected:** All 5 steps transition smoothly; customization changes update the prompt textarea in real time; image is placed into the correct frame.
**Why human:** Real Gemini API call, visual rendering, canvas frame placement, live state transitions.

#### 2. History Persistence

**Test:** Generate two images, close and reopen the modal, verify history thumbnails persist.
**Expected:** History strip shows both thumbnails; clicking a thumbnail loads the image into result step.
**Why human:** localStorage persistence verification and IndexedDB image retrieval require runtime browser environment.

### Gaps Summary

One gap blocks full CI green: the unit test for `callGeminiImage`'s 403 error handling asserts the thrown message contains the string `'403'`. During human verification (committed `8666d0f`), the 403 error message was updated to a user-facing string (`'Image generation access denied...'`) that no longer includes the status code. The test was not updated to match. The implementation behavior is correct and more user-friendly — the test assertion is simply stale.

**Fix required:** Update `src/lib/ai/__tests__/generate-image.test.ts` line 126:

Change: `await expect(callGeminiImage('bad-key', 'prompt', '1:1')).rejects.toThrow('403');`
To: `await expect(callGeminiImage('bad-key', 'prompt', '1:1')).rejects.toThrow('image generation access');`

This is a one-line fix. All other 26 tests pass. The feature is fully implemented and was human-verified as working end-to-end.

---

_Verified: 2026-03-29T21:37:10Z_
_Verifier: Claude (gsd-verifier)_
