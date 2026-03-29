# Requirements: Leaflet Factory

**Defined:** 2026-03-27
**Core Value:** Speed — full leaflet from zero to print-ready in minutes, with AI handling on-brand image generation

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Canvas Editor

- [x] **CANV-01**: User can create a new document with mm-based dimensions (A4, A5, DL, bifold, trifold, custom)
- [x] **CANV-02**: User can drag, resize, and rotate elements on canvas with selection handles
- [x] **CANV-03**: User can see snap guides when aligning elements to edges, centers, and other elements
- [x] **CANV-04**: User can zoom (fit, 50%, 100%, 200%, scroll-to-zoom) and pan the canvas
- [x] **CANV-05**: User can see bleed guides (3mm) and configurable margin guides on canvas
- [x] **CANV-06**: User can see fold lines as dashed guides for bifold/trifold formats
- [x] **CANV-07**: User can undo/redo at least 50 steps with Ctrl+Z / Ctrl+Shift+Z
- [x] **CANV-08**: User can copy/paste elements with Ctrl+C / Ctrl+V
- [x] **CANV-09**: User can delete elements with Delete key, nudge with arrow keys (1px, Shift+10px)
- [x] **CANV-10**: User can right-click elements for context menu (bring forward, send back, duplicate, delete, lock)

### Elements

- [x] **ELEM-01**: User can create text frames and edit text inline (double-click to edit)
- [x] **ELEM-02**: User can create image frames and drop/upload images with fit modes (fill, fit, stretch)
- [x] **ELEM-03**: User can create shapes (rectangle, circle, line) with rounded corners option
- [x] **ELEM-04**: User can create solid or gradient color blocks
- [x] **ELEM-05**: User can group and ungroup elements

### AI Layout Generation

- [x] **AIGEN-01**: User can open an AI generation modal from the editor header with Prompt, Photo, and Sketch tabs
- [x] **AIGEN-02**: User can type a text description, select a fold type (single/bifold/trifold/z-fold) and style (minimal/bold/corporate/playful/elegant), and generate a leaflet layout via AI
- [x] **AIGEN-03**: AI service layer supports both Claude (Anthropic) and Gemini providers via a provider-agnostic abstraction
- [x] **AIGEN-04**: User can upload a photo of an existing leaflet and have the AI interpret it into an editable layout with placeholder text
- [x] **AIGEN-05**: User can upload a hand-drawn sketch and have the AI interpret boxes, scribbles, and blobs into a structured layout
- [x] **AIGEN-06**: Fold-type-aware generation produces the correct number of pages/panels (1 for single, 4 for bifold, 6 for trifold/z-fold)
- [x] **AIGEN-07**: User can preview generated results and click "Load into Editor" to place the layout on the canvas with all elements selectable and editable
- [x] **AIGEN-08**: AI-generated canvas JSON is validated against the Fabric.js schema and automatically repaired if malformed

### Multi-Page

- [x] **PAGE-01**: User can add, remove, and reorder pages in a project
- [x] **PAGE-02**: User can navigate between pages via thumbnail strip at bottom/left
- [x] **PAGE-03**: User can duplicate a page
- [x] **PAGE-04**: Bifold/trifold formats automatically create the correct number of pages

### Left Panel

- [x] **LPNL-01**: User can select tools via icon buttons (Select, Text, Rectangle, Circle, Line, Image, Hand)
- [x] **LPNL-02**: User can see layer list with draggable reorder
- [x] **LPNL-03**: User can toggle layer visibility (eye icon) and lock (lock icon)
- [x] **LPNL-04**: User can click a layer to select it on canvas, double-click to rename
- [x] **LPNL-05**: User can see page thumbnails and click to navigate

### Right Panel — Properties

- [x] **PROP-01**: User can edit position (X, Y in mm), size (W, H in mm with lock aspect ratio), and rotation
- [x] **PROP-02**: User can adjust opacity (0-100%) and corner radius for shapes
- [x] **PROP-03**: User can set border (color, width, style) and fill (solid, gradient, none)
- [x] **PROP-04**: User can toggle shadow with offset, blur, and color controls

