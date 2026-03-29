# Phase 2: Data and Template Discovery - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Excel parsed into panel state; document tags scanned and listed. Users can load an Excel file and see its columns/rows in the panel; the panel also shows all `{{Tag}}` placeholders found in the active document. Users can select a row and see tagged frames highlighted on canvas.

</domain>

<decisions>
## Implementation Decisions

### Excel Data Display
- Compact table layout — headers as column names, scrollable rows (mini spreadsheet feel)
- Show all columns — horizontally scrollable if needed
- 5-8 rows visible at once — leaves room for tags section below
- File name displayed above the table (minimal, no sheet details)
- Click directly on a row in the table to select it
- Selected row gets a highlighted/colored background

### Tag Discovery UX
- Tags grouped by type — text tags and image tags in separate sections
- Tag name only shown (no page number or frame info)
- Clicking a tag in the panel navigates the canvas to that frame
- Auto-scan the active document when panel opens (carried from Phase 1)

### Canvas Highlighting
- Toggle button to show/hide tag highlights on canvas
- Highlighting style at Claude's discretion (non-intrusive approach)

### Row Selection Flow
- Click-to-select in the data table
- Highlighted row with colored background for selection

### Claude's Discretion
- Empty state when no tags found (show helpful message about `{{tag}}` format)
- Canvas highlight visual style (border color, overlay approach)
- Table scrolling behavior and column width handling
- Tag list sort order

### From Phase 1 (locked)
- SheetJS standalone bundle (`xlsx.full.min.js`), not npm install
- ESM import pattern established
- `require('indesign')` inside function bodies for DOM access
- `.item(n)` for all collection access
- `src/utils/fileIO.js` has `openXlsxPicker()` and `readFileAsArrayBuffer()` ready
- `src/services/excelParser.js` and `src/services/templateScanner.js` are stubs ready to implement
- Preact + Spectrum CSS for panel UI
- Panel is ~400px wide, dockable sidebar

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UXP Platform
- `.planning/research/STACK.md` — SheetJS integration pattern (standalone bundle, ArrayBuffer input)
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow between services
- `.planning/research/PITFALLS.md` — DOM breaking changes, `.item(n)` requirement, async performance

### Project Context
- `.planning/PROJECT.md` — Vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — EXCEL-01/02/03, SCAN-01/02/03/04 requirements

### Phase 1 Artifacts
- `.planning/phases/01-scaffold/01-CONTEXT.md` — Locked decisions from scaffold phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/fileIO.js`: `openXlsxPicker()` returns UXP File Entry, `readFileAsArrayBuffer()` returns ArrayBuffer — ready for SheetJS input
- `src/ui/App.jsx`: Preact component with `useState`, test buttons — will be rewritten for Phase 2 UI
- `src/state.js`: State management stub — can hold Excel data and scanned tags

### Established Patterns
- ESM imports for all source files (deviation from original CJS plan, now locked)
- `require('indesign')` kept as CJS inside function bodies (external, not bundled)
- Vite builds to `dist/index.js` as CJS with `uxp` and `indesign` externalized
- `src/services/` contains business logic, `src/ui/` contains Preact components

### Integration Points
- `src/services/excelParser.js` — stub, needs SheetJS integration + `readFileAsArrayBuffer` from fileIO
- `src/services/templateScanner.js` — stub, needs InDesign DOM traversal
- `src/ui/App.jsx` — entry point for all panel UI, will grow with data table and tag list components

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for data display and tag scanning.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-data-and-template-discovery*
*Context gathered: 2026-03-29*
