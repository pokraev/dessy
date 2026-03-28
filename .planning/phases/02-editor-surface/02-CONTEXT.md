# Phase 2: Editor Surface - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the editing surface with all panels (layers, properties, typography, style), multi-page management, and full color system. Users get a complete design tool UI: left panel with tools/layers/pages, right panel with context-sensitive properties, typography with Google Fonts and presets, brand color system with live-linked global swatches, and robust multi-page support.

</domain>

<decisions>
## Implementation Decisions

### Left Panel Organization
- Tabbed layout with 3 tabs: Tools | Layers | Pages
- Only one tab content visible at a time (Figma/Photoshop style)
- Tools tab: existing ToolBar content (tool buttons, arrangement actions)
- Layers tab: compact rows with icon + name, drag handle for reorder, eye icon (visibility), lock icon inline
- Pages tab: mini canvas preview thumbnails, click to navigate, right-click for add/duplicate/delete, drag to reorder, "+ Add Page" button
- Panel width stays at 280px

### Layer Interaction
- Click layer row to select element on canvas AND auto-switch to Select tool (if currently on a drawing tool)
- Double-click layer name to rename inline
- Drag handle for reorder (maps to Fabric.js z-index)
- Eye icon toggles visibility, lock icon toggles lock state
- Compact rows: type icon (text/image/shape/colorBlock) + name + visibility + lock

### Properties Panel Structure
- Context-sensitive sections — show only relevant sections for selected element type
- Text selected: Position, Typography, Fill
- Shape selected: Position, Fill, Stroke, Shadow
- Image selected: Position, Fit Mode
- Color block selected: Position, Fill
- Nothing selected: Page background color, document format info, page dimensions
- All sections use existing SectionHeader collapsible pattern
- Panel width stays at 320px

### Position/Size Inputs
- Inline number inputs in 2x2 grid: X/Y row, W/H row
- All values in mm (converted from px using pxToMm)
- Lock icon between W and H to constrain aspect ratio
- Rotation as separate input (degrees)
- Opacity slider (0-100%)
- Tab between fields for keyboard navigation

### Shadow Control
- Toggle on/off at section header
- When on, expands to show: X offset, Y offset, blur radius, color picker
- Collapsed when off to save vertical space

### Color Picker UX
- Popover triggered by clicking color swatch
- Popover contains: react-colorful color wheel, HEX/RGB/HSL text inputs, brand swatches row, recently used colors row, eyedropper button
- Closes on click outside
- Same popover component reused for fill, stroke, text color, shadow color, page background

### Brand Color Swatches
- Live-linked swatches — elements reference swatch by ID
- Editing a brand swatch updates all elements using it in real-time across all pages
- Up to 10 swatches (STYL-01)
- Swatch editor accessible from Style section of properties panel (when nothing selected)

### Predefined Palettes & Generator
- Claude's discretion on where palettes (COLR-03) and palette generator (STYL-02) live — could be inside color picker popover or a separate Style section

### Google Fonts Integration
- Searchable dropdown with each font rendered in its own typeface
- Popular fonts (~20) pinned at top section
- All fonts in scrollable section below
- Fonts load on-demand as user scrolls the dropdown list
- Type to filter/search

### Typography Presets
- 5 built-in presets: Headline, Subhead, Body, Caption, CTA
- Quick-apply buttons in Typography section — click to apply all properties (font, size, weight, line-height, letter-spacing, color) to selected text
- Presets are editable — user can customize preset values in the Style section
- Changes to presets apply globally (STYL-03) — all text using that preset updates
- Sensible defaults for each preset out of the box

### Multi-Page Management
- Pages tab in left panel shows mini canvas previews
- Add, remove, duplicate, reorder pages (PAGE-01, PAGE-03)
- Bifold/trifold formats auto-create correct page count (PAGE-04)
- Click thumbnail or use BottomBar navigator to switch pages (PAGE-02)
- Existing sessionStorage page switching mechanism continues

