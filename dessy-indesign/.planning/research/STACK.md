# Stack Research

**Domain:** Adobe InDesign UXP Plugin (data-driven layout tool)
**Researched:** 2026-03-29
**Confidence:** MEDIUM — core platform facts verified against official Adobe docs and community forums; some version numbers LOW confidence due to CSS-only page fetches on official Adobe docs

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Adobe UXP | v8.0 (InDesign v20.0+) | Plugin runtime platform | The only modern plugin platform for InDesign; CEP/ExtendScript is legacy and will be sunset. UXP v8.0 added Spectrum Web Components and local HTML Webview support. |
| JavaScript (ES2020+) | — | Plugin logic | UXP runs in a V8-based JS engine. No transpilation needed for modern JS syntax when targeting recent InDesign versions. TypeScript is viable with a build step. |
| HTML / CSS (UXP subset) | — | Panel UI | UXP renders a restricted HTML/CSS surface. Not full browser DOM — `window`, `document.body`, and most browser APIs are available but layout engine is limited (no CSS Grid in older UXP versions). |
| InDesign DOM API | v18.5+ | Document manipulation | Accessed via `require('indesign')`. The only way to read/write InDesign documents, text frames, and styling from a plugin. |
| UXP Storage API | — | Local file I/O | `require('uxp').storage.localFileSystem` provides the file picker and binary file reads. The Node `fs` module is NOT available in UXP. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SheetJS Community Edition (`xlsx`) | 0.18.x (standalone script) | Parse .xlsx files | The confirmed-working approach for UXP. Load as a local `xlsx.full.min.js` file via `require('./xlsx.full.min.js')`. The npm package `xlsx` fails in UXP with a `charCodeAt` error — use the standalone bundle instead. |
| Spectrum UXP Widgets (`sp-*`) | Built into UXP runtime | Native-looking panel UI | Use for all interactive controls: `<sp-button>`, `<sp-textfield>`, `<sp-dropdown>`, `<sp-checkbox>`. No install needed — rendered natively by UXP. |
| Spectrum Web Components (SWC) | Requires UXP v7.0+ | Richer UI components | Opt in per component via import. Not all components are available yet; SWC and legacy `sp-*` widgets conflict per component when both declared. Use SWC only for components not available as legacy widgets. |
| `@adobe/cc-ext-uxp-types` | latest | TypeScript types for UXP APIs | Needed only if using TypeScript. Covers the common UXP JS APIs (storage, network, etc.) but NOT the InDesign DOM — those types must be found separately or hand-written. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Adobe UXP Developer Tool (UDT) | Load, reload, debug, and package the plugin | Required for development. Install from Creative Cloud Desktop. Provides devtools (Elements/Console/Sources/Network). Must load plugin via UDT before InDesign shows it in the panel menu. |
| Node.js 18+ | Dependency management and build scripts | Required if using any bundler or npm packages. Not embedded in UXP — only used at build time. |
| Vite (via bolt-uxp boilerplate) | Bundle + hot-reload | Strongly preferred over Webpack for new projects. bolt-uxp (hyperbrew) wires up Vite + TypeScript + Sass for Svelte/React/Vue targeting InDesign. |
| Webpack | Bundle + hot-reload | The older default from Adobe's react-starter template. Works but slower DX than Vite. Acceptable if starting from the Adobe scaffold. |
| VS Code | Editor | Best extension ecosystem for UXP development. |

---

## Installation

This project is a **personal tool with no public distribution**, so the install path is:

```bash
# Option A: No bundler (simplest — viable for this project)
mkdir dessy-indesign-plugin && cd dessy-indesign-plugin
# Download xlsx.full.min.js from https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js
# Place in plugin root alongside main.js and manifest.json

# Option B: Vite + TypeScript via bolt-uxp (recommended if you want hot-reload)
npm create bolt-uxp@latest
# Choose: InDesign, React (or vanilla), TypeScript

# Install SheetJS standalone into project
# Download: https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js
# Do NOT: npm install xlsx  (the npm package fails in UXP with charCodeAt errors)
```

```bash
# TypeScript types (only if using TypeScript build)
npm install -D @adobe/cc-ext-uxp-types typescript
```

---

## Manifest Requirements

Minimum viable `manifest.json` for an InDesign UXP plugin panel:

```json
{
  "id": "com.dessy.indesign",
  "name": "Dessy",
  "version": "1.0.0",
  "manifestVersion": 5,
  "main": "index.html",
  "host": [
    {
      "app": "ID",
      "minVersion": "18.5.0"
    }
  ],
  "entrypoints": [
    {
      "type": "panel",
      "id": "dessy-panel",
      "label": { "default": "Dessy" }
    }
  ],
  "permissions": {
    "localFileSystem": "request",
    "network": {
      "domains": []
    }
  }
}
```

