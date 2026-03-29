# Project Research Summary

**Project:** Dessy — InDesign UXP Plugin (data-driven layout tool)
**Domain:** Adobe InDesign UXP Plugin / Excel-to-template data merge
**Researched:** 2026-03-29
**Confidence:** MEDIUM

## Executive Summary

Dessy is an Adobe InDesign UXP plugin that fills document templates with data from Excel (.xlsx) files. The core gap it addresses is real: Adobe's native data merge only accepts CSV/TXT, while every professional workflow uses Excel. All competing tools that accept Excel are either standalone macOS apps (MyDataMerge), legacy CEP plugins being sunset (InData, DesignMerge Pro), or prohibitively expensive. A UXP-based plugin is the correct and future-proof approach — UXP is the only modern plugin platform for InDesign, and CEP has been explicitly deprecated by Adobe.

The recommended build path is a bundled plugin using Vite (via the bolt-uxp boilerplate), with SheetJS loaded as a pre-built standalone bundle for Excel parsing and the InDesign DOM API for all document manipulation. The multi-step wizard model (pick file → map columns to placeholders → apply to a copy) is the established pattern for this type of tool and maps cleanly to the plugin's three core services: Excel parser, template scanner, and applier. The copy-before-fill workflow is mandatory — native InDesign data merge is destructive, and non-destructive fill is the single most cited user request across forums and competitor differentiation material.

The highest-risk area is the undo behavior of UXP's InDesign DOM integration. Every DOM mutation outside of `app.doScript()` creates a separate undo step, making the plugin unusable without explicit transaction wrapping. Additionally, several breaking API changes shipped in InDesign 18.4+ (no more bracket notation on collections, no more global `app`) mean copying pre-18.4 code snippets verbatim will introduce silent failures. Both of these must be addressed in the scaffolding phase before any feature work begins — they cannot be retrofitted cheaply.

## Key Findings

### Recommended Stack

