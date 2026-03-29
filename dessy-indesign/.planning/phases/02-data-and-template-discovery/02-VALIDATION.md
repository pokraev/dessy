---
phase: 2
slug: data-and-template-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Plain Node.js test scripts (no framework — UXP plugin context) |
| **Config file** | none — Wave 0 creates test files |
| **Quick run command** | `node tests/excelParser.test.js && node tests/templateScanner.test.js` |
| **Full suite command** | `node tests/excelParser.test.js && node tests/templateScanner.test.js` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node tests/excelParser.test.js && node tests/templateScanner.test.js`
- **After every plan wave:** Run full suite + manual smoke test in InDesign (load .xlsx, verify tag list)
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke test passing
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | EXCEL-01 | setup | download xlsx.full.min.js | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | EXCEL-02 | unit | `node tests/excelParser.test.js` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | EXCEL-03 | manual | — | manual-only | ⬜ pending |
| 02-02-01 | 02 | 1 | SCAN-01 | unit | `node tests/templateScanner.test.js` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | SCAN-02 | manual | — | manual-only | ⬜ pending |
| 02-02-03 | 02 | 1 | SCAN-03 | unit | `node tests/templateScanner.test.js` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | SCAN-04 | manual | — | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/excelParser.test.js` — stubs for EXCEL-02 (parse headers, data rows, empty xlsx, empty rows)
- [ ] `tests/templateScanner.test.js` — stubs for SCAN-01 (regex extraction), SCAN-03 (label parsing)
- [ ] `src/vendor/xlsx.full.min.js` — download SheetJS standalone bundle
- [ ] Convert service stubs from CJS to ESM exports (match `fileIO.js` pattern)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Row selector UI reflects selected row | EXCEL-03 | Requires UXP runtime + panel UI | Open panel, load xlsx, click row, verify highlight |
| Tag list renders text/image sections | SCAN-02 | Requires InDesign panel rendering | Open doc with {{tags}}, verify two-section list |
| Tagged frames highlighted on canvas | SCAN-04 | Requires InDesign document + DOM | Scan document, verify blue stroke on tagged frames |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
