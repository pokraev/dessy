---
phase: 1
slug: scaffold
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (UXP plugin — no automated test framework for InDesign DOM) |
| **Config file** | none — Phase 1 establishes scaffold |
| **Quick run command** | `npm run build` (Vite build succeeds) |
| **Full suite command** | `npm run build && echo "Load in UDT and verify panel"` |
| **Estimated runtime** | ~5 seconds (build) + manual UDT load |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Build + manual UDT load verification
- **Before `/gsd:verify-work`:** Full build must succeed, plugin must load in InDesign
- **Max feedback latency:** 5 seconds (build), manual verification as needed

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | (scaffold) | build | `npm run build` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | (scaffold) | build | `npm run build` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | (scaffold) | build | `npm run build` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | (scaffold) | manual | UDT load + file picker test | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — bolt-uxp scaffold with build scripts
- [ ] `vite.config.js` — Vite config for UXP plugin bundling
- [ ] `manifest.json` — UXP manifest v5 with correct permissions

*Existing infrastructure covers all phase requirements after scaffold creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Plugin loads in InDesign | SC-1 | Requires running InDesign + UDT | Load plugin via UDT, verify panel appears |
| Panel UI visible | SC-2 | Requires InDesign UI | Open Plugins > Dessy, verify panel renders |
| InDesign DOM accessible | SC-3 | Requires InDesign runtime | Click test button, verify console logs DOM object |
| File picker works | SC-4 | Requires InDesign + UXP storage | Click file picker, select .xlsx, verify path logged |
| `.item(n)` patterns | SC-5 | Requires InDesign DOM | Run collection access test, verify no undefined |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