The plugin runtime is Adobe UXP v8.0 (InDesign v20.0+), targeting InDesign v18.5+ as the minimum supported version. The development toolchain is Node.js 18+ for build tooling only (not shipped in the plugin), Vite via the bolt-uxp boilerplate for bundling and hot-reload, and the Adobe UXP Developer Tool (UDT) for loading, debugging, and packaging. SheetJS must be used as the pre-built standalone bundle (`xlsx.full.min.js`) — the npm package `xlsx` fails at runtime in UXP with a `charCodeAt` error due to Node.js globals being absent. The InDesign DOM is accessed via `require('indesign')` (required since v18.4; not global), and file I/O uses `require('uxp').storage.localFileSystem` (Node's `fs` is not available).

**Core technologies:**
- Adobe UXP v8.0: Plugin runtime — the only modern, supported plugin platform for InDesign
- InDesign DOM API (v18.5+): Document manipulation — accessed via `require('indesign')`, the only way to read/write InDesign documents from a plugin
- SheetJS standalone bundle: Excel parsing — loads via `require('./xlsx.full.min.js')`; npm package version fails in UXP
- UXP Storage API: File I/O — `require('uxp').storage.localFileSystem`; replaces Node `fs`
- Vite (bolt-uxp): Build tooling — required for bundling SheetJS and enabling hot-reload
- Spectrum UXP Widgets (`sp-*`): Panel UI controls — built into UXP runtime, no install needed

### Expected Features

The nine P1 features form the complete MVP. They are all interdependent in the order listed — nothing after step 1 (Excel import) works without the previous step being in place. The competitive landscape confirms this set is table stakes: every product in this category (MyDataMerge, InData, DesignMerge Pro) ships all nine. The differentiating features of Dessy are (a) non-destructive fill with undo (no competitor offers this in a UXP plugin), (b) clearer error feedback for unresolved placeholders, and (c) the modern UXP platform vs. legacy CEP.

**Must have (table stakes):**
- Excel (.xlsx) import and column/row display — the entire reason this plugin exists; native merge is CSV-only
- Template placeholder scanner (finds `{{tags}}` in document) — reduces mapping friction
- Manual column-to-placeholder mapping UI — core user interaction
- Row selection (which record to apply) — single-record workflow
- Non-destructive copy of template before fill — original always safe; biggest differentiator
- Text placeholder fill (`{{FieldName}}` replacement) — core fill operation
- Image placeholder fill (places local file into tagged frame) — standard data merge capability
- Error feedback for unresolved placeholders — #1 pain point with native merge
- Undo as a single step — no competitor offers this; enables iteration within a session

**Should have (competitive):**
- Preview of mapped values in panel — reduces apply/undo cycles
- Mapping preset save/load — eliminates re-mapping the same template
- Relative image path resolution — absolute paths break when moving files
- Overset text detection with panel warning — catches long text strings silently breaking layout

**Defer (v2+):**
- Inline style application from data — substantial complexity; needs extended mapping model
- Conditional content (show/hide fields) — catalog-publishing scope, not single-record fill
- Batch multi-record export — fundamentally different product mode; explicitly an anti-feature for this scope

### Architecture Approach

The plugin uses a three-layer architecture: a panel UI layer (HTML/Spectrum widgets) that reads and writes a shared plugin state object; a service layer with three discrete pure-logic modules (Excel parser, template scanner, applier); and an Adobe UXP bridge layer that handles InDesign DOM access and file I/O. The three-step wizard UI (file pick, mapping, apply) maps directly to the three services. All document mutations are wrapped in a single `app.doScript()` call with `UndoModes.ENTIRE_SCRIPT` to produce one undo step. All async work (file reads, Excel parsing) must complete before entering `doScript` — the undo grouping is silently ignored for async inner functions.

**Major components:**
1. Panel Entry Point — registers panel with InDesign, mounts UI to `<body>` via `entrypoints.setup()`
2. Plugin State (`state.js`) — shared JS object holding `{ excelData, columns, placeholders, mapping, selectedRow }`; the data spine for the multi-step wizard
3. Excel Parser (`services/excelParser.js`) — reads `.xlsx` bytes via UXP storage, passes ArrayBuffer to SheetJS, returns `{ headers, rows }`
4. Template Scanner (`services/templateScanner.js`) — walks `app.activeDocument.textFrames`, regex-extracts unique `{{Tag}}` names
5. Applier Service (`services/applier.js`) — duplicates template doc, iterates frames, replaces text tags, places images; wrapped in `app.doScript()`
6. File I/O Bridge (`utils/fileIO.js`) — wraps `uxp.storage.localFileSystem` for file picker and binary reads

### Critical Pitfalls

1. **Undo stack fragmentation** — wrap ALL document mutations in a single `app.doScript(fn, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, 'label')` call; async code inside `doScript` silently breaks undo grouping — complete all async work before entering the callback
2. **Breaking API changes in InDesign 18.4+** — use `.item(n)` not `collection[n]` for indexed access; always `require('indesign')` at the top of every file (no global `app`); use `.equals()` not `===` for DOM object comparison; `instanceof` always returns false on DOM objects
3. **Image placement path format errors** — pass raw absolute POSIX path string with leading `/` to `place()`; never use `file://` URI schemes; normalize Excel-sourced paths at parse time
4. **Async DOM performance** — all DOM traversal and mutation inside synchronous `doScript` inner function; avoid `await` inside loops over text frames; pre-read all data before entering `doScript`
5. **Missing manifest permissions** — declare `"localFileSystem": "request"` in `requiredPermissions` before writing any file code; after manifest changes, do full unload + reload in UDT (simple Reload is insufficient)

## Implications for Roadmap

Based on research, all architectural and pitfall analysis converges on the same build order. The dependency chain from ARCHITECTURE.md's "Build Order Implications" section aligns exactly with the feature dependency graph from FEATURES.md. Suggested phase structure:

### Phase 1: Foundation and Scaffold
**Rationale:** Nothing works without this. The manifest, entry point, and import patterns must be established before any feature code is written. Three pitfalls (missing permissions, missing `require('indesign')`, bracket notation on collections) are errors of omission that corrupt all subsequent code if not addressed here.
**Delivers:** Loadable plugin with correct manifest, entry point wired, InDesign DOM accessible, file picker operational
**Addresses:** Manifest permissions, correct `require('indesign')` import pattern, `.item(n)` over bracket notation
**Avoids:** Pitfalls 4 (DOM import), 6 (manifest permissions), 7 (DOM object equality) from PITFALLS.md

### Phase 2: Data Ingestion
**Rationale:** All features depend on having Excel data in memory. This phase produces the parsed data that feeds every subsequent phase.
**Delivers:** File picker opens `.xlsx`, SheetJS parses it, `{ headers, rows }` available in plugin state, columns displayed in panel
**Uses:** SheetJS standalone bundle, UXP Storage API, Vite bundler (required for SheetJS)
**Implements:** Excel Parser service, File I/O Bridge, Plugin State initialization

### Phase 3: Template Scanning
**Rationale:** The mapping UI (Phase 4) requires knowing what tags exist in the document. Scanner must run before the mapping table can be populated.
**Delivers:** Scanned list of unique `{{Tag}}` names from active document, displayed alongside Excel columns in mapping UI
**Implements:** Template Scanner service
**Note:** Pre-scan on document open and cache results in state to avoid rescanning on every panel interaction

### Phase 4: Mapping UI and Row Selection
**Rationale:** Requires Excel columns (Phase 2) and document tags (Phase 3). This is the core user interaction — the panel becomes useful here.
**Delivers:** Column-to-tag mapping table, row selector, mapping persisted in plugin state
**Addresses:** Manual mapping (explicit, predictable — avoids fragile auto-linking)
**Note:** Keep mapping purely manual for v1; auto-matching is an explicitly identified anti-feature

### Phase 5: Text Placeholder Fill with Undo
**Rationale:** The first fill operation must establish the `doScript` transaction pattern. Implementing undo correctly here prevents retrofitting later — recovery cost is HIGH if skipped.
**Delivers:** "Apply" button duplicates template document, replaces all `{{Tag}}` text placeholders with mapped Excel values, single Cmd+Z reverts all changes
**Avoids:** Pitfall 1 (undo stack fragmentation), Pitfall 5 (async DOM performance)
**Critical:** Establish `doScript` synchronous pattern here — all async work completes before entering callback

### Phase 6: Image Placeholder Fill
**Rationale:** Builds on the applier from Phase 5. Image placement is a distinct code path with its own pitfall (path format errors) that warrants a dedicated phase.
**Delivers:** Tagged image frames receive local file images via absolute path strings from Excel cells
**Avoids:** Pitfall 3 (image placement path format errors) — normalize paths at parse time, strip URI prefixes, ensure leading `/`
**Note:** Pass `.nativePath` string (not UXP File entry object) to InDesign `place()`

### Phase 7: Error Handling and Validation
**Rationale:** Error feedback is listed as P1 in FEATURES.md and is the most-cited pain point with native InDesign data merge. Must be in v1 before shipping.
**Delivers:** Pre-apply scan reports unresolved `{{tags}}` with names; post-apply report shows which placeholders were skipped; unfilled placeholders do not silently remain as `{{Tag}}` in output
**Addresses:** "Clear error feedback for unresolved placeholders" table stakes feature

### Phase 8: Polish and V1.x Enhancements
**Rationale:** Once core workflow is solid, add quality-of-life features that reduce repeated friction in personal use.
**Delivers:** Preview of mapped values in panel, mapping preset save/load, relative image path resolution, overset text detection with panel warning
**Note:** These are all P2 features with LOW-MEDIUM implementation cost; sequence within this phase based on personal friction encountered during Phase 5-7 usage

### Phase Ordering Rationale

- Phases 1-3 are infrastructure — no user-visible feature is possible without all three
- Phase 4 (mapping) is the first interactive feature but depends on both data (Phase 2) and tags (Phase 3)
- Phase 5 must establish the `doScript` pattern before any document writes occur — retrofitting undo grouping is expensive
- Phase 6 is deliberately separate from Phase 5 because image path handling has a distinct failure mode that benefits from focused implementation
- Phase 7 (error feedback) is explicitly P1 in FEATURES.md and must land before the tool is considered "done"
- Phase 8 contains all P2 features; deferring them ensures the core loop is validated before adding enhancement complexity

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Text Fill + Undo):** The async/doScript interaction is documented as having rough edges in UXP. Specifically, whether `UndoModes.ENTIRE_SCRIPT` works reliably in the current InDesign version should be verified empirically during implementation, not assumed from docs alone.
- **Phase 6 (Image Placement):** Path format behavior in production installs (vs. UDT) has known version-specific breakage (InDesign 21.0+). Test production install path early.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scaffold):** bolt-uxp boilerplate is well-documented; manifest v5 format is stable
- **Phase 2 (Data Ingestion):** SheetJS + UXP storage pattern is confirmed with working code examples
- **Phase 3 (Template Scanner):** Regex on `textFrames[].contents` is straightforward; well-documented DOM traversal
- **Phase 4 (Mapping UI):** Standard HTML/Spectrum widget form pattern; no novel integration
- **Phase 8 (Polish):** All P2 features are enhancements to already-working code paths

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core platform facts verified against official Adobe docs; SheetJS UXP pattern confirmed via official SheetJS demo. Some version numbers (UXP v8.0 feature set) LOW confidence due to CSS-only renders on some official pages. |
| Features | MEDIUM | Competitive landscape verified via official product pages (MyDataMerge, DesignMerge Pro). User pain points confirmed via Adobe UserVoice and CreativePro editorial. InData feature list is LOW confidence (page did not render). |
| Architecture | MEDIUM-HIGH | Three-layer architecture and component responsibilities drawn directly from official Adobe UXP developer docs and verified working code examples. Async/doScript undo limitation is community-sourced (LOW confidence for exact behavior); needs empirical verification. |
| Pitfalls | MEDIUM | Most pitfalls confirmed via official Adobe Tech Blog first-hand accounts and Adobe community forums. Breaking API changes (18.4+) sourced from Roland Dreger's changelog — reputable community source but not official Adobe docs. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Async + `doScript` undo behavior:** Whether `UndoModes.ENTIRE_SCRIPT` is silently ignored for all async UXP scripts, or only for specific async patterns, is not definitively documented. Validate with a minimal test during Phase 5 before building the full applier.
- **InDesign DOM types for TypeScript:** No official `@types/indesign` package exists. If TypeScript is used, hand-written or community type stubs (`RolandDreger/indesign-uxp-scripting`) are the only option — coverage will be incomplete.
- **Windows path normalization:** Image paths from Excel on Windows use backslash separators and drive letters. The path normalization logic in Phase 6 needs explicit Windows testing to avoid macOS-only behavior.
- **InData feature set:** The InData product page did not render during research. Its feature set is inferred from community descriptions only.

