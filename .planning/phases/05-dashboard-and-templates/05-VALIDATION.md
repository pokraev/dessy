---
phase: 5
slug: dashboard-and-templates
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 + ts-jest + jsdom |
| **Config file** | `jest.config.ts` (project root) |
| **Quick run command** | `npx jest --testPathPattern="dashboard\|thumbnail\|projectStorage\|templates" --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="dashboard\|thumbnail\|projectStorage\|templates" --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DASH-01 | unit | `npx jest --testPathPattern="projectStorage" -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | DASH-02 | unit | `npx jest --testPathPattern="projectStorage" -x` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | DASH-03 | unit | `npx jest --testPathPattern="projectStorage" -x` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | DASH-04 | unit | `npx jest --testPathPattern="templates" -x` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | TMPL-01 | unit | `npx jest --testPathPattern="templates-index" -x` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 1 | TMPL-02 | unit | `npx jest --testPathPattern="templates-index" -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/storage/__tests__/projectStorage.test.ts` — stubs for DASH-01, DASH-02, DASH-03
- [ ] `src/lib/templates/__tests__/templates-index.test.ts` — stubs for TMPL-01, TMPL-02
- [ ] `src/lib/storage/__tests__/thumbnailDb.test.ts` — thumbnail store/retrieve with IndexedDB mock

*Existing infrastructure covers framework install — Jest is already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Project grid renders with thumbnails, titles, dates, badges | DASH-01 | Visual layout in browser | Open dashboard, verify card grid shows all project metadata |
| 3-dot menu hover, rename/duplicate/delete flows | DASH-03 | Interactive UI flow | Hover card, click menu, test each action |
| Template gallery category tabs and preview modal | DASH-04 | Visual/interactive | Open New Leaflet modal, browse Templates tab, click preview |
| Empty state illustration + CTA | DASH-01 | Visual | Clear all projects, verify empty state renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
