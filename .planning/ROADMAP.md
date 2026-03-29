# Roadmap: Leaflet Factory

## Overview

Four phases take Leaflet Factory from an empty Next.js repo to a fully functional AI-powered leaflet design tool. Phase 1 lays the canvas infrastructure that every other phase builds on. Phase 2 completes the editing surface — panels, multi-page, and color system. Phase 3 delivers the two headline output capabilities: AI image generation and raster export. Phase 4 closes the loop with the project dashboard, starter templates, and InDesign export.

## Phases

- [x] **Phase 1: Canvas Foundation** - Working Fabric.js canvas in Next.js, all element types, persistence, and app shell (completed 2026-03-27)
- [x] **Phase 01.1: AI Leaflet Generation** - AI-powered leaflet generation from text prompt, photo, or sketch (INSERTED) (completed 2026-03-27)
- [x] **Phase 2: Editor Surface** - All panels (layers, properties, typography, style), multi-page support, color system (completed 2026-03-29)
- [ ] **Phase 3: Export** - PNG/JPEG raster, InDesign ExtendScript, CorelDraw SVG + VBA macro
- [x] **Phase 4: AI PromptCrafter** - Prompt enrichment, AI image generation, image history (completed 2026-03-29)
- [ ] **Phase 5: Dashboard and Templates** - Project management dashboard, starter template gallery

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
**Plans:** 6/6 plans complete

Plans:
- [ ] 01-01-PLAN.md — Project scaffold, types, unit system, stores, dark theme, test framework
- [ ] 01-02-PLAN.md — Fabric.js canvas mount, element factory (all 5 types), zoom/pan
- [ ] 01-03-PLAN.md — Editor UI shell: layout, header, toolbar, bottom bar, toasts
- [ ] 01-04-PLAN.md — Guides overlay (bleed, margin, fold), rulers, snap alignment
- [ ] 01-05-PLAN.md — Undo/redo, keyboard shortcuts, context menu, shortcuts overlay
- [ ] 01-06-PLAN.md — Persistence: auto-save, localStorage, IndexedDB, JSON export/import

### Phase 01.1: AI Leaflet Generation (INSERTED)

**Goal:** Users can generate an initial leaflet layout from a text prompt, photo of an existing leaflet, or hand-drawn sketch, and load it directly into the Fabric.js canvas editor
**Requirements**: AIGEN-01, AIGEN-02, AIGEN-03, AIGEN-04, AIGEN-05, AIGEN-06, AIGEN-07, AIGEN-08
**Depends on:** Phase 1
**Success Criteria** (what must be TRUE):
  1. User can open an AI generation modal from the editor header and choose between Prompt, Photo, and Sketch tabs
  2. User can type a text description, select a fold type and style, and generate a leaflet layout via AI
  3. User can upload a photo or sketch and have the AI interpret it into an editable Fabric.js layout
  4. User can preview the generated result and click "Load into Editor" to place it on the canvas with all elements selectable and editable
  5. Multi-page fold types (bifold, trifold, z-fold) create the correct number of pages in the project
**Plans:** 4/4 plans complete

Plans:
- [ ] 01.1-01-PLAN.md — AI service layer: types, provider abstraction (Claude + Gemini), system prompt, schema validator, API route
- [ ] 01.1-02-PLAN.md — Generation modal UI: 3-tab modal, fold type picker, style picker, preview component, Header integration
- [ ] 01.1-03-PLAN.md — Canvas integration: load generated layouts into canvas and project store
- [ ] 01.1-04-PLAN.md — Gap closure: add AIGEN-01 through AIGEN-08 requirement definitions to REQUIREMENTS.md

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
**Plans:** 7/7 plans executed

Plans:
- [ ] 02-01-PLAN.md — Foundation: install deps, extend types/stores, hooks (useSelectedObject, useCanvasLayers), shared components (NumberInput, ColorPicker), color utilities
- [ ] 02-02-PLAN.md — Left Panel: tabbed container (Tools/Layers/Pages), LayersPanel with @dnd-kit drag reorder, PagesPanel with thumbnails
- [ ] 02-03-PLAN.md — Properties Panel: context-sensitive sections (Position, Fill, Stroke, Shadow, FitMode, PageSection)
- [ ] 02-04-PLAN.md — Typography: Google Fonts hook and dropdown, TypographySection with controls and preset buttons
- [ ] 02-05-PLAN.md — Multi-Page CRUD: page-crud utilities, projectStore page actions, PagesPanel + BottomBar wiring
- [ ] 02-06-PLAN.md — Brand & Style: swatch-sync, preset-sync, StyleSection with brand swatches, palette generator, preset editor
- [ ] 02-07-PLAN.md — Integration: format-aware page init, store initialization, visual checkpoint