## Sources

### Primary (HIGH confidence)
- [Adobe InDesign UXP Overview](https://developer.adobe.com/indesign/uxp/) — platform capabilities, UXP vs. CEP decision
- [UXP Getting Started](https://developer.adobe.com/indesign/uxp/plugins/getting-started/) — scaffold pattern, entry point wiring
- [UXP Manifest (fundamentals)](https://developer.adobe.com/indesign/uxp/resources/fundamentals/manifest/) — manifest v5 format, permissions
- [UXP File System API](https://developer.adobe.com/indesign/uxp/reference/uxp-api/reference-js/Modules/uxp/Persistent%20File%20Storage/FileSystemProvider/) — file I/O patterns
- [UXP File Operations Recipe](https://developer.adobe.com/indesign/uxp/resources/recipes/file-operation/) — confirmed storage API usage
- [Adobe Tech Blog: Creating the First UXP Plugin for InDesign](https://medium.com/adobetech/what-went-into-creating-the-first-ever-uxp-based-plugin-for-adobe-indesign-78bc701c5cbd) — first-hand undo fragmentation account, platform gotchas
- [SheetJS UXP/ExtendScript Demo](https://docs.sheetjs.com/docs/demos/extensions/extendscript/) — confirmed xlsx standalone bundle pattern for UXP

### Secondary (MEDIUM confidence)
- [bolt-uxp (Hyperbrew)](https://github.com/hyperbrew/bolt-uxp) — Vite boilerplate for InDesign plugins
- [MyDataMerge product site](https://mydatamerge.com/) — competitor feature set
- [DesignMerge Pro](https://meadowsps.com/designmerge-pro/) — competitor feature set
- [factory.dev: React + UXP guide](https://factory.dev/blog/custom-indesign-plugins-uxp-react) — architecture patterns
- [Roland Dreger: indesign-uxp-scripting what_is_new.md](https://github.com/RolandDreger/indesign-uxp-scripting/blob/main/what_is_new.md) — breaking API changes in 18.4+
- [Adobe Developer Forums: image placement path format](https://forums.creativeclouddeveloper.com/t/how-to-place-image-from-file-system-in-uxp-indesign-script/7974) — leading-slash requirement
- [CreativePro: Data Merge troubleshooting](https://creativepro.com/troubleshooting-data-merge-errors/) — user pain points with native merge
- [Adobe UserVoice: placeholder not found errors](https://indesign.uservoice.com/forums/601021-adobe-indesign-feature-requests/suggestions/39078319-the-dreaded-data-merge-there-is-at-least-one-data) — confirmed user pain point

### Tertiary (LOW confidence)
- [CC Dev Forum: Excel parsing in UXP](https://forums.creativeclouddeveloper.com/t/parse-excel-with-uxp-are-there-best-practices/4126) — confirms xlsx npm package failure, exceljs as alternative
- [CC Dev Forum: undo in UXP](https://forums.creativeclouddeveloper.com/t/is-it-possible-to-make-undomodes-entire-script-when-executing-uxpscript-in-doscript/9047) — confirms no executeAsModal equivalent; async undo behavior needs empirical verification
- [Adobe community: Catalog Data Merge Plugins](https://community.adobe.com/t5/indesign/catalog-data-merge-plugins/td-p/10466740) — InData feature descriptions

---
*Research completed: 2026-03-29*
*Ready for roadmap: yes*