Key facts:
- `"app": "ID"` is the InDesign host identifier (not "Indesign" or "indesign")
- `minVersion: "18.5.0"` is the earliest InDesign that supports UXP plugins
- `manifestVersion: 5` is current (v4 is deprecated; v6 not confirmed for InDesign yet)
- `localFileSystem: "request"` required for file picker and binary file reads
- No network domains needed for this project (Excel parsing is local-only)

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| SheetJS standalone bundle | `exceljs` npm package | exceljs works in UXP per community reports but is heavier (Node.js-style streaming). Use if you need Excel write support or SheetJS licensing is a concern. |
| Vite (bolt-uxp) | Adobe's react-starter (Webpack) | Use Adobe's scaffold if you want zero custom tooling and are comfortable with slower rebuilds. Fine for a personal tool. |
| Spectrum UXP Widgets (`sp-*`) | Custom HTML/CSS | Use custom HTML only for layout structure. For interactive controls, always prefer `sp-*` — they match InDesign's native UI and require no extra CSS. |
| Vanilla JS + no bundler | React/Vue via Vite | If the panel UI is simple (a few dropdowns, a table, a button), vanilla JS avoids build complexity entirely. This project's UI is simple enough for no-bundler. |
| `app.doScript()` for undo grouping | Direct DOM mutations | Direct mutations each create separate undo steps. Wrapping all changes in `app.doScript(fn, ScriptLanguage.UXPSCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Apply Template")` groups them into one undo step. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `npm install xlsx` (the npm package) | Fails at runtime in UXP with `TypeError: x.charCodeAt is not a function`. The CommonJS package assumes Node.js globals not present in UXP. | Download `xlsx.full.min.js` standalone bundle and load with `require('./xlsx.full.min.js')` |
| CEP / ExtendScript | Legacy platform. Adobe has announced CEP deprecation. Worse DX (CSXS message passing, JSX files). This project already decided UXP. | UXP plugin |
| Node.js `fs` module | Not available in UXP runtime. | `require('uxp').storage.localFileSystem` |
| `executeAsModal()` | This is a Photoshop-only API. InDesign does not have it. | `app.doScript()` with `UndoModes.ENTIRE_SCRIPT` for undo grouping in InDesign |
| Webpack (for new setup) | Slower HMR than Vite, more config boilerplate. Still works but no new reason to prefer it. | Vite (via bolt-uxp or manual vite config) |
| CSS Grid (in older UXP) | UXP's CSS layout engine has historically had gaps. Flexbox is more reliably supported. UXP v8 improves this but test carefully. | Flexbox for panel layout |

---

## Stack Patterns by Variant

**If building with no bundler (simplest path):**
- Single `main.js` file with all logic
- `manifest.json` points `main` at `index.html`
- `index.html` loads `main.js` via `<script src="main.js">`
- SheetJS loaded as local `xlsx.full.min.js`
- Viable for this project — UI has ~5 interactive components

**If using bolt-uxp + Vite:**
- Run `npm create bolt-uxp@latest`, choose InDesign + React + TypeScript
- `src/main.tsx` is entry point
- `vite.config.ts` handles bundling to `dist/`
- UDT watches `dist/` folder, hot-reloads on save
- SheetJS: import from the bundle (Vite handles it) OR use standalone bundle

**If prioritizing TypeScript:**
- Add `@adobe/cc-ext-uxp-types` for UXP APIs
- Manually write or source InDesign DOM types (no official `@types/indesign` package confirmed as of 2026-03)
- Reference the community resource: `RolandDreger/indesign-uxp-scripting` on GitHub for type stubs

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| UXP v8.0 | InDesign v20.0+ | Adds SWC support, local HTML Webview |
| UXP v7.0+ | InDesign v19.x | Adds Web Components support |
| UXP (any) | InDesign v18.5+ | First version with UXP plugin support |
| manifestVersion 5 | InDesign v18.5+ | Current manifest format; v4 deprecated |
| SheetJS standalone | UXP any version | No Node.js dependency; loads via require |
| bolt-uxp | Node.js 18+ | Build tooling only, not shipped in plugin |

---

## Sources

- [Adobe InDesign UXP Overview](https://developer.adobe.com/indesign/uxp/) — HIGH confidence (official)
- [UXP Getting Started](https://developer.adobe.com/indesign/uxp/plugins/getting-started/) — HIGH confidence (official)
- [UXP Developer Tools](https://developer.adobe.com/indesign/uxp/introduction/essentials/dev-tools/) — HIGH confidence (official)
- [UXP Manifest (fundamentals)](https://developer.adobe.com/indesign/uxp/resources/fundamentals/manifest/) — HIGH confidence (official, page content verified via search)
- [SheetJS UXP/ExtendScript Demo](https://docs.sheetjs.com/docs/demos/extensions/extendscript/) — HIGH confidence (verified code pattern for UXP file reading)
- [UXP File System API](https://developer.adobe.com/indesign/uxp/reference/uxp-api/reference-js/Modules/uxp/Persistent%20File%20Storage/FileSystemProvider/) — HIGH confidence (official)
- [bolt-uxp (Hyperbrew)](https://github.com/hyperbrew/bolt-uxp) — MEDIUM confidence (popular community boilerplate, verified active)
- [factory.dev: React + UXP guide](https://factory.dev/blog/custom-indesign-plugins-uxp-react) — MEDIUM confidence (third-party, consistent with official docs)
- [Adobe Tech Blog: First UXP InDesign Plugin](https://medium.com/adobetech/what-went-into-creating-the-first-ever-uxp-based-plugin-for-adobe-indesign-78bc701c5cbd) — MEDIUM confidence (Adobe author, practical lessons)
- [CC Dev Forum: Excel parsing in UXP](https://forums.creativeclouddeveloper.com/t/parse-excel-with-uxp-are-there-best-practices/4126) — MEDIUM confidence (community, confirms xlsx npm package failure and exceljs as alternative)
- [CC Dev Forum: undo in UXP](https://forums.creativeclouddeveloper.com/t/is-it-possible-to-make-undomodes-entire-script-when-executing-uxpscript-in-doscript/9047) — LOW-MEDIUM confidence (community, confirms no executeAsModal equivalent)
- [@adobe/cc-ext-uxp-types (npm)](https://www.npmjs.com/package/@adobe/cc-ext-uxp-types) — MEDIUM confidence (official package, scope coverage is partial)

---

*Stack research for: InDesign UXP plugin — data-driven layout tool*
*Researched: 2026-03-29*
