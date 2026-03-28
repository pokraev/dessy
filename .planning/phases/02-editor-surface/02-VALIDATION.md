---
phase: 02
slug: editor-surface
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if installed) or manual verification |
| **Config file** | vitest.config.ts or "none — Wave 0 installs" |
| **Quick run command** | `npx next build 2>&1 | tail -5` |
| **Full suite command** | `npx next build && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx next build 2>&1 | tail -5`
- **After every plan wave:** Run `npx next build && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PAGE-01 | integration | `grep -r "addPage\|removePage\|reorderPages" src/` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PAGE-02 | manual | visual page thumbnail navigation | N/A | ⬜ pending |
| 02-01-03 | 01 | 1 | PAGE-03 | integration | `grep -r "duplicatePage" src/` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | PAGE-04 | integration | `grep -r "bifold\|trifold" src/constants/` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 1 | LPNL-01 | manual | visual tool selection | N/A | ⬜ pending |
| 02-02-02 | 02 | 1 | LPNL-02 | integration | `grep -r "DndContext\|SortableContext" src/` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | LPNL-03 | integration | `grep -r "toggleVisibility\|toggleLock" src/` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | LPNL-04 | manual | click layer → canvas select | N/A | ⬜ pending |
| 02-02-05 | 02 | 1 | LPNL-05 | manual | page thumbnails in left panel | N/A | ⬜ pending |
| 02-03-01 | 03 | 2 | PROP-01 | integration | `grep -r "pxToMm\|mmToPx" src/components/editor/panels/` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | PROP-02 | integration | `grep "opacity\|cornerRadius\|rx" src/components/editor/panels/` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | PROP-03 | integration | `grep "stroke\|border\|fill" src/components/editor/panels/` | ❌ W0 | ⬜ pending |
| 02-03-04 | 03 | 2 | PROP-04 | integration | `grep "shadow\|Shadow" src/components/editor/panels/` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | TYPO-01 | integration | `grep -r "google.*font\|fonts.googleapis" src/` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | TYPO-02 | integration | `grep "fontSize\|fontWeight\|lineHeight\|letterSpacing" src/components/editor/panels/` | ❌ W0 | ⬜ pending |
| 02-04-03 | 04 | 2 | TYPO-03 | integration | `grep "textAlign\|textTransform\|uppercase" src/components/editor/panels/` | ❌ W0 | ⬜ pending |
| 02-04-04 | 04 | 2 | TYPO-04 | integration | `grep "Headline\|Subhead\|Body\|Caption\|CTA" src/` | ❌ W0 | ⬜ pending |
| 02-05-01 | 05 | 3 | STYL-01 | integration | `grep "brandColors\|ColorSwatch" src/components/editor/panels/` | ❌ W0 | ⬜ pending |
| 02-05-02 | 05 | 3 | STYL-02 | integration | `grep "generatePalette\|complementary" src/` | ❌ W0 | ⬜ pending |
| 02-05-03 | 05 | 3 | STYL-03 | integration | `grep "typographyPresets\|TypographyPreset" src/components/editor/panels/` | ❌ W0 | ⬜ pending |
| 02-05-04 | 05 | 3 | STYL-04 | integration | `grep "background.*color\|pageBackground" src/components/editor/panels/` | ❌ W0 | ⬜ pending |
| 02-06-01 | 06 | 3 | COLR-01 | integration | `grep "react-colorful\|HexColorPicker" src/` | ❌ W0 | ⬜ pending |
| 02-06-02 | 06 | 3 | COLR-02 | manual | eyedropper tool test | N/A | ⬜ pending |
| 02-06-03 | 06 | 3 | COLR-03 | integration | `grep "predefinedPalettes\|PALETTES" src/` | ❌ W0 | ⬜ pending |
| 02-06-04 | 06 | 3 | COLR-04 | integration | `grep "recentColors\|recent.*color" src/` | ❌ W0 | ⬜ pending |
| 02-06-05 | 06 | 3 | COLR-05 | integration | `grep "swatchId\|updateSwatch" src/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install react-colorful, @dnd-kit/core, @dnd-kit/sortable
- [ ] Add `swatchId` to CUSTOM_PROPS in element-factory.ts
- [ ] Extend Project type for ColorSwatch[] brandColors

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Page thumbnail preview renders | PAGE-02, LPNL-05 | Visual rendering of canvas to thumbnail | Open Pages tab, verify thumbnail matches canvas content |
| Layer click selects canvas element | LPNL-04 | DOM-to-canvas interaction | Click layer row, verify canvas element highlights |
| Eyedropper picks color from canvas | COLR-02 | Browser EyeDropper API, canvas interaction | Click eyedropper, pick color from canvas element |
| Color picker popover positioning | COLR-01 | Visual popover placement | Click color swatch, verify popover appears nearby |
| Font renders in own typeface | TYPO-01 | Google Fonts visual rendering | Open font dropdown, verify each font previews correctly |
| Typography preset quick-apply | TYPO-04 | Visual text formatting | Select text, click Headline preset, verify style change |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