### Right Panel — Typography

- [x] **TYPO-01**: User can select font family from searchable dropdown with Google Fonts
- [x] **TYPO-02**: User can set font weight, size (pt), line height, letter spacing, and color
- [x] **TYPO-03**: User can set text alignment (left, center, right, justify) and transform (uppercase, lowercase, capitalize)
- [x] **TYPO-04**: User can apply typography presets (Headline, Subhead, Body, Caption, CTA)

### Right Panel — Style

- [x] **STYL-01**: User can define brand colors (up to 10 swatches) with color picker
- [x] **STYL-02**: User can generate complementary palette from a single color
- [x] **STYL-03**: User can define and apply typography presets globally
- [x] **STYL-04**: User can set background color per page

### AI — PromptCrafter

- [x] **AIPC-01**: User can type a basic image description in a text area
- [x] **AIPC-02**: User can click "Enrich" to get 3 prompt variations (Editorial, Lifestyle, Bold) via Gemini
- [x] **AIPC-03**: Prompt enrichment uses leaflet context, frame dimensions, frame position, and brand colors
- [x] **AIPC-04**: User can customize prompt via mood, lighting, composition, style, and background controls
- [x] **AIPC-05**: Each customization change live-updates the visible/editable prompt text

### AI — Image Generation

- [x] **AIMG-01**: User can generate an image from the enriched prompt via Gemini
- [x] **AIMG-02**: User can see loading state during generation and preview the result
- [x] **AIMG-03**: User can "Use This" to place image into selected canvas frame, or "Regenerate" / "Edit Prompt"
- [x] **AIMG-04**: User can see history of all generated images and click to reuse any

### Color System

- [x] **COLR-01**: User can pick colors using react-colorful with HEX, RGB, and HSL input
- [x] **COLR-02**: User can use eyedropper tool to pick color from canvas
- [x] **COLR-03**: User can choose from 20+ predefined curated palettes
- [x] **COLR-04**: User can see recently used colors
- [x] **COLR-05**: User can define global swatches that update everywhere when changed

### Export

- [ ] **EXPO-01**: User can export pages as PNG or JPG (single page or all pages as ZIP)
- [ ] **EXPO-02**: User can export InDesign ExtendScript (.jsx) that recreates the layout
- [x] **EXPO-03**: User can save project as JSON file and load it back
- [ ] **EXPO-04**: InDesign export maps text frames, image frames, shapes, and colors to InDesign equivalents
- [ ] **EXPO-05**: User can export CorelDraw-compatible SVG files (per page or ZIP)
- [ ] **EXPO-06**: User can export CorelDraw VBA macro (.bas) that recreates the layout

### Dashboard & Templates

- [x] **DASH-01**: User can see a grid of saved projects with thumbnails, titles, last-edited dates, and format badges
- [x] **DASH-02**: User can create new project via "New Leaflet" button with format picker modal
- [x] **DASH-03**: User can delete, duplicate, and rename projects
- [ ] **DASH-04**: User can start a new project from a template in the template gallery
- [ ] **TMPL-01**: Template gallery has 10-20 starter templates across categories (Sale, Event, Restaurant, Real Estate, Corporate, Fitness, Beauty, Education)
- [ ] **TMPL-02**: Templates are stored as serialized Fabric.js canvas state (JSON)

### Persistence

- [x] **PERS-01**: Project auto-saves to localStorage every 30 seconds
- [x] **PERS-02**: Project list persists in localStorage
- [x] **PERS-03**: Generated images stored in IndexedDB (not localStorage) to avoid 5MB limit

### App Shell & UX

