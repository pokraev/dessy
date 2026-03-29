# Phase 02: Data and Template Discovery - Research

**Researched:** 2026-03-29
**Domain:** SheetJS Excel parsing + InDesign DOM text/graphic frame traversal in UXP
**Confidence:** HIGH — all findings grounded in Phase 1 research (verified against official Adobe docs and SheetJS docs), existing stubs, and locked decisions from CONTEXT.md.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Excel Data Display**
- Compact table layout — headers as column names, scrollable rows (mini spreadsheet feel)
- Show all columns — horizontally scrollable if needed
- 5-8 rows visible at once — leaves room for tags section below
- File name displayed above the table (minimal, no sheet details)
- Click directly on a row in the table to select it
- Selected row gets a highlighted/colored background

**Tag Discovery UX**
- Tags grouped by type — text tags and image tags in separate sections
- Tag name only shown (no page number or frame info)
- Clicking a tag in the panel navigates the canvas to that frame
- Auto-scan the active document when panel opens (carried from Phase 1)

**Canvas Highlighting**
- Toggle button to show/hide tag highlights on canvas
- Highlighting style at Claude's discretion (non-intrusive approach)

**Row Selection Flow**
- Click-to-select in the data table
- Highlighted row with colored background for selection

**From Phase 1 (locked)**
- SheetJS standalone bundle (`xlsx.full.min.js`), not npm install
- ESM import pattern established
- `require('indesign')` inside function bodies for DOM access
- `.item(n)` for all collection access
- `src/utils/fileIO.js` has `openXlsxPicker()` and `readFileAsArrayBuffer()` ready
- `src/services/excelParser.js` and `src/services/templateScanner.js` are stubs ready to implement
- Preact + Spectrum CSS for panel UI
- Panel is ~400px wide, dockable sidebar

### Claude's Discretion
- Empty state when no tags found (show helpful message about `{{tag}}` format)
- Canvas highlight visual style (border color, overlay approach)
- Table scrolling behavior and column width handling
- Tag list sort order

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXCEL-01 | User can select an .xlsx file from disk via file picker | `openXlsxPicker()` already implemented in `src/utils/fileIO.js`; UI button triggers it |
| EXCEL-02 | Plugin parses Excel headers and data rows from the first sheet | SheetJS `read()` + `sheet_to_json()` with `header:1` option; `src/services/excelParser.js` is stub |
| EXCEL-03 | User can select which data row to apply from a list | Preact state + click handler on table row; selected row index stored in `pluginState.selectedRow` |
| SCAN-01 | Plugin detects `{{Tag}}` placeholders in text frames across all pages | InDesign DOM: iterate `doc.textFrames` + regex `/\{\{(\w+)\}\}/g` on `.contents`; `templateScanner.js` stub |
| SCAN-02 | Plugin lists all discovered tags in the panel UI | Preact component renders `pluginState.tags.textTags` and `.imageTags` in two sections |
| SCAN-03 | Plugin detects tags in image/graphic frames | InDesign DOM: iterate `doc.rectangles` + check `.label` or `.appliedObjectStyles.name` for `{{Tag}}` pattern |
| SCAN-04 | Plugin highlights tagged frames on the InDesign canvas | InDesign DOM: set `frame.strokeColor` and `frame.strokeWeight` on found frames; toggle via button |
</phase_requirements>

---

## Summary

Phase 2 builds on a working scaffold (Phase 1) — the file picker exists, Preact renders in the panel, and both service stubs are in place. The work divides cleanly into three areas: (1) implementing the SheetJS Excel parser using the existing `readFileAsArrayBuffer` helper, (2) implementing InDesign DOM traversal to find `{{Tag}}` placeholders in text and graphic frames, and (3) wiring both into a Preact UI with a compact data table, a tag list grouped by type, and canvas highlight toggling.

The primary technical concern is correctly identifying image/graphic frame tags. Text frames expose `.contents` for regex; graphic frames do not have text content. The convention is to store `{{Tag}}` in the frame's label (`.label` property) or use an object style name. The CONTEXT.md does not specify which convention — this needs a decision (see Open Questions). Additionally, the tag-to-frame mapping must persist in state so the "click to navigate" UX and the highlight toggle can both reference the original frame objects.