### Phase 3: Export (PNG/JPEG, InDesign, CorelDraw)
**Goal**: Users can export finished leaflets as PNG/JPEG raster images, InDesign ExtendScript (.jsx), and CorelDraw-compatible formats (SVG + VBA macro)
**Depends on**: Phase 2
**Requirements**: EXPO-01, EXPO-02, EXPO-04, EXPO-05, EXPO-06
**Success Criteria** (what must be TRUE):
  1. User can export any page as PNG or JPEG at 72/150/300 DPI; multi-page projects export as a ZIP
  2. User can export an InDesign ExtendScript (.jsx) that recreates text frames, image frames, shapes, colors, and fonts with correct mm positioning
  3. User can export CorelDraw-compatible SVG (per page or ZIP) with correct mm dimensions and embedded images
  4. User can export a CorelDraw VBA macro (.bas) that recreates the layout programmatically
  5. Export modal offers all formats with clear options (format, DPI, single page vs all pages)
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Shared export utilities (page collector, color conversion, unit mapping) + raster export (PNG/JPEG)
- [ ] 03-02-PLAN.md — InDesign ExtendScript (.jsx) generation with object mapping
- [ ] 03-03-PLAN.md — CorelDraw export (SVG + VBA macro generation)
- [ ] 03-04-PLAN.md — Export modal UI with format picker, DPI options, progress indicator

### Phase 4: AI PromptCrafter and Image Generation
**Goal**: Users can generate on-brand AI images via PromptCrafter and place them into canvas frames
**Depends on**: Phase 2
**Requirements**: AIPC-01, AIPC-02, AIPC-03, AIPC-04, AIPC-05, AIMG-01, AIMG-02, AIMG-03, AIMG-04
**Success Criteria** (what must be TRUE):
  1. User can type a basic image description, click Enrich, and receive 3 enriched prompt variations (Editorial, Lifestyle, Bold) that incorporate leaflet context and brand colors
  2. User can customize a prompt via mood, lighting, composition, style, and background controls that live-update the visible prompt text
  3. User can click "Use This" to place a generated image into the selected canvas frame, or Regenerate or Edit Prompt without losing prior work
  4. User can browse a history of all generated images and reuse any without regenerating
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Types, AI service layer (enrichment, image generation, prompt assembly), store, unit tests
- [ ] 04-02-PLAN.md — PromptCrafter modal UI, Header/ImageSection wiring, visual checkpoint

### Phase 5: Dashboard and Templates
**Goal**: Users can manage projects from a dashboard with card grid, create new projects from blank formats or starter templates, and navigate between dashboard and editor via Zustand view switching
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, TMPL-01, TMPL-02
**Success Criteria** (what must be TRUE):
  1. User can see a project grid with thumbnails, titles, last-edited dates, and format badges
  2. User can create, delete, duplicate, and rename projects from the dashboard
  3. User can open the template gallery, choose a starter template, and open it as a new editable project
**Plans**: 4 plans

Plans:
- [ ] 05-01-PLAN.md — Foundation: appStore (view switching), thumbnailDb (IndexedDB), projectStorage extensions, relativeTime utility, i18n strings
- [ ] 05-02-PLAN.md — Dashboard UI: Dashboard, ProjectGrid, ProjectCard, ProjectCardMenu, EmptyState components
- [ ] 05-03-PLAN.md — Templates: 10 template JSON files, templates-index manifest, NewLeafletModal, TemplateGallery
- [ ] 05-04-PLAN.md — Wiring: App.tsx view switching, Header logo navigation, thumbnail capture on save, integration checkpoint

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Canvas Foundation | 6/6 | Complete   | 2026-03-27 |
| 01.1. AI Leaflet Generation | 4/4 | Complete   | 2026-03-27 |
| 2. Editor Surface | 7/7 | Complete   | 2026-03-29 |
| 3. Export | 0/4 | Not started | - |
| 4. AI PromptCrafter | 2/2 | Complete   | 2026-03-29 |
| 5. Dashboard and Templates | 0/4 | Not started | - |
