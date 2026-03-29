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
| **Quick run command** | `npx jest --testPathPattern=promptcrafter --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=promptcrafter --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | AIPC-01 | unit | `npx jest src/lib/ai/__tests__/prompt-enricher.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | AIPC-02, AIPC-03 | unit | `npx jest src/lib/ai/__tests__/prompt-enricher.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | AIMG-01, AIMG-02 | unit | `npx jest src/lib/ai/__tests__/image-generator.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | AIMG-04 | unit | `npx jest src/lib/storage/__tests__/imageDb.test.ts` | ✅ | ⬜ pending |
| 04-03-01 | 03 | 2 | AIPC-04, AIPC-05 | manual | Browser verification | N/A | ⬜ pending |
| 04-03-02 | 03 | 2 | AIMG-03 | manual | Browser verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/ai/__tests__/prompt-enricher.test.ts` — stubs for AIPC-01, AIPC-02, AIPC-03
- [ ] `src/lib/ai/__tests__/image-generator.test.ts` — stubs for AIMG-01, AIMG-02

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