The vendor directory (`src/vendor/`) exists but is empty — `xlsx.full.min.js` must be downloaded before `excelParser.js` can be implemented. This is a Wave 0 prerequisite that blocks everything in Plan 02-01.

**Primary recommendation:** Implement excelParser first (unblocked once SheetJS bundle is downloaded), then templateScanner (read-only DOM, safe to iterate before state is wired), then compose the full UI in Plan 02-03. Store frame references alongside tag names in state so navigation and highlight toggling share the same source of truth.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SheetJS standalone (`xlsx.full.min.js`) | 0.18.x | Parse .xlsx ArrayBuffer into headers/rows | Only confirmed-working Excel parser in UXP; npm package fails with `charCodeAt` error. Already decided in Phase 1. |
| InDesign DOM (`require('indesign')`) | v18.5+ | Traverse text frames, rectangles, set stroke properties | The only API for reading/writing InDesign document content from a UXP plugin |
| Preact + `preact/hooks` | ^10.29.0 (already installed) | Panel UI components: data table, tag list, toggle button | Locked in Phase 1; already rendering in the panel |
| Spectrum UXP widgets (`sp-button`, `sp-divider`) | Built into UXP runtime | Native InDesign-styled controls | No install; match host UI; `sp-button` already used in App.jsx |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/utils/fileIO.js` (existing) | — | `openXlsxPicker()` + `readFileAsArrayBuffer()` | Already implemented; call directly from `excelParser.js` trigger |
| `src/state.js` (existing) | — | `pluginState` shared object | Extend with `excelData`, `tags`, `selectedRow`, `highlightActive` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Frame `.label` for image tag storage | Object style name | `.label` is simpler to read/write; object style name is more visible in InDesign UI but requires style creation |
| Regex on `.contents` for text tags | InDesign Find/Change API | Regex is simpler and synchronous; Find/Change API has async overhead and is overkill for read-only discovery |

**Installation:**

The SheetJS bundle must be downloaded manually — it is not in `node_modules`. No additional npm install is required for this phase.

```bash
# Download SheetJS standalone bundle into vendor directory
curl -L "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js" \
     -o /Users/pokraev/Projects/Dessy/dessy-indesign/src/vendor/xlsx.full.min.js
```

After downloading, import it in `excelParser.js`:
```javascript
// src/services/excelParser.js
import XLSX from '../vendor/xlsx.full.min.js';
```

**Version note:** The `xlsx-latest` CDN URL always resolves to the current release. As of the Phase 1 research, the working version is 0.18.x. The standalone bundle is the only reliable form for UXP.

---

## Architecture Patterns

### Recommended Project Structure (Phase 2 additions)

```
src/
├── index.js               # Entry point (no changes needed)
├── state.js               # Extend pluginState with excelData, tags, selectedRow, highlightActive
├── utils/
│   └── fileIO.js          # Unchanged — openXlsxPicker + readFileAsArrayBuffer
├── vendor/
│   └── xlsx.full.min.js   # Wave 0: download before implementation begins
├── services/
│   ├── excelParser.js     # Implement: ArrayBuffer -> { headers, rows }
│   ├── templateScanner.js # Implement: InDesign DOM -> { textTags, imageTags, frameRefs }
│   └── applier.js         # Unchanged stub (Phase 4)
└── ui/
    ├── App.jsx            # Rewrite: wire excelData + tags state, render child components
    ├── DataTable.jsx      # New: compact mini-spreadsheet with row click-to-select
    ├── TagList.jsx        # New: two-section list (text tags / image tags), click-to-navigate
    └── HighlightToggle.jsx # New: single toggle button, calls scanner's highlight API
```

### Pattern 1: SheetJS ArrayBuffer Parse

**What:** Read bytes from UXP file entry, pass ArrayBuffer to SheetJS, extract first sheet as row arrays.
**When to use:** Whenever user triggers file pick + parse.

```javascript
// src/services/excelParser.js
// Source: SheetJS official docs — https://docs.sheetjs.com/docs/api/parse-options
import XLSX from '../vendor/xlsx.full.min.js';

