# Requirements: Leaflet Factory

**Defined:** 2026-03-27
**Core Value:** Speed — full leaflet from zero to print-ready in minutes, with AI handling on-brand image generation

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Canvas Editor

- [x] **CANV-01**: User can create a new document with mm-based dimensions (A4, A5, DL, bifold, trifold, custom)
- [ ] **CANV-02**: User can drag, resize, and rotate elements on canvas with selection handles
- [ ] **CANV-03**: User can see snap guides when aligning elements to edges, centers, and other elements
- [ ] **CANV-04**: User can zoom (fit, 50%, 100%, 200%, scroll-to-zoom) and pan the canvas
- [ ] **CANV-05**: User can see bleed guides (3mm) and configurable margin guides on canvas
- [ ] **CANV-06**: User can see fold lines as dashed guides for bifold/trifold formats
- [ ] **CANV-07**: User can undo/redo at least 50 steps with Ctrl+Z / Ctrl+Shift+Z
- [ ] **CANV-08**: User can copy/paste elements with Ctrl+C / Ctrl+V
- [ ] **CANV-09**: User can delete elements with Delete key, nudge with arrow keys (1px, Shift+10px)
- [ ] **CANV-10**: User can right-click elements for context menu (bring forward, send back, duplicate, delete, lock)

### Elements

- [ ] **ELEM-01**: User can create text frames and edit text inline (double-click to edit)
- [ ] **ELEM-02**: User can create image frames and drop/upload images with fit modes (fill, fit, stretch)
- [ ] **ELEM-03**: User can create shapes (rectangle, circle, line) with rounded corners option
- [ ] **ELEM-04**: User can create solid or gradient color blocks
- [ ] **ELEM-05**: User can group and ungroup elements

### Multi-Page

- [ ] **PAGE-01**: User can add, remove, and reorder pages in a project
- [ ] **PAGE-02**: User can navigate between pages via thumbnail strip at bottom/left
- [ ] **PAGE-03**: User can duplicate a page
- [ ] **PAGE-04**: Bifold/trifold formats automatically create the correct number of pages

### Left Panel

- [ ] **LPNL-01**: User can select tools via icon buttons (Select, Text, Rectangle, Circle, Line, Image, Hand)
- [ ] **LPNL-02**: User can see layer list with draggable reorder
- [ ] **LPNL-03**: User can toggle layer visibility (eye icon) and lock (lock icon)
- [ ] **LPNL-04**: User can click a layer to select it on canvas, double-click to rename
- [ ] **LPNL-05**: User can see page thumbnails and click to navigate

### Right Panel — Properties

- [ ] **PROP-01**: User can edit position (X, Y in mm), size (W, H in mm with lock aspect ratio), and rotation
- [ ] **PROP-02**: User can adjust opacity (0-100%) and corner radius for shapes
- [ ] **PROP-03**: User can set border (color, width, style) and fill (solid, gradient, none)
- [ ] **PROP-04**: User can toggle shadow with offset, blur, and color controls

### Right Panel — Typography

- [ ] **TYPO-01**: User can select font family from searchable dropdown with Google Fonts
- [ ] **TYPO-02**: User can set font weight, size (pt), line height, letter spacing, and color
- [ ] **TYPO-03**: User can set text alignment (left, center, right, justify) and transform (uppercase, lowercase, capitalize)
- [ ] **TYPO-04**: User can apply typography presets (Headline, Subhead, Body, Caption, CTA)

### Right Panel — Style

- [ ] **STYL-01**: User can define brand colors (up to 10 swatches) with color picker
- [ ] **STYL-02**: User can generate complementary palette from a single color
- [ ] **STYL-03**: User can define and apply typography presets globally
- [ ] **STYL-04**: User can set background color per page

### AI — PromptCrafter

- [ ] **AIPC-01**: User can type a basic image description in a text area
- [ ] **AIPC-02**: User can click "Enrich" to get 3 prompt variations (Editorial, Lifestyle, Bold) via Gemini
- [ ] **AIPC-03**: Prompt enrichment uses leaflet context, frame dimensions, frame position, and brand colors
- [ ] **AIPC-04**: User can customize prompt via mood, lighting, composition, style, and background controls
- [ ] **AIPC-05**: Each customization change live-updates the visible/editable prompt text

### AI — Image Generation

- [ ] **AIMG-01**: User can generate an image from the enriched prompt via Gemini
- [ ] **AIMG-02**: User can see loading state during generation and preview the result
- [ ] **AIMG-03**: User can "Use This" to place image into selected canvas frame, or "Regenerate" / "Edit Prompt"
- [ ] **AIMG-04**: User can see history of all generated images and click to reuse any

### Color System

- [ ] **COLR-01**: User can pick colors using react-colorful with HEX, RGB, and HSL input
- [ ] **COLR-02**: User can use eyedropper tool to pick color from canvas
- [ ] **COLR-03**: User can choose from 20+ predefined curated palettes
- [ ] **COLR-04**: User can see recently used colors
- [ ] **COLR-05**: User can define global swatches that update everywhere when changed

### Export

- [ ] **EXPO-01**: User can export pages as PNG or JPG
- [ ] **EXPO-02**: User can export InDesign ExtendScript (.jsx) that recreates the layout
- [ ] **EXPO-03**: User can save project as JSON file and load it back
- [ ] **EXPO-04**: InDesign export maps text frames, image frames, shapes, and colors to InDesign equivalents

### Dashboard & Templates

