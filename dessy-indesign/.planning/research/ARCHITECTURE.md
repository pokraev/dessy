# Architecture Research

**Domain:** Adobe UXP InDesign Plugin (data-driven layout automation)
**Researched:** 2026-03-29
**Confidence:** MEDIUM — Core architectural facts are HIGH confidence (from official Adobe dev docs and verified community sources). UXP is still evolving; some specific APIs (undo, async behavior) have known rough edges documented in community forums.

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       PANEL UI LAYER                            │
│  (HTML/CSS/JS running in UXP's Chromium-like runtime)           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  File Picker │  │  Mapping UI  │  │  Preview / Apply   │    │
│  │  (Step 1)    │  │  (Step 2)    │  │  (Step 3)          │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘    │
│         │                 │                   │                 │
│  ┌──────▼─────────────────▼───────────────────▼───────────┐    │
│  │                   Plugin State (JS object)               │    │
│  │  { excelData, columns, placeholders, mapping, preview } │    │
│  └──────┬──────────────────────────────────────────────────┘    │
├─────────┼───────────────────────────────────────────────────────┤
│         │           SERVICE / LOGIC LAYER                       │
│  ┌──────▼──────────┐  ┌────────────────────┐                   │
│  │  Excel Parser   │  │  Template Scanner  │                   │
│  │  (xlsx lib)     │  │  (regex on InDesign│                   │
│  │                 │  │   text frames)     │                   │
│  └──────┬──────────┘  └────────┬───────────┘                   │
│         │                      │                               │
│  ┌──────▼──────────────────────▼───────────┐                   │
│  │              Applier Service             │                   │
│  │  (copies doc, iterates frames, fills     │                   │
│  │   text/images, wraps in doScript)        │                   │
│  └──────────────────────┬──────────────────┘                   │
├────────────────────────┬┼──────────────────────────────────────┤
│                        ││     ADOBE UXP BRIDGE LAYER           │
│  ┌─────────────────────▼▼────────────────────────────────┐     │
│  │          require('indesign') — InDesign DOM API        │     │
│  │  app, activeDocument, textFrames, rectangles, pages    │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      require('uxp').storage.localFileSystem              │   │
│  │  getFileForOpening(), getEntry(), read(), write()        │   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    INDESIGN HOST APPLICATION                     │
│  Documents, text frames, image frames, layers, pages            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Manifest (`manifest.json`) | Declares plugin ID, entry points, permissions, host requirements | Static JSON, version-controlled |
| Panel Entry Point | Registers the panel with InDesign, mounts UI to `<body>` | `require('uxp').entrypoints.setup({panels: {...}})` |
| Panel UI | Multi-step wizard UI: file pick → mapping → apply | HTML/CSS with Spectrum UXP widgets; React if using a bundler |
| Plugin State | Single JS object tracking all transient session data | Plain JS object or React state; does NOT persist across sessions |
| Excel Parser | Reads `.xlsx` bytes and extracts columns/rows | `xlsx` (SheetJS) bundled into the plugin |
| Template Scanner | Inspects active InDesign document, finds all text frames, extracts `{{Tag}}` patterns | Uses `require('indesign').app.activeDocument` |
| Applier Service | Duplicates template document, walks frames, replaces tags with mapped data, places images | Uses InDesign DOM; wrapped in `app.doScript` for undo |
| File I/O Bridge | Opens file picker dialogs, reads file bytes | `uxp.storage.localFileSystem.getFileForOpening()` |

## Recommended Project Structure

When using a bundler (Vite + bolt-uxp, webpack, or Parcel — needed for `xlsx` dependency):

```
plugin/
├── manifest.json           # Plugin metadata, permissions, entry points
├── uxp.config.ts           # bolt-uxp or vite config (if using bundler)
├── package.json
├── src/
│   ├── index.html          # Panel shell, loads main.js
│   ├── index.js            # Entry point: registers panel via entrypoints.setup()
│   ├── components/         # UI components (step screens)
│   │   ├── FilePicker.js   # Step 1: pick .xlsx, trigger parse
│   │   ├── MappingUI.js    # Step 2: column → placeholder mapping table
│   │   └── PreviewApply.js # Step 3: confirm mapping, run apply
│   ├── services/           # Pure logic, no UI coupling
│   │   ├── excelParser.js  # xlsx → { headers, rows } using SheetJS
│   │   ├── templateScanner.js # scans doc for {{Tag}} patterns
│   │   └── applier.js      # core: copy doc, fill all placeholders
│   ├── state.js            # Single pluginState object + update helpers
│   └── utils/
│       └── fileIO.js       # uxp.storage wrappers (open dialog, read bytes)
└── dist/                   # Build output loaded by UXP runtime
    ├── manifest.json       # Copied from root
    ├── index.html
    └── index.js            # Bundled output
```

If NOT using a bundler (vanilla UXP, no npm dependencies):

```
plugin/
├── manifest.json
├── index.html
└── main.js                 # Everything: state, UI, logic, InDesign calls
                            # Organized as scoped function groups within one file
```

The bundler path is required for this project because `xlsx` (SheetJS) is an npm package and cannot be loaded without bundling.

### Structure Rationale

- **`services/`:** Logic that touches InDesign DOM or file I/O has no business in UI components. Separating it makes manual testing easier (you can call `excelParser.js` without a running InDesign).
- **`state.js`:** Multi-step wizard needs to pass data forward (Excel columns selected in step 1 feed the mapping UI in step 2, which feeds the applier in step 3). A shared state object is cleaner than prop-drilling across HTML-only components.
- **`dist/`:** UXP Developer Tool (UDT) points to this folder. Source files in `src/` are for humans; `dist/` is what InDesign actually loads.

## Architectural Patterns

### Pattern 1: Single-File Scoped Organization (no-bundler)

**What:** All logic lives in `main.js`, organized into clearly named function groups (state section, file handling section, UI section, InDesign section). No imports, no modules.

**When to use:** Plugin has no npm dependencies, all logic is self-contained, team is comfortable with a large single file.

**Trade-offs:** Simple deployment (no build step), but grows unwieldy fast. `xlsx` dependency rules this out for this project — SheetJS cannot be inlined without a build step.

### Pattern 2: Bundled Multi-File with Vite (bolt-uxp)

**What:** Source is split across logical files with ES6 imports. Vite/webpack bundles everything into `dist/index.js`. The UXP runtime loads only the bundle.

**When to use:** Any project with npm dependencies (required here for `xlsx`), React usage, or TypeScript.

**Trade-offs:** Adds build tooling overhead but gives full npm ecosystem access. Hot-reload via `npm run watch` removes most friction.

**Example entry point wiring:**
```javascript
// src/index.js
const { entrypoints } = require('uxp');

entrypoints.setup({
  panels: {
    'com.yourplugin.panel': {
      show(node) {
        // node is the panel <body> element (manifest v5: payload IS the node)
        renderApp(node);
      },
      destroy() {
        // cleanup
      }
    }
  }
});
```

### Pattern 3: doScript Transaction for Undo

**What:** Wrap all document-mutating operations in `app.doScript()` to make them appear as a single undoable action in InDesign's undo stack.

**When to use:** Any time the plugin writes to the document. Required for the "apply" step.

**Trade-offs:** Undo works well for synchronous scripts. Known limitation: `UndoModes` is ignored for async UXP scripts. For this plugin, the apply operation should be structured synchronously inside `doScript` as much as possible.

```javascript
const { app, ScriptLanguage, UndoModes } = require('indesign');

app.doScript(
  () => {
    // duplicate template + fill all placeholders synchronously
    fillDocument(targetDoc, mapping, rowData);
  },
  ScriptLanguage.UXPSCRIPT,
  [],
  UndoModes.ENTIRE_SCRIPT,
  'Fill Template from Excel'
);
```

## Data Flow

### Primary Workflow (User applies a row to the template)

```
User picks .xlsx file
    ↓
fileIO.js: uxp.storage.localFileSystem.getFileForOpening()
    ↓ (File Entry object)
excelParser.js: reads bytes → xlsx.read() → { headers[], rows[][] }
    ↓
state.js: pluginState.excelData = { headers, rows }
    ↓
MappingUI renders: left col = Excel headers, right col = discovered {{Tags}}
    ↓
templateScanner.js: walks app.activeDocument.textFrames → regex for {{Tag}} → string[]
    ↓
User creates mapping: { "ProductName": "Column B", "Price": "Column C", ... }
    ↓
state.js: pluginState.mapping = { tagName → columnIndex }
    ↓
User picks row number → clicks "Apply"
    ↓
applier.js (inside app.doScript):
  1. doc.duplicate() → workingDoc
  2. walk all textFrames in workingDoc
  3. for each {{Tag}} match: replace with rowData[mapping[tag]]
  4. for image placeholders: place file from path in cell
    ↓
InDesign creates filled document; user sees it as new open document
```

### State Flow (multi-step wizard)

```
[Step 1: File]      [Step 2: Mapping]     [Step 3: Apply]
excelData ──────────────────────────────────────────────→ applier reads
headers ─────────→ shown in mapping table
                   placeholders ────────→ shown in mapping table
                   mapping ─────────────────────────────→ applier reads
                                         selectedRow ───→ applier reads
```

### Key Data Flows

1. **Excel to state:** `File Entry` (UXP object) → `ArrayBuffer` (read) → `SheetJS workbook` → plain JS `{ headers: string[], rows: any[][] }` stored in `pluginState`.
2. **InDesign doc scan:** `app.activeDocument.textFrames[i].contents` → regex `/\{\{(\w+)\}\}/g` → `string[]` of unique tag names.
3. **Template fill:** `pluginState.mapping` + `pluginState.excelData.rows[selectedRow]` → iterate text frames → `String.replace()` on frame contents. For image frames: `workingDoc.pages[0].place(filePath)` or equivalent DOM call.
4. **Undo:** All document writes happen inside `app.doScript(fn, ..., UndoModes.ENTIRE_SCRIPT, 'Fill Template')` → one undo step in InDesign history.

## Scaling Considerations

This is a single-user personal tool. Scaling in the traditional sense does not apply. The relevant concern is document complexity:

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Small template (< 20 tags, 1 page) | No adjustments needed; synchronous fill inside doScript is fine |
| Medium template (20-100 tags, multi-page) | Frame iteration may be slow; consider batching or progress indicator |
| Large template (100+ tags, many images) | Image placement is the bottleneck; async flow needed but conflicts with doScript undo behavior — needs investigation |

### Scaling Priorities

1. **First bottleneck:** Image placement via file paths. Each `place()` call hits the filesystem. For many images, this will feel slow. Mitigation: process text replacements first (fast), then images, with a loading indicator.
2. **Second bottleneck:** Template scanning on large documents (many text frames). Pre-scan on document open and cache the placeholder list in state.

## Anti-Patterns

### Anti-Pattern 1: Direct Document Mutation Without doScript

**What people do:** Call `textFrame.contents = newValue` directly, outside of any transaction wrapper.
**Why it's wrong:** Each mutation creates a separate undo step. User needs to press Cmd+Z 47 times to undo one "apply" operation.
**Do this instead:** Wrap all mutations in `app.doScript(() => { ... }, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, 'label')`.

### Anti-Pattern 2: Modifying the Template Document In-Place

**What people do:** Fill placeholders directly in the open template document.
**Why it's wrong:** The template is destroyed. User must re-open or undo to restore it. Non-destructive workflows require `doc.duplicate()` first.
**Do this instead:** Always `doc.duplicate()` before writing. Write into the copy; leave the original untouched.

### Anti-Pattern 3: Assuming Async Works Inside doScript

**What people do:** Put `await fetch()` or async file reads inside the `doScript` callback.
**Why it's wrong:** UXP's `UndoModes` is ignored for async scripts; the undo grouping breaks. Known InDesign UXP limitation as of 2024.
**Do this instead:** Do all async work (file reads, Excel parsing) before entering `doScript`. Pass the already-resolved data into the synchronous callback.

### Anti-Pattern 4: Skipping Manifest Permissions

**What people do:** Try to open files without declaring `localFileSystem` permission in `manifest.json`.
**Why it's wrong:** UXP sandboxes plugins; file access silently fails or throws without declared permissions.
**Do this instead:** Declare permissions explicitly:
```json
"requiredPermissions": {
  "localFileSystem": "fullAccess"
}
```

### Anti-Pattern 5: Loading xlsx Without a Bundler

**What people do:** Try to `require('xlsx')` or use an ES module import without a build step.
**Why it's wrong:** UXP runtime does not support Node-style require or ES module imports from `node_modules` without bundling.
**Do this instead:** Use Vite (bolt-uxp) or webpack to bundle `xlsx` into the plugin's output file before loading in UXP.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| InDesign DOM | `require('indesign')` — synchronous module import | Must mount DOM API in newer InDesign versions (v20+); `app` is no longer global |
| UXP File System | `require('uxp').storage.localFileSystem` | Use `getFileForOpening()` for dialog-driven file selection; requires manifest permission |
| SheetJS (xlsx) | Bundled npm package; `xlsx.read(arrayBuffer, {type: 'array'})` | Must be bundled; read file as ArrayBuffer via UXP storage API first |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI components ↔ state | Direct read/write of shared `pluginState` object (or React state if using React) | No event bus needed at this project scale |
| Services ↔ InDesign DOM | Services call `require('indesign')` directly; no abstraction layer needed for a single-user tool | If testing outside InDesign ever matters, add a thin InDesign adapter |
| applier.js ↔ fileIO.js | Applier receives already-resolved file paths from state; calls InDesign `place()` with string paths | Image paths from Excel cells are passed through without UXP file entry objects |

## Build Order Implications

Component dependencies determine build order for development phases:

```
1. manifest.json + entry point scaffold    (foundation — nothing works without this)
    ↓
2. File I/O bridge + Excel parser          (data ingestion — prerequisite for all features)
    ↓
3. Template scanner                        (prerequisite for mapping UI)
    ↓
4. Mapping UI (Step 2)                     (requires: columns from parser, tags from scanner)
    ↓
5. Applier service — text replacement      (requires: mapping from Step 2)
    ↓
6. Applier service — image placement       (builds on text replacement)
    ↓
7. Preview capability                      (optional enhancement; builds on all above)
    ↓
8. Styling / color application             (last — least critical, most edge-case)
```

## Sources

- [Plugin manifest — Adobe developer docs](https://developer.adobe.com/indesign/uxp/plugins/concepts/manifest/) — HIGH confidence
- [Plugin entry points — Adobe developer docs](https://developer.adobe.com/indesign/uxp/plugins/concepts/entry-points/) — HIGH confidence
- [UXP file operations recipe — Adobe developer docs](https://developer.adobe.com/indesign/uxp/resources/recipes/file-operation/) — HIGH confidence
- [require('uxp').storage.localFileSystem — Adobe API reference](https://developer.adobe.com/indesign/uxp/reference/uxp-api/reference-js/Modules/uxp/Persistent%20File%20Storage/FileSystemProvider/) — HIGH confidence
- [How to Structure a UXP Plugin for Adobe InDesign — Brad Holmes](https://www.brad-holmes.co.uk/uxp-plugin-engineering/structuring-a-uxp-plugin/) — MEDIUM confidence (community source, verified against official docs)
- [How to Make Custom InDesign Plugins with UXP and React — factory.dev](https://factory.dev/blog/custom-indesign-plugins-uxp-react) — MEDIUM confidence (community source)
- [bolt-uxp Vite boilerplate — hyperbrew/bolt-uxp on GitHub](https://github.com/hyperbrew/bolt-uxp) — MEDIUM confidence
- [Everything That Went into Creating the First-Ever UXP Plugin — Adobe Tech Blog](https://medium.com/adobetech/what-went-into-creating-the-first-ever-uxp-based-plugin-for-adobe-indesign-78bc701c5cbd) — HIGH confidence (official Adobe source)
- [Manifest v5 breakdown — Davide Barranca](https://www.davidebarranca.com/development/Adobe-UXP-things-you-need-to-know-manifest-5.html) — MEDIUM confidence
- [Adding undo to a UXP script — Adobe community forum](https://community.adobe.com/t5/indesign-discussions/adding-undo-to-a-uxp-script/td-p/13402259) — LOW confidence (async + UndoModes limitation; treat as flag for investigation)

---
*Architecture research for: Adobe UXP InDesign data-merge plugin*
*Researched: 2026-03-29*