export async function parseExcel(arrayBuffer) {
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // header:1 returns array-of-arrays; row 0 is headers
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);
  return { headers, rows: dataRows };
}
```

**Critical:** Pass `new Uint8Array(arrayBuffer)` not the raw ArrayBuffer — SheetJS `type: 'array'` expects a typed array. The `readFileAsArrayBuffer` helper returns the raw buffer from UXP; wrap it here.

### Pattern 2: InDesign Text Frame Tag Scan

**What:** Iterate all text frames in the active document across all pages, regex-extract `{{Tag}}` from `.contents`, collect unique tag names + frame references.
**When to use:** Panel open event, or explicit "Scan" trigger.

```javascript
// src/services/templateScanner.js
export function scanDocument() {
  const { app } = require('indesign');
  const doc = app.activeDocument;
  const textTags = new Map(); // tagName -> first frame reference
  const imageTags = new Map();
  const tagRegex = /\{\{(\w+)\}\}/g;

  // Scan text frames
  const frameCount = doc.textFrames.length;
  for (let i = 0; i < frameCount; i++) {
    const frame = doc.textFrames.item(i);
    const contents = frame.contents;
    let match;
    while ((match = tagRegex.exec(contents)) !== null) {
      const tagName = match[1];
      if (!textTags.has(tagName)) textTags.set(tagName, frame);
    }
    tagRegex.lastIndex = 0; // reset for each frame
  }

  // Scan rectangles (graphic frames) by label convention
  const rectCount = doc.rectangles.length;
  for (let i = 0; i < rectCount; i++) {
    const rect = doc.rectangles.item(i);
    const label = rect.label || '';
    const match = /\{\{(\w+)\}\}/.exec(label);
    if (match) {
      const tagName = match[1];
      if (!imageTags.has(tagName)) imageTags.set(tagName, rect);
    }
  }

  return {
    textTags: Array.from(textTags.keys()),
    imageTags: Array.from(imageTags.keys()),
    frameRefs: { text: textTags, image: imageTags }
  };
}
```

**Key:** Store frame references alongside tag names so click-to-navigate and canvas highlight can operate on the same frames without re-scanning.

### Pattern 3: Canvas Frame Highlight via Stroke

**What:** Set a visible stroke color and weight on all tagged frames; remove it on toggle-off. This avoids creating annotations or layers.
**When to use:** Toggle button in panel.

```javascript
// src/services/templateScanner.js (additional export)
export function setHighlight(frameRefs, active) {
  const { app, ColorModel, RenderingIntent } = require('indesign');
  const doc = app.activeDocument;

  // Collect all tagged frames
  const allFrames = [
    ...frameRefs.text.values(),
    ...frameRefs.image.values()
  ];

  for (const frame of allFrames) {
    if (active) {
      // Use an existing swatch or create one — orange is visible on most backgrounds
      frame.strokeWeight = 2;
      // strokeColor expects a swatch object; use named color if it exists
      try {
        frame.strokeColor = doc.swatches.itemByName('Dessy-Highlight') || doc.swatches.item(1);
      } catch (_) {
        frame.strokeWeight = 0;
      }
    } else {
      frame.strokeWeight = 0;
    }
  }
}
```

**Note:** Color swatch handling has edge cases (CMYK vs RGB documents). The safest approach is `frame.strokeWeight = 0` to remove highlight, and using an existing swatch for activation. See Open Questions for swatch creation.

### Pattern 4: State Extension

**What:** Extend `pluginState` in `src/state.js` to hold all phase 2 data, then update `App.jsx` to use Preact `useState` mirroring the shared state.

```javascript
// src/state.js (updated)
const pluginState = {
  // Phase 2 additions:
  excelData: null,     // { headers: string[], rows: any[][] } | null
  selectedRow: null,   // number | null — index into rows
  tags: {
    textTags: [],      // string[]
    imageTags: [],     // string[]
    frameRefs: null    // { text: Map<string, frame>, image: Map<string, frame> }
  },
  highlightActive: false,
  // Pre-existing:
  mapping: {},
  status: 'idle'
};
module.exports = { pluginState };
```

App.jsx uses local Preact state that mirrors pluginState — update both on each operation.

### Anti-Patterns to Avoid

- **`doc.textFrames[i]` bracket notation:** Silently returns `undefined` in InDesign 18.4+. Always use `.item(i)`.
- **Skipping `tagRegex.lastIndex = 0` reset:** The regex is run in a loop with `exec`. If not reset between frames, it continues from the previous match position and skips content in subsequent frames.
- **Storing raw InDesign DOM objects in React/Preact state:** UXP proxied DOM objects should not be stored in Preact's state tree — Preact may try to diff them. Store frame references in `pluginState` (plain JS), not in Preact useState.
- **Re-scanning on every render:** Auto-scan runs once on panel open and once on explicit button press. Never trigger scan in a render function or useEffect without a stable dependency.
- **Navigating to a frame by index after re-scan:** Frame indices shift when the document changes. Always navigate via the stored frame reference (`frame.select()` or `app.activeWindow.activePage = frame.parentPage`), not by re-querying by index.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| .xlsx byte parsing | Custom binary parser | SheetJS `xlsx.full.min.js` | Excel format is complex (OOXML + ZIP); SheetJS handles merged cells, encoding, date serial numbers |
| Regex extraction from strings | InDesign Find/Change API | Plain JS regex on `.contents` | Find/Change has async overhead and state mutation risk; regex on a string is synchronous and simpler |
| Custom color swatch creation | Just set stroke directly | Use existing doc swatches | Color space mismatch (RGB/CMYK) can throw; safer to pick an existing swatch or set weight to 0 for removal |

**Key insight:** SheetJS is the entire value proposition for Excel parsing — every edge case (merged cells, empty rows, date encoding) is pre-solved. The InDesign DOM's own Find/Change scripting support is heavier than needed for read-only tag discovery.

---

## Common Pitfalls

### Pitfall 1: `readFileAsArrayBuffer` Returns Binary String, Not ArrayBuffer

**What goes wrong:** On some UXP versions, `file.read({ format: storage.formats.binary })` returns a binary string rather than a true ArrayBuffer. Passing a string to SheetJS `read()` with `type: 'array'` crashes.

**Why it happens:** UXP Storage API behavior varies slightly between InDesign versions. The `fileIO.js` stub assumes ArrayBuffer but the actual return type depends on the UXP version.

**How to avoid:** Defensively wrap: if `typeof bytes === 'string'`, encode to Uint8Array manually. Otherwise wrap in `new Uint8Array(bytes)`:

```javascript
// Defensive wrap in excelParser.js
const data = typeof arrayBuffer === 'string'
  ? new TextEncoder().encode(arrayBuffer)
  : new Uint8Array(arrayBuffer);
