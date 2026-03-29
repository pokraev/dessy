# Roadmap: Dessy InDesign Plugin

## Overview

Starting from nothing, the plugin is built in five phases: a loadable scaffold with correct UXP foundations; data and template discovery that brings Excel data and document tags into panel state; a mapping UI where the user connects columns to placeholders; the fill engine that copies the template and applies all mapped data as a single undo step; and a final error-handling pass that gives clear feedback on every failure mode. Each phase is independently verifiable and feeds the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold** - Loadable UXP plugin with correct manifest, InDesign DOM access, and file I/O wired (completed 2026-03-29)
- [ ] **Phase 2: Data and Template Discovery** - Excel parsed into panel state; document tags scanned and listed
- [ ] **Phase 3: Mapping UI** - User maps Excel columns to template tags and selects a data row
- [ ] **Phase 4: Fill Engine** - Template copied non-destructively and all placeholders filled as a single undo step
- [ ] **Phase 5: Error Handling** - Pre- and post-apply validation with clear panel feedback on every failure

## Phase Details

### Phase 1: Scaffold
**Goal**: A loadable UXP plugin that connects correctly to InDesign, uses the right import patterns, and can open a file picker
**Depends on**: Nothing (first phase)
**Requirements**: (no v1 requirement IDs — foundational infrastructure that all features depend on)
**Success Criteria** (what must be TRUE):
  1. Plugin loads in InDesign via UDT without manifest errors
  2. Panel UI is visible in InDesign with a working entry point
  3. InDesign DOM is accessible via `require('indesign')` with no runtime errors
  4. File picker opens and returns a selected file path via UXP Storage API
  5. All InDesign DOM collection access uses `.item(n)`, not bracket notation
**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Initialize bolt-uxp scaffold with Preact, manifest v5, and project structure
- [x] 01-02-PLAN.md — Wire InDesign DOM access, file picker, and verify all platform integrations

### Phase 2: Data and Template Discovery
**Goal**: Users can load an Excel file and see its columns/rows in the panel; the panel also shows all `{{Tag}}` placeholders found in the active document
**Depends on**: Phase 1
**Requirements**: EXCEL-01, EXCEL-02, EXCEL-03, SCAN-01, SCAN-02, SCAN-03, SCAN-04
**Success Criteria** (what must be TRUE):
  1. User opens an .xlsx file and sees column headers and all data rows listed in the panel
  2. User can select which data row to apply from the row list
  3. Panel lists every unique `{{Tag}}` found in text frames across all pages
  4. Panel lists every `{{Tag}}` found in image/graphic frames
  5. Tagged frames are visually highlighted on the InDesign canvas after scanning
**Plans:** 3 plans

Plans:
- [ ] 02-01-PLAN.md — Download SheetJS bundle, implement Excel parser service, create unit tests
- [ ] 02-02-PLAN.md — Implement template scanner with tag extraction, navigation, and highlight
- [ ] 02-03-PLAN.md — Build panel UI with data table, tag list, row selection, and highlight toggle

### Phase 3: Mapping UI
**Goal**: Users can manually assign each Excel column to a template tag, see which tags are mapped, and save/reload mapping presets
**Depends on**: Phase 2
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04
**Success Criteria** (what must be TRUE):
  1. User can assign any Excel column to any discovered template tag via a mapping table in the panel
  2. Panel visually distinguishes mapped tags from unmapped tags
  3. Panel warns when an image-type tag is assigned to a text column (or vice versa)
  4. User can save the current mapping as a named preset and reload it on a future session
**Plans**: TBD

Plans:
- [ ] 03-01: Build mapping table UI with column-to-tag assignment and mapped/unmapped visual feedback
- [ ] 03-02: Add type-mismatch warning logic and preset save/load using UXP Storage

### Phase 4: Fill Engine
**Goal**: Clicking Apply creates a copy of the template, replaces all text placeholders and image frames with mapped Excel data, and the entire operation is reversible with a single Cmd+Z
**Depends on**: Phase 3
**Requirements**: FILL-01, FILL-02, FILL-03, FILL-04, PREV-01
**Success Criteria** (what must be TRUE):
  1. User can preview the mapped values for the selected row in the panel before applying
  2. Clicking Apply creates a new document that is a copy of the original template (original is unchanged)
  3. All `{{Tag}}` text placeholders in the copy are replaced with the correct Excel values
  4. All image-tagged frames in the copy receive the local file image from the Excel cell path
  5. A single Cmd+Z reverts all fill changes at once (no per-frame undo steps)
**Plans**: TBD

Plans:
- [ ] 04-01: Implement preview panel showing mapped column values for selected row
- [ ] 04-02: Implement applier service: template copy, text fill, wrapped in `app.doScript()` with `UndoModes.ENTIRE_SCRIPT`
- [ ] 04-03: Implement image placement with POSIX path normalization and verify single-undo behavior

### Phase 5: Error Handling
**Goal**: Every fill failure is visible — users see which tags were not filled, which image paths are missing, and whether any text overflows its frame
**Depends on**: Phase 4
**Requirements**: ERR-01, ERR-02, ERR-03
**Success Criteria** (what must be TRUE):
  1. After applying, the panel lists every `{{Tag}}` that was not filled, by name
  2. Before applying, the panel warns about any image file paths in the Excel data that don't exist on disk
  3. After applying, the panel reports any text frames where the filled content causes overset text
**Plans**: TBD

Plans:
- [ ] 05-01: Implement pre-apply image path validation and post-apply unfilled tag report
- [ ] 05-02: Implement post-apply overset text detection and panel warning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold | 2/2 | Complete   | 2026-03-29 |
| 2. Data and Template Discovery | 0/3 | Not started | - |
| 3. Mapping UI | 0/2 | Not started | - |
| 4. Fill Engine | 0/3 | Not started | - |
| 5. Error Handling | 0/2 | Not started | - |