- [x] **UXSH-01**: App has dark theme editor UI matching the design system in CLAUDE.md
- [x] **UXSH-02**: Header shows project name, save button, undo/redo buttons, export button
- [x] **UXSH-03**: Bottom bar shows zoom slider, page indicator, and grid toggle
- [x] **UXSH-04**: All panels are collapsible with smooth animation
- [x] **UXSH-05**: Toast notifications for save, export, and errors (bottom-right)
- [x] **UXSH-06**: Keyboard shortcuts overlay shown with ? key

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
| CANV-02 | Phase 1 | Complete |
| CANV-03 | Phase 1 | Complete |
| CANV-04 | Phase 1 | Complete |
| CANV-05 | Phase 1 | Complete |
| CANV-06 | Phase 1 | Complete |
| CANV-07 | Phase 1 | Complete |
| CANV-08 | Phase 1 | Complete |
| CANV-09 | Phase 1 | Complete |
| CANV-10 | Phase 1 | Complete |
| ELEM-01 | Phase 1 | Complete |
| ELEM-02 | Phase 1 | Complete |
| ELEM-03 | Phase 1 | Complete |
| ELEM-04 | Phase 1 | Complete |
| ELEM-05 | Phase 1 | Complete |
| PERS-01 | Phase 1 | Complete |
| PERS-02 | Phase 1 | Complete |
| PERS-03 | Phase 1 | Complete |
| EXPO-03 | Phase 1 | Complete |
| UXSH-01 | Phase 1 | Complete |
| UXSH-02 | Phase 1 | Complete |
| UXSH-03 | Phase 1 | Complete |
| UXSH-04 | Phase 1 | Complete |
| UXSH-05 | Phase 1 | Complete |
| UXSH-06 | Phase 1 | Complete |
| AIGEN-01 | Phase 01.1 | Complete |
| AIGEN-02 | Phase 01.1 | Complete |
| AIGEN-03 | Phase 01.1 | Complete |
| AIGEN-04 | Phase 01.1 | Complete |
| AIGEN-05 | Phase 01.1 | Complete |
| AIGEN-06 | Phase 01.1 | Complete |
| AIGEN-07 | Phase 01.1 | Complete |
| AIGEN-08 | Phase 01.1 | Complete |
| PAGE-01 | Phase 2 | Complete |
| PAGE-02 | Phase 2 | Complete |
| PAGE-03 | Phase 2 | Complete |
| PAGE-04 | Phase 2 | Complete |
| LPNL-01 | Phase 2 | Complete |
| LPNL-02 | Phase 2 | Complete |
| LPNL-03 | Phase 2 | Complete |
| LPNL-04 | Phase 2 | Complete |
| LPNL-05 | Phase 2 | Complete |
| PROP-01 | Phase 2 | Complete |
| PROP-02 | Phase 2 | Complete |
| PROP-03 | Phase 2 | Complete |
| PROP-04 | Phase 2 | Complete |
| TYPO-01 | Phase 2 | Complete |
| TYPO-02 | Phase 2 | Complete |
| TYPO-03 | Phase 2 | Complete |
| TYPO-04 | Phase 2 | Complete |
| STYL-01 | Phase 2 | Complete |
| STYL-02 | Phase 2 | Complete |
| STYL-03 | Phase 2 | Complete |
| STYL-04 | Phase 2 | Complete |
| COLR-01 | Phase 2 | Complete |
| COLR-02 | Phase 2 | Complete |
| COLR-03 | Phase 2 | Complete |
| COLR-04 | Phase 2 | Complete |
| COLR-05 | Phase 2 | Complete |
| AIPC-01 | Phase 3 | Complete |
| AIPC-02 | Phase 3 | Complete |
| AIPC-03 | Phase 3 | Complete |
| AIPC-04 | Phase 3 | Complete |
| AIPC-05 | Phase 3 | Complete |
| AIMG-01 | Phase 3 | Complete |
| AIMG-02 | Phase 3 | Complete |
| AIMG-03 | Phase 3 | Complete |
| AIMG-04 | Phase 3 | Complete |
| EXPO-01 | Phase 3 | Pending |
| EXPO-02 | Phase 4 | Pending |
| EXPO-04 | Phase 4 | Pending |
| DASH-01 | Phase 4 | Complete |
| DASH-02 | Phase 4 | Complete |
| DASH-03 | Phase 4 | Complete |
| DASH-04 | Phase 4 | Pending |
| TMPL-01 | Phase 4 | Pending |
| TMPL-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 77 total (REQUIREMENTS.md header previously stated 55 — actual count from document is 77)
- Mapped to phases: 77
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
