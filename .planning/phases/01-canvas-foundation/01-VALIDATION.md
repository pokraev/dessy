---
phase: 1
slug: canvas-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest |
| **Config file** | jest.config.ts (created in Plan 01-01 Task 1) |
| **Quick run command** | `npx jest --no-coverage` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --no-coverage`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01 | 1 | CANV-01,UXSH-01 | smoke | `npm run build` | N/A | pending |
| 01-01-T2 | 01 | 1 | CANV-01 | unit | `npx jest --no-coverage --testPathPattern="units\|formats"` | W0 (created in task) | pending |
| 01-02-T1 | 02 | 2 | CANV-01,CANV-02 | unit+build | `npx jest --no-coverage --testPathPattern="units\|formats" && npx tsc --noEmit && npm run build` | yes (from 01-01-T2) | pending |
| 01-02-T2 | 02 | 2 | ELEM-01..05,CANV-04 | unit | `npx jest --no-coverage --testPathPattern="element-factory"` | W0 (created in task) | pending |
| 01-03-T1 | 03 | 2 | UXSH-02..05 | build | `npx tsc --noEmit && npm run build` | N/A | pending |
| 01-03-T2 | 03 | 2 | UXSH-02..05 | build | `npx tsc --noEmit && npm run build` | N/A | pending |
| 01-04-T1 | 04 | 3 | CANV-03,CANV-05,CANV-06 | build | `npx tsc --noEmit && npm run build` | N/A | pending |
| 01-04-T2 | 04 | 3 | CANV-03 | build | `npx tsc --noEmit && npm run build` | N/A | pending |
| 01-05-T1 | 05 | 3 | CANV-07..10 | unit | `npx jest --no-coverage --testPathPattern="useHistory"` | W0 (created in task) | pending |
| 01-05-T2 | 05 | 3 | CANV-08..10,UXSH-06 | build | `npx tsc --noEmit && npm run build` | N/A | pending |
| 01-06-T1 | 06 | 4 | PERS-01..03,EXPO-03 | unit | `npx jest --no-coverage --testPathPattern="projectStorage\|imageDb\|serialization"` | W0 (created in task) | pending |
| 01-06-T2 | 06 | 4 | PERS-01..03 | build | `npx tsc --noEmit && npm run build` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `jest` + `@testing-library/react` + `@testing-library/jest-dom` + `jest-environment-jsdom` + `ts-jest` — test framework setup (Plan 01-01 Task 1)
- [x] `jest.config.ts` — configure jsdom environment, path aliases, ts-jest transform (Plan 01-01 Task 1)
- [x] `jest.setup.ts` — import `@testing-library/jest-dom` (Plan 01-01 Task 1)
- [ ] `src/lib/__tests__/units.test.ts` — unit conversion tests (Plan 01-01 Task 2)
- [ ] `src/constants/__tests__/formats.test.ts` — format preset tests (Plan 01-01 Task 2)
- [ ] `src/lib/__tests__/element-factory.test.ts` — element factory tests (Plan 01-02 Task 2)
- [ ] `src/hooks/__tests__/useHistory.test.ts` — undo/redo tests (Plan 01-05 Task 1)
- [ ] `src/lib/storage/__tests__/projectStorage.test.ts` — localStorage CRUD tests (Plan 01-06 Task 1)
- [ ] `src/lib/storage/__tests__/imageDb.test.ts` — IndexedDB image store tests (Plan 01-06 Task 1)
- [ ] `src/lib/__tests__/serialization.test.ts` — JSON export/import tests (Plan 01-06 Task 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Snap guides visible during drag | CANV-03 | Visual alignment rendering | Drag element near another; magenta guides should appear |
| Bleed overlay renders correctly | CANV-05 | Visual red-tinted overlay | Open editor; red semi-transparent zone visible outside safe area |
| Fold lines for trifold | CANV-06 | Visual dashed lines | Create trifold document; verify 2 vertical dashed lines at 1/3 and 2/3 |
| Keyboard shortcuts overlay | UXSH-06 | Modal rendering | Press ? key; overlay should show all shortcuts |
| Dark theme consistency | UXSH-01 | Visual design system check | Verify all surfaces match CLAUDE.md color spec |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