### Claude's Discretion
- Predefined palettes location (color picker popover vs Style section)
- Palette generator algorithm and UI
- Recently used colors limit
- Font loading batch size and strategy
- Multi-selection property display (mixed values indicator)
- Border style options (solid, dashed, dotted)
- Gradient editor UI for color blocks
- Corner radius input pattern
- Eyedropper implementation approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specification
- `CLAUDE.md` — Full app specification including tech stack, editor layout, design system, Zustand state shape

### Research (from Phase 1)
- `.planning/research/STACK.md` — Verified library versions: Fabric.js 7.x, Zustand 5, Tailwind CSS 4
- `.planning/research/ARCHITECTURE.md` — Canvas-as-imperative-island pattern, Zustand/Fabric.js sync contract
- `.planning/research/PITFALLS.md` — Multi-page memory leak prevention, undo/redo memory management

### Requirements
- `.planning/REQUIREMENTS.md` — Phase 2 requirements: PAGE-01 through PAGE-04, LPNL-01 through LPNL-05, PROP-01 through PROP-04, TYPO-01 through TYPO-04, STYL-01 through STYL-04, COLR-01 through COLR-05

### Existing Code (key integration points)
- `src/stores/canvasStore.ts` — Tool state, selection, canvas ref, callbacks (triggerSwitchPage)
- `src/stores/projectStore.ts` — Project, pages, currentPageIndex, dirty state
- `src/stores/brandStore.ts` — ColorSwatch, TypographyPreset types (not yet wired to UI)
- `src/stores/editorStore.ts` — Panel visibility toggles
- `src/components/editor/panels/PropertiesPanel.tsx` — Placeholder ready for Phase 2
- `src/components/editor/panels/ToolBar.tsx` — Current tool buttons (becomes Tools tab)
- `src/components/editor/ui/BottomBar.tsx` — Page navigator already wired
- `src/components/editor/EditorCanvasInner.tsx` — Multi-page switching via sessionStorage
- `src/lib/fabric/element-factory.ts` — CUSTOM_PROPS, all element creators
- `src/types/brand.ts` — ColorSwatch, TypographyPreset type definitions
- `src/lib/units.ts` — mmToPx, pxToMm conversion

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- SectionHeader component: collapsible sections pattern (PropertiesPanel already uses it)
- ToolBar: complete tool buttons — becomes Tools tab content in new tabbed layout
- BottomBar: page navigator with prev/next + page numbers — complements Pages tab
- brandStore: ColorSwatch and TypographyPreset types ready, setBrandColors/setTypographyPresets methods exist
- canvasStore.selectedObjectIds: selection state for driving context-sensitive properties
- Range + text input pattern (BottomBar zoom slider) — reusable for opacity, rotation
- Toast notifications (react-hot-toast) — established pattern
- ContextMenu component — reusable pattern for right-click on layers/pages

### Established Patterns
- Zustand granular selectors: `const x = useStore((s) => s.x)` — prevents unnecessary re-renders
- Framer Motion for panel animations (EditorLayout)
- Dark theme tokens: #141414 surfaces, #1e1e1e panels, #2a2a2a borders, #6366f1 accent, #f5f5f5 text
- 300ms debounce for property changes (undo grouping, from Phase 1 context)
- sessionStorage for per-page canvas JSON: `dessy-generated-page-{projectId}-{pageIndex}`
- CUSTOM_PROPS array for Fabric.js serialization (customType, imageId, locked, name, id, shapeKind, fitMode)

### Integration Points
- EditorLayout.tsx: three-panel layout container — left panel needs restructuring from ToolBar to tabbed
- PropertiesPanel.tsx: 320px placeholder — fill with context-sensitive sections
- canvasStore callbacks: triggerSwitchPage already wired for page navigation
- Fabric.js canvas events: object:selected, object:modified → drive property panel updates
- brandStore: wire to color picker popover and typography presets

</code_context>

<specifics>
## Specific Ideas

- Layer list should feel like Figma's — compact, scannable, with type icons distinguishing text/image/shape
- Color picker popover is the single reusable component for ALL color inputs in the app
- Typography presets are quick-apply buttons, not a dropdown — faster workflow for designers
- Page thumbnails should be actual rendered mini-previews, not just numbered boxes
- Live-linked brand swatches are the key differentiator — changing a brand color propagates everywhere

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-editor-surface*
*Context gathered: 2026-03-28*