const workbook = XLSX.read(data, { type: 'array' });
```

**Warning signs:** SheetJS throws `"data is not an array"` or workbook has zero sheets.

### Pitfall 2: `doc.textFrames` Only Finds Unthreaded Frames

**What goes wrong:** `doc.textFrames` returns all text frames in the document, but if text frames are threaded (text flows from one frame to another), each frame in the chain is still enumerable — no items are skipped. However, `.contents` on a non-primary threaded frame returns only the portion of the story visible in that frame, which may be empty even if the tag is mid-story.

**Why it happens:** InDesign stores threaded text in `Stories`. The tag `{{Name}}` might be mid-story and only visible in frame 2 of a thread — frame 1's `.contents` won't include it.

**How to avoid:** Scan `doc.stories` instead of `doc.textFrames` for complete text content. Each story's full text is available without threading fragmentation:

```javascript
const storyCount = doc.stories.length;
for (let i = 0; i < storyCount; i++) {
  const story = doc.stories.item(i);
  const contents = story.contents;
  // ... regex on contents
}
```

Store the frame reference as `story.textContainers.item(0)` for navigation.

**Warning signs:** Tags known to exist in the document are not found by the scanner; typically affects documents with linked/threaded text boxes.

### Pitfall 3: InDesign DOM Objects Cannot Live in Preact State

**What goes wrong:** Storing a Map of InDesign frame objects in `useState` causes Preact to attempt object comparison/diffing on proxied UXP objects, leading to errors or silent failures.

**Why it happens:** InDesign DOM objects are JavaScript proxies. Preact's reconciler touches object properties during diffing; proxy property access on stale or invalid frame references can throw.

**How to avoid:** Keep `frameRefs` only in `pluginState` (the plain JS module-level object). Preact state holds only serializable values: tag name strings, selected row index, highlight boolean. Services read `pluginState.tags.frameRefs` directly for navigation and highlighting.

**Warning signs:** Console errors like `"Cannot read properties of null"` when updating UI state; component re-renders cause InDesign errors.

### Pitfall 4: `tagRegex.lastIndex` Not Reset Between Frames

**What goes wrong:** The tag regex is declared with `/g` flag and reused across multiple frames in a loop. After matching in frame N, `lastIndex` is non-zero, so `exec()` on frame N+1 starts mid-string and misses tags at the beginning.

**Why it happens:** JavaScript regex objects with `/g` flag are stateful — `lastIndex` persists across calls to `exec()`. This is a standard JS gotcha amplified when the regex is defined once outside the loop.

**How to avoid:** Reset `tagRegex.lastIndex = 0` at the start of each frame's content scan, or use `new RegExp(...)` inside the loop (slightly less efficient but side-effect free).

### Pitfall 5: Navigating to Frame Fails When Document Page Is Not Active

**What goes wrong:** Calling `frame.select()` or setting `app.activeWindow.activePage` works only when the document window is active. If the panel loses focus context, navigation silently does nothing.

**Why it happens:** InDesign's window/view state controls which page is displayed. Changing the active page requires an active document window.

**How to avoid:** Guard with `app.activeDocument` check before navigation. Use `app.activeWindow.activePage = frame.parentPage` to navigate to the containing page, then `frame.select()` to select the frame.

---

## Code Examples

Verified patterns grounded in established project conventions:

### SheetJS Parse with Defensive Uint8Array Wrap

```javascript
// src/services/excelParser.js
// Source: SheetJS docs + established Phase 1 fileIO pattern
import XLSX from '../vendor/xlsx.full.min.js';