- [ ] **DASH-01**: User can see a grid of saved projects with thumbnails, titles, last-edited dates, and format badges
- [ ] **DASH-02**: User can create new project via "New Leaflet" button with format picker modal
- [ ] **DASH-03**: User can delete, duplicate, and rename projects
- [ ] **DASH-04**: User can start a new project from a template in the template gallery
- [ ] **TMPL-01**: Template gallery has 10-20 starter templates across categories (Sale, Event, Restaurant, Real Estate, Corporate, Fitness, Beauty, Education)
- [ ] **TMPL-02**: Templates are stored as serialized Fabric.js canvas state (JSON)

### Persistence

- [ ] **PERS-01**: Project auto-saves to localStorage every 30 seconds
- [ ] **PERS-02**: Project list persists in localStorage
- [ ] **PERS-03**: Generated images stored in IndexedDB (not localStorage) to avoid 5MB limit

### App Shell & UX

- [x] **UXSH-01**: App has dark theme editor UI matching the design system in CLAUDE.md
- [x] **UXSH-02**: Header shows project name, save button, undo/redo buttons, export button
- [x] **UXSH-03**: Bottom bar shows zoom slider, page indicator, and grid toggle
- [x] **UXSH-04**: All panels are collapsible with smooth animation
- [x] **UXSH-05**: Toast notifications for save, export, and errors (bottom-right)
- [ ] **UXSH-06**: Keyboard shortcuts overlay shown with ? key

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Export

- **EXPO-V2-01**: PDF export (client-side, 300/150/72 dpi, bleed marks, crop marks)

### Collaboration & Storage

- **CLST-01**: Cloud storage with user accounts (Supabase/Firebase)
- **CLST-02**: Real-time collaboration

### Advanced

- **ADVN-01**: Custom font upload
- **ADVN-02**: CMYK color management in-app
- **ADVN-03**: Expanded template library (50+)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Desktop web only; canvas interactions require mouse precision |
| Video/animation in leaflets | Static print focus; Fabric.js not optimized for animation |
| Built-in stock photo library | AI generation is the differentiator; users can upload own photos |
| AI-generated full layouts | Inconsistent results for print; AI assists images, human directs layout |
| Real-time collaboration (v1) | Full product in itself; requires WebSocket infra, conflict resolution |
| CMYK in-app (v1) | Defer to InDesign; incorrect CMYK simulation is worse than none |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CANV-01 | Phase 1 | Complete |
| CANV-02 | Phase 1 | Pending |
| CANV-03 | Phase 1 | Pending |
| CANV-04 | Phase 1 | Pending |
| CANV-05 | Phase 1 | Pending |
| CANV-06 | Phase 1 | Pending |
| CANV-07 | Phase 1 | Pending |
| CANV-08 | Phase 1 | Pending |
| CANV-09 | Phase 1 | Pending |
| CANV-10 | Phase 1 | Pending |
| ELEM-01 | Phase 1 | Pending |
| ELEM-02 | Phase 1 | Pending |
| ELEM-03 | Phase 1 | Pending |
| ELEM-04 | Phase 1 | Pending |
| ELEM-05 | Phase 1 | Pending |
| PERS-01 | Phase 1 | Pending |
| PERS-02 | Phase 1 | Pending |
| PERS-03 | Phase 1 | Pending |
| EXPO-03 | Phase 1 | Pending |
| UXSH-01 | Phase 1 | Complete |
| UXSH-02 | Phase 1 | Complete |
| UXSH-03 | Phase 1 | Complete |
| UXSH-04 | Phase 1 | Complete |
| UXSH-05 | Phase 1 | Complete |
| UXSH-06 | Phase 1 | Pending |
| PAGE-01 | Phase 2 | Pending |
| PAGE-02 | Phase 2 | Pending |
| PAGE-03 | Phase 2 | Pending |
| PAGE-04 | Phase 2 | Pending |
| LPNL-01 | Phase 2 | Pending |
| LPNL-02 | Phase 2 | Pending |
| LPNL-03 | Phase 2 | Pending |
| LPNL-04 | Phase 2 | Pending |
| LPNL-05 | Phase 2 | Pending |
| PROP-01 | Phase 2 | Pending |
| PROP-02 | Phase 2 | Pending |
| PROP-03 | Phase 2 | Pending |
| PROP-04 | Phase 2 | Pending |
| TYPO-01 | Phase 2 | Pending |
| TYPO-02 | Phase 2 | Pending |
| TYPO-03 | Phase 2 | Pending |
| TYPO-04 | Phase 2 | Pending |
| STYL-01 | Phase 2 | Pending |
| STYL-02 | Phase 2 | Pending |
| STYL-03 | Phase 2 | Pending |
| STYL-04 | Phase 2 | Pending |
| COLR-01 | Phase 2 | Pending |
| COLR-02 | Phase 2 | Pending |
| COLR-03 | Phase 2 | Pending |
| COLR-04 | Phase 2 | Pending |
| COLR-05 | Phase 2 | Pending |
| AIPC-01 | Phase 3 | Pending |
| AIPC-02 | Phase 3 | Pending |
| AIPC-03 | Phase 3 | Pending |
| AIPC-04 | Phase 3 | Pending |
| AIPC-05 | Phase 3 | Pending |
| AIMG-01 | Phase 3 | Pending |
| AIMG-02 | Phase 3 | Pending |
| AIMG-03 | Phase 3 | Pending |
| AIMG-04 | Phase 3 | Pending |
| EXPO-01 | Phase 3 | Pending |
| EXPO-02 | Phase 4 | Pending |
| EXPO-04 | Phase 4 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| TMPL-01 | Phase 4 | Pending |
| TMPL-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 69 total (REQUIREMENTS.md header previously stated 55 — actual count from document is 69)
- Mapped to phases: 69
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
