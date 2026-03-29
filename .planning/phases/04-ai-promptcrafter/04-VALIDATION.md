---
phase: 4
slug: ai-promptcrafter
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 + ts-jest |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="generate-image|image-prompt|promptCrafterStore" --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="generate-image|image-prompt|promptCrafterStore" --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | AIPC-02, AIPC-03, AIMG-01 | unit | `npx jest --testPathPattern="generate-image\|image-prompt\|promptCrafterStore" --no-coverage` | ❌ W0 (tests written, RED) | ⬜ pending |
| 04-01-02 | 01 | 1 | AIPC-04, AIPC-05, AIMG-04 | unit | `npx jest --testPathPattern="generate-image\|image-prompt\|promptCrafterStore" --no-coverage` | ✅ (after Task 1) | ⬜ pending |
| 04-02-01 | 02 | 2 | AIPC-01, AIPC-04, AIPC-05 | typecheck | `npx tsc --noEmit` | N/A | ⬜ pending |
| 04-02-02 | 02 | 2 | AIMG-02, AIMG-03 | typecheck | `npx tsc --noEmit` | N/A | ⬜ pending |
| 04-02-03 | 02 | 2 | all | manual | Browser verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/ai/__tests__/generate-image.test.ts` — tests for enrichPrompt, callGeminiImage, assemblePrompt, snapAspectRatio, base64ToBlob
- [ ] `src/lib/ai/__tests__/image-prompt.test.ts` — tests for buildEnrichmentSystemPrompt
- [ ] `src/stores/__tests__/promptCrafterStore.test.ts` — tests for addToHistory, clearHistory

*Existing `imageDb.test.ts` covers image storage.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Prompt customization controls live-update text | AIPC-04, AIPC-05 | UI interaction | Open PromptCrafter, change mood/style, verify prompt text updates |
| "Use This" places image into selected frame | AIMG-03 | Canvas placement requires browser | Select frame, generate image, click Use This, verify frame shows image |
| Image history displays and allows reuse | AIMG-04 | IndexedDB + UI | Generate images, check history panel, click to reuse |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