export async function parseExcel(arrayBuffer) {
  const data = typeof arrayBuffer === 'string'
    ? new TextEncoder().encode(arrayBuffer)
    : new Uint8Array(arrayBuffer);

  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0].map(String);
  const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== ''));
  return { headers, rows: dataRows };
}
```

### Complete Template Scanner Using Stories (not textFrames)

```javascript
// src/services/templateScanner.js
// Source: InDesign DOM — doc.stories avoids threading fragmentation
export function scanDocument() {
  const { app } = require('indesign');
  const doc = app.activeDocument;
  const tagRegex = /\{\{(\w+)\}\}/g;
  const textTags = new Map();  // tagName -> frame ref for navigation
  const imageTags = new Map();

  // Text: scan stories for full content (handles threaded frames)
  const storyCount = doc.stories.length;
  for (let i = 0; i < storyCount; i++) {
    const story = doc.stories.item(i);
    const contents = story.contents || '';
    tagRegex.lastIndex = 0;
    let match;
    while ((match = tagRegex.exec(contents)) !== null) {
      const tagName = match[1];
      if (!textTags.has(tagName)) {
        const navFrame = story.textContainers.length > 0
          ? story.textContainers.item(0)
          : null;
        textTags.set(tagName, navFrame);
      }
    }
  }

  // Images: scan rectangles by label convention — {{TagName}} in frame label
  const rectCount = doc.rectangles.length;
  for (let i = 0; i < rectCount; i++) {
    const rect = doc.rectangles.item(i);
    const label = rect.label || '';
    tagRegex.lastIndex = 0;
    const match = tagRegex.exec(label);
    if (match && !imageTags.has(match[1])) {
      imageTags.set(match[1], rect);
    }
  }

  return {
    textTags: Array.from(textTags.keys()),
    imageTags: Array.from(imageTags.keys()),
    frameRefs: { text: textTags, image: imageTags }
  };
}
```

### Navigate to Frame from Panel Click

```javascript
// Source: InDesign DOM — app.activeWindow.activePage
export function navigateToFrame(frame) {
  if (!frame) return;
  const { app } = require('indesign');
  try {
    app.activeWindow.activePage = frame.parentPage;
    app.select(frame);
  } catch (err) {
    console.error('Navigation failed:', err);
  }
}
```

### Preact DataTable Component (Sketch)

```jsx
// src/ui/DataTable.jsx
import { h } from 'preact';

