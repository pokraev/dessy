# Roadmap: Leaflet Factory

## Overview

Four phases take Leaflet Factory from an empty Next.js repo to a fully functional AI-powered leaflet design tool. Phase 1 lays the canvas infrastructure that every other phase builds on. Phase 2 completes the editing surface — panels, multi-page, and color system. Phase 3 delivers the two headline output capabilities: AI image generation and raster export. Phase 4 closes the loop with the project dashboard, starter templates, and InDesign export.

## Phases

- [ ] **Phase 1: Canvas Foundation** - Working Fabric.js canvas in Next.js, all element types, persistence, and app shell
- [ ] **Phase 2: Editor Surface** - All panels (layers, properties, typography, style), multi-page support, color system
- [ ] **Phase 3: AI and Export** - PromptCrafter, Gemini image generation, PNG/JPG export
- [ ] **Phase 4: Dashboard, Templates, and InDesign Export** - Project management dashboard, starter template gallery, ExtendScript export

## Phase Details

### Phase 1: Canvas Foundation
**Goal**: Users can create, manipulate, and persist a multi-element leaflet document on a mm-based Fabric.js canvas
**Depends on**: Nothing (first phase)
**Requirements**: CANV-01, CANV-02, CANV-03, CANV-04, CANV-05, CANV-06, CANV-07, CANV-08, CANV-09, CANV-10, ELEM-01, ELEM-02, ELEM-03, ELEM-04, ELEM-05, PERS-01, PERS-02, PERS-03, EXPO-03, UXSH-01, UXSH-02, UXSH-03, UXSH-04, UXSH-05, UXSH-06
**Success Criteria** (what must be TRUE):
  1. User can open the editor, see a mm-dimensioned canvas with bleed and margin guides, add text/image/shape/color-block elements, and manipulate them with drag, resize, rotate, snap guides, zoom, and pan
  2. User can undo and redo at least 50 steps with Ctrl+Z / Ctrl+Shift+Z and use copy, paste, delete, nudge, and right-click context menu without data loss
  3. User can close the browser and reopen the editor to find the project exactly as left (auto-save to localStorage every 30 seconds)
  4. User can save the project as a JSON file and load it back, restoring all elements and layout
  5. The editor UI is dark-themed with a visible header (project name, save, undo/redo, export), bottom bar (zoom, page indicator, grid toggle), collapsible panels, and keyboard shortcuts overlay accessible via ?
**Plans:** 3/6 plans executed

Plans:
- [ ] 01-01-PLAN.md — Project scaffold, types, unit system, stores, dark theme, test framework
- [ ] 01-02-PLAN.md — Fabric.js canvas mount, element factory (all 5 types), zoom/pan
- [ ] 01-03-PLAN.md — Editor UI shell: layout, header, toolbar, bottom bar, toasts
- [ ] 01-04-PLAN.md — Guides overlay (bleed, margin, fold), rulers, snap alignment
- [ ] 01-05-PLAN.md — Undo/redo, keyboard shortcuts, context menu, shortcuts overlay
- [ ] 01-06-PLAN.md — Persistence: auto-save, localStorage, IndexedDB, JSON export/import

### Phase 2: Editor Surface
**Goal**: Users have a complete editing surface with layers, properties, typography, style, multi-page support, and a full color system
**Depends on**: Phase 1
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04, LPNL-01, LPNL-02, LPNL-03, LPNL-04, LPNL-05, PROP-01, PROP-02, PROP-03, PROP-04, TYPO-01, TYPO-02, TYPO-03, TYPO-04, STYL-01, STYL-02, STYL-03, STYL-04, COLR-01, COLR-02, COLR-03, COLR-04, COLR-05
**Success Criteria** (what must be TRUE):
  1. User can add, remove, duplicate, and reorder pages, and bifold/trifold formats automatically create the correct page count with fold line guides visible on canvas
  2. User can select, rename, reorder, hide, and lock layers via the left panel, and clicking a layer selects the corresponding canvas element
  3. User can select any element and edit its position, size, rotation, opacity, fill, border, shadow, and corner radius in the right properties panel with mm-based precision
  4. User can select a text frame and apply a Google Font, set weight/size/line-height/letter-spacing/color/alignment, and apply typography presets (Headline, Subhead, Body, Caption, CTA)
  5. User can define up to 10 brand color swatches, pick colors with HEX/RGB/HSL input and eyedropper, choose from predefined palettes, and apply global swatches that update everywhere when changed
**Plans**: TBD

### Phase 3: AI and Export
**Goal**: Users can generate on-brand AI images via PromptCrafter and export finished leaflets as PNG or JPG
**Depends on**: Phase 2
**Requirements**: AIPC-01, AIPC-02, AIPC-03, AIPC-04, AIPC-05, AIMG-01, AIMG-02, AIMG-03, AIMG-04, EXPO-01
**Success Criteria** (what must be TRUE):
  1. User can type a basic image description, click Enrich, and receive 3 enriched prompt variations (Editorial, Lifestyle, Bold) that incorporate leaflet context and brand colors
  2. User can customize a prompt via mood, lighting, composition, style, and background controls that live-update the visible prompt text, then generate an image and see a loading state during generation
  3. User can click "Use This" to place a generated image into the selected canvas frame, or Regenerate or Edit Prompt without losing prior work
  4. User can browse a history of all generated images and reuse any without regenerating
  5. User can export any page as PNG or JPG from the editor
**Plans**: TBD

### Phase 4: Dashboard, Templates, and InDesign Export
**Goal**: Users can manage projects from a dashboard, start from templates, and export InDesign-ready ExtendScript files
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, TMPL-01, TMPL-02, EXPO-02, EXPO-04
**Success Criteria** (what must be TRUE):
  1. User can see a project grid with thumbnails, titles, last-edited dates, and format badges, and create, delete, duplicate, and rename projects from the dashboard
  2. User can open the template gallery, choose a starter template from a named category (Sale, Event, Restaurant, Real Estate, etc.), and open it as a new editable project
  3. User can export a leaflet as an InDesign ExtendScript (.jsx) file that, when run in InDesign, recreates text frames, image frames, shapes, and colors from the design
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Canvas Foundation | 3/6 | In Progress|  |
| 2. Editor Surface | 0/TBD | Not started | - |
| 3. AI and Export | 0/TBD | Not started | - |
| 4. Dashboard, Templates, and InDesign Export | 0/TBD | Not started | - |