export function DataTable({ headers, rows, selectedRow, onSelectRow }) {
  if (!headers.length) {
    return h('p', { style: { fontSize: '12px', color: '#888', padding: '8px' } },
      'No Excel file loaded.');
  }

  return h('div', { style: { overflowX: 'auto', maxHeight: '160px', overflowY: 'auto' } },
    h('table', { style: { borderCollapse: 'collapse', fontSize: '11px', width: '100%' } },
      h('thead', null,
        h('tr', null, headers.map((col, i) =>
          h('th', {
            key: i,
            style: { padding: '4px 6px', borderBottom: '1px solid #444',
                     textAlign: 'left', whiteSpace: 'nowrap' }
          }, col)
        ))
      ),
      h('tbody', null, rows.map((row, rowIdx) =>
        h('tr', {
          key: rowIdx,
          onclick: () => onSelectRow(rowIdx),
          style: {
            background: selectedRow === rowIdx ? '#3b5bdb' : 'transparent',
            color: selectedRow === rowIdx ? '#fff' : 'inherit',
            cursor: 'pointer'
          }
        }, headers.map((_, colIdx) =>
          h('td', {
            key: colIdx,
            style: { padding: '3px 6px', whiteSpace: 'nowrap', maxWidth: '120px',
                     overflow: 'hidden', textOverflow: 'ellipsis' }
          }, row[colIdx] ?? '')
        ))
      ))
    )
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `doc.textFrames[0]` bracket notation | `doc.textFrames.item(0)` | InDesign 18.4 | Bracket access silently returns `undefined` |
| `app` as global | `const { app } = require('indesign')` inside function | InDesign 18.4 | Must import explicitly per function |
| npm `xlsx` package | `xlsx.full.min.js` standalone bundle | UXP inception | npm package fails in UXP with charCodeAt error |
| `doc.textFrames` for full text search | `doc.stories` for complete story content | InDesign scripting best practice | Stories expose full text including threaded content |

---

## Open Questions

1. **Image frame tag convention: `.label` vs object style name**
   - What we know: CONTEXT.md says "Plugin detects tags in image/graphic frames" but does not specify how tags are placed on graphic frames
   - What's unclear: Users setting up templates need to know where to put the tag — in the frame's label field, in the object style name, or somewhere else
   - Recommendation: Use `.label` property. It's directly editable in InDesign's Object Layer Options, clearly visible to the user, and readable via `rect.label` without any API complexity. Document this convention in a UI tooltip on the tag list. This is the discretion choice for the planner to lock.

2. **Canvas highlight color: swatch creation vs fixed stroke**
   - What we know: Highlight must be non-intrusive; CONTEXT.md leaves visual style to Claude's discretion
   - What's unclear: Creating a new swatch programmatically risks color space errors; using `doc.swatches.item(1)` (typically Registration or Black) is predictable but may not be visually obvious
   - Recommendation: Use `frame.strokeWeight = 2` for on, `0` for off. For color, set `frame.strokeColor = doc.swatches.itemByName('[Blue]')` — InDesign ships with a built-in `[Blue]` swatch that works in both RGB and CMYK documents. If not found, fall back to `doc.swatches.item(3)` (typically Cyan).

3. **Scan scope: all pages vs active page only**
   - What we know: SCAN-01 says "across all pages"; user confirmed auto-scan on panel open
   - What's unclear: On very large documents, scanning all pages at open could be slow
   - Recommendation: Scan all pages (per requirement). The `doc.stories` approach reads all stories regardless of page, which is efficient. Flag to verify performance on documents with 10+ pages during implementation.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config files, no test directory |
| Config file | Wave 0: create manually |
| Quick run command | N/A until framework added |
| Full suite command | N/A until framework added |

**Context:** This is a UXP plugin that runs inside InDesign. Automated tests for the full plugin are impractical without an InDesign runtime. However, the service layer (`excelParser.js`, and parts of `templateScanner.js`) can be unit-tested in Node.js because they accept plain data (ArrayBuffer, strings) and return plain objects. InDesign DOM calls in `templateScanner.js` can be isolated behind a thin adapter for testing.

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXCEL-02 | SheetJS parses headers and data rows from ArrayBuffer | unit | `node tests/excelParser.test.js` | Wave 0 |
| EXCEL-03 | Selected row index stored and reflected in UI | manual | — | manual-only (requires UXP runtime UI) |
| SCAN-01 | Regex extracts {{Tag}} from text string correctly | unit | `node tests/templateScanner.test.js` | Wave 0 |
| SCAN-02 | Tag list renders two sections in panel | manual | — | manual-only (requires InDesign panel) |
| SCAN-03 | Rectangle label parsed for {{Tag}} | unit | `node tests/templateScanner.test.js` | Wave 0 |
| SCAN-04 | Frame stroke weight set to 2 on highlight | manual | — | manual-only (requires InDesign document) |

**Note on EXCEL-01:** File picker is already verified from Phase 1. No new test needed.

### Sampling Rate

- **Per task commit:** `node tests/excelParser.test.js && node tests/templateScanner.test.js`
- **Per wave merge:** Same — plus manual smoke test in InDesign: load sample .xlsx, verify table renders; open document with {{tags}}, verify tag list populates
- **Phase gate:** Unit tests green + manual smoke test passing before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/excelParser.test.js` — covers EXCEL-02 (parse headers, parse data rows, handle empty xlsx, handle empty rows)
- [ ] `tests/templateScanner.test.js` — covers SCAN-01 (regex extraction from text string), SCAN-03 (label parsing for image frames)
- [ ] `src/vendor/xlsx.full.min.js` — must be downloaded before any test can run
- [ ] Framework install: none needed — tests can run as plain Node.js scripts that `import` the service modules directly (using `--experimental-vm-modules` or plain CJS wrappers)

*(The service files are currently CJS (`module.exports`) despite the rest of the project using ESM. This inconsistency should be resolved in Wave 0 — convert stubs to ESM exports matching `fileIO.js` pattern.)*

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — SheetJS standalone bundle, UXP storage API, Spectrum widgets
- `.planning/research/ARCHITECTURE.md` — service layer patterns, state flow, InDesign DOM traversal
- `.planning/research/PITFALLS.md` — `.item(n)` requirement, `require('indesign')` in function body, async DOM pitfalls
- `.planning/phases/02-data-and-template-discovery/02-CONTEXT.md` — locked decisions for this phase
- Existing source code: `src/utils/fileIO.js`, `src/ui/App.jsx`, `src/state.js`, `src/services/*.js` stubs

### Secondary (MEDIUM confidence)
- [SheetJS official docs — sheet_to_json with header:1](https://docs.sheetjs.com/docs/api/utilities/array) — confirmed row extraction pattern
- [Adobe InDesign UXP — doc.stories vs doc.textFrames](https://developer.adobe.com/indesign/uxp/) — stories API for threaded text

### Tertiary (LOW confidence)
- `.label` as image frame tag convention — community convention, not officially specified in Adobe docs; chosen for simplicity

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — SheetJS + Preact locked in Phase 1; InDesign DOM patterns verified in PITFALLS.md and ARCHITECTURE.md
- Architecture: HIGH — service stubs already exist; patterns directly extend Phase 1 established conventions
- Pitfalls: HIGH for DOM pitfalls (verified from PITFALLS.md); MEDIUM for stories vs textFrames threading behavior (community-sourced but widely confirmed)
- Open questions: LOW confidence on image tag convention (undocumented in CONTEXT.md, needs implementer decision)

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable UXP platform; SheetJS 0.18.x is stable)
