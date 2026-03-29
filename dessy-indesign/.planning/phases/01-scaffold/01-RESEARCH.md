# Phase 1: Scaffold - Research

**Researched:** 2026-03-29
**Domain:** Adobe UXP InDesign Plugin — bootstrap, manifest, Vite + Preact setup, UDT workflow
**Confidence:** MEDIUM-HIGH — manifest structure and InDesign API patterns verified against canonical research files (STACK.md, ARCHITECTURE.md, PITFALLS.md); bolt-uxp scaffold confirmed active on npm and GitHub; Preact+Vite integration is a standard pattern verified against preact.dev and npm registry.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dockable sidebar panel (like Layers or Properties) — always accessible, stays open
- Medium width (~400px) — room for mapping table columns without scrolling
- Auto-scan the active document for tags when the panel opens
- Appears under Plugins > Dessy in InDesign menus
- Modular by concern: `src/services/` (excel, scanner, fill), `src/ui/` (panel components), `src/utils/`
- Plain JavaScript — no TypeScript (InDesign DOM types are unofficial/partial)
- Preact for panel UI — lightweight React-like component state management
- Adobe Spectrum CSS for styling — native InDesign look and feel
- UDT (UXP Developer Tool) with Vite hot-reload via bolt-uxp
- Errors logged to both UXP Developer Tool console AND shown in panel UI
- User may need UDT installation instructions — include setup guide in README
- Plugin name: "Dessy", Menu location: Plugins > Dessy
- Placeholder icon — to be replaced later
- Target: InDesign 2025 (v20) — UXP v8 support
- Use bolt-uxp (Vite) boilerplate for scaffolding
- SheetJS standalone bundle (`xlsx.full.min.js`), not npm install — fails in UXP with charCodeAt error
- Always `require('indesign')` per file — no global `app` access
- Use `.item(n)` for collection access, not bracket notation — bracket returns `undefined` in v18.4+
- Manifest v5 with `localFileSystem` permission — missing permission causes silent null from file picker
- Plugin must be fully unloaded + reloaded after any manifest change

### Claude's Discretion
- Wizard vs single-page panel layout (Claude picks based on workflow complexity)
- Exact Spectrum CSS component choices
- bolt-uxp template variant selection
- README structure and setup instructions detail level

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Summary

Phase 1 establishes the entire foundation: a working bolt-uxp + Vite project that loads in InDesign via UDT, renders a Preact panel, exposes the InDesign DOM via `require('indesign')`, and proves the UXP Storage file picker works. All subsequent phases build on top of this scaffold without touching manifest or build setup.

The project is greenfield — the `dessy-indesign` directory contains only `.planning/`. The scaffold creates everything: `package.json`, `manifest.json`, `uxp.config.ts`, `vite.config.js`, the full `src/` tree, and a placeholder panel component. The critical constraint is **JavaScript only** (no TypeScript for source files, though config files may use TS syntax if bolt-uxp requires it).

bolt-uxp officially supports React, Svelte, and Vue — not Preact. The planner must choose between: (a) scaffolding with React and swapping it for Preact via Vite aliases, or (b) scaffolding with React template and replacing `react`/`react-dom` dependencies manually. Both are standard Preact/compat patterns. Option (a) is lower risk for this phase.

**Primary recommendation:** Run `npx create-bolt-uxp` selecting React + InDesign, then swap React for Preact via `@preact/preset-vite` in `vite.config.js` and manifest pointing to the built `dist/`. Keep the scaffold minimal: panel renders, DOM accessible, file picker opens and returns a path.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bolt-uxp | 1.2.11 | Project scaffold, Vite build, hot-reload wiring | Official-adjacent boilerplate used by production InDesign plugins; wires vite-uxp-plugin, handles manifest copy, builds to `dist/` |
| Vite | (bundled by bolt-uxp) | Bundler + HMR | Fastest rebuild DX for UXP; bolt-uxp uses it internally |
| Preact | 10.29.0 (2026-03-10) | Panel UI component state | Locked decision; React-compatible API at 3KB; replaces React in bolt-uxp template |
| @preact/preset-vite | 2.10.5 (2026-03-20) | Preact JSX transform + React alias in Vite | Automatically sets up `react` → `preact/compat` aliases; one-line Vite plugin |
| Spectrum UXP Widgets (`sp-*`) | Built into UXP runtime | Native-look controls | Zero install; rendered natively by UXP runtime; matches InDesign UI exactly |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `xlsx.full.min.js` (standalone bundle) | 0.18.x (download separately) | Excel parsing — NOT used in Phase 1, but must be placed in project now | SheetJS standalone must NOT be npm-installed; download and place as a local file alongside source |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @preact/preset-vite alias swap | Manual vite.config resolve.alias block | preset-vite handles JSX transform too; manual alias requires additional `@preact/preset-vite` for JSX — just use the preset |
| bolt-uxp React template + Preact swap | Adobe's react-starter (Webpack) | Webpack is slower DX and locked decision is Vite/bolt-uxp |
| Spectrum UXP widgets (`sp-*`) | Custom HTML/CSS | Custom CSS requires matching dark/light theme manually; `sp-*` adapts automatically |

**Installation:**
```bash
# Step 1: Scaffold
npx create-bolt-uxp@latest
# CLI prompts: name = "dessy", app = InDesign, framework = React

# Step 2: Replace React with Preact
npm uninstall react react-dom @vitejs/plugin-react
npm install preact @preact/preset-vite

# Step 3: Replace @vitejs/plugin-react with @preact/preset-vite in vite.config.js
# (see Code Examples below)

# Step 4: Download SheetJS standalone bundle (Phase 2 will use it, but place it now)
# curl https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js -o src/vendor/xlsx.full.min.js
```

**Version verification (confirmed 2026-03-29):**
- `preact`: 10.29.0
- `@preact/preset-vite`: 2.10.5
- `bolt-uxp` (npm): 1.2.11

---

## Architecture Patterns

### Recommended Project Structure

```
dessy-indesign/
├── manifest.json          # Plugin identity, permissions, entrypoints (loaded by UDT)
├── uxp.config.ts          # bolt-uxp config: app targets, panel IDs, output path
├── vite.config.js         # Vite + @preact/preset-vite + vite-uxp-plugin
├── package.json
├── index.html             # Panel shell: <body> target for Preact mount
├── src/
│   ├── index.js           # Entry point: entrypoints.setup() + Preact render
│   ├── components/        # Preact UI components
│   │   └── App.jsx        # Root panel component — placeholder for Phase 1
│   ├── services/          # Pure logic: excel, scanner, fill (stubs in Phase 1)
│   │   ├── excelParser.js # stub
│   │   ├── templateScanner.js # stub
│   │   └── applier.js     # stub
│   ├── utils/
│   │   └── fileIO.js      # UXP Storage wrappers: openFilePicker(), readFileAsBytes()
│   ├── state.js           # Single pluginState object
│   └── vendor/
│       └── xlsx.full.min.js  # SheetJS standalone bundle (Phase 2 uses this)
└── dist/                  # Build output — UDT watches this folder
    ├── manifest.json
    ├── index.html
    └── index.js
```

**Rationale for `src/ui/` vs `src/components/`:** CONTEXT.md specifies `src/ui/` for panel components. Use `src/ui/` not `src/components/` to match the locked directory convention.

Corrected structure to match CONTEXT.md:
```
src/
├── ui/          # Preact components (panel screens)
├── services/    # Logic (excel, scanner, fill)
├── utils/       # Helpers (fileIO, etc.)
└── vendor/      # Third-party bundles (xlsx)
```

### Pattern 1: entrypoints.setup() + Preact Render

**What:** UXP calls `show(node)` when the panel becomes visible. Mount Preact root into that node.
**When to use:** Every UXP panel plugin — this is the only valid entry pattern.

```javascript
// src/index.js
const { entrypoints } = require('uxp');
const { render, h } = require('preact');
const { App } = require('./ui/App');

entrypoints.setup({
  panels: {
    'dessy-panel': {
      show(node) {
        render(h(App, null), node);
      },
      destroy() {
        // cleanup if needed
      }
    }
  }
});
```

Note: `entrypoints.setup()` must be called exactly once. Calling it again throws. Do not wrap in conditional logic.

### Pattern 2: InDesign DOM Import (per-file, never global)

**What:** Always `require('indesign')` at the top of every file that touches InDesign.
**When to use:** Any service or utility that reads/writes the InDesign document.

```javascript
// src/services/templateScanner.js
const { app } = require('indesign');

function getActiveDocument() {
  // Guard: app.documents.length uses .length (allowed); item(0) for access
  if (app.documents.length === 0) {
    throw new Error('No document open in InDesign');
  }
  return app.documents.item(0);
}
```

### Pattern 3: UXP Storage File Picker

**What:** Use `uxp.storage.localFileSystem.getFileForOpening()` for file picker dialogs.
**When to use:** Any user-initiated file selection (Excel file, image paths).

```javascript
// src/utils/fileIO.js
const uxp = require('uxp');
const storage = uxp.storage;
const { formats } = storage;

async function openFilePicker(options = {}) {
  const file = await storage.localFileSystem.getFileForOpening({
    allowMultiple: false,
    types: options.types || ['xlsx']
  });
  return file; // UXP File Entry object, or null if cancelled
}

async function readFileAsBytes(fileEntry) {
  const bytes = await fileEntry.read({ format: formats.binary });
  return bytes; // ArrayBuffer — pass to SheetJS
}
```

Critical: `localFileSystem` permission must be declared in `manifest.json` or `getFileForOpening()` returns `null` silently.

### Pattern 4: Collection Access with .item(n)

**What:** Use `.item(n)` for all indexed access on InDesign collections.
**When to use:** ALWAYS — bracket notation silently returns `undefined` in InDesign 18.4+.

```javascript
// CORRECT
const page = doc.pages.item(0);
const frame = doc.allPageItems.item(i);

// WRONG — silently returns undefined in InDesign 18.4+
const page = doc.pages[0];
```

### Anti-Patterns to Avoid

- **Global `app` access:** Never rely on `app` as a global. Always `const { app } = require('indesign')` in each file.
- **Bracket notation on collections:** `collection[n]` returns `undefined` silently. Always `.item(n)`.
- **`window.alert()` for debugging:** Crashes InDesign in v19.x+. Use `console.log()` exclusively.
- **npm install xlsx:** Fails at runtime with `charCodeAt` error. Use standalone bundle only.
- **Calling `entrypoints.setup()` more than once:** Throws an error. Wire it once at module load.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vite + UXP build pipeline | Custom vite config from scratch | bolt-uxp scaffold | vite-uxp-plugin handles manifest copy, external declarations for `indesign`/`uxp` modules, IIFE output format — all non-obvious |
| React-compatible UI in UXP | Full React (39KB) | Preact + @preact/preset-vite (3KB) | Locked decision; Preact/compat handles JSX transform and alias automatically |
| Spectrum widget styling | Custom CSS for buttons/inputs | `sp-*` UXP widgets | Built into UXP runtime, zero install, auto-adapts to InDesign light/dark theme |
| File picker dialog | Custom HTML file input | `uxp.storage.localFileSystem.getFileForOpening()` | Browser-style `<input type="file">` does not work in UXP; storage API is the only path |
| Hot-reload during dev | Manual plugin reload in UDT | bolt-uxp `npm run dev` | bolt-uxp uses WebSocket-based reload, faster than UDT file watcher |

**Key insight:** UXP is a restricted environment — browser file I/O, Node `fs`, and standard module resolution all fail. Every piece of infrastructure that "just works" in a web app needs a UXP-specific substitute.

---

## Common Pitfalls

### Pitfall 1: Manifest Change Requires Full Unload + Reload
**What goes wrong:** Adding `localFileSystem` permission to the manifest, clicking "Reload" in UDT — file picker still returns `null`. The new permission is not active.
**Why it happens:** UDT's "Reload" refreshes JS/HTML but does NOT re-read the manifest. Permissions are only applied when the plugin is fully unloaded and re-added.
**How to avoid:** After any `manifest.json` change: in UDT, click the plugin row's action menu → Unload, then Load (not Reload).
**Warning signs:** `getFileForOpening()` returns `null`; no permission prompt appears.

### Pitfall 2: bolt-uxp React Template — JSX Transform Must Be Replaced
**What goes wrong:** After swapping `@vitejs/plugin-react` for `@preact/preset-vite`, JSX fails to compile or React is still bundled because the old plugin remains in `vite.config.js`.
**Why it happens:** bolt-uxp template hardwires `@vitejs/plugin-react`. Simply installing Preact without removing the React Vite plugin leaves two competing JSX transforms.
**How to avoid:** Remove `@vitejs/plugin-react` from `plugins[]` in `vite.config.js` AND from `package.json` dependencies before adding `preact()` from `@preact/preset-vite`.

### Pitfall 3: `indesign` and `uxp` Must Be Declared as Externals
**What goes wrong:** Vite tries to bundle `require('indesign')` or `require('uxp')` and fails with "module not found" at build time.
**Why it happens:** These are UXP runtime modules, not npm packages. They exist only inside the UXP runtime, not in `node_modules`.
**How to avoid:** bolt-uxp's `vite-uxp-plugin` handles this automatically for the apps declared in `uxp.config.ts`. Verify that `uxp.config.ts` lists `InDesign` as a target app — this triggers the correct external declarations.

### Pitfall 4: Panel ID Must Match Between manifest.json and entrypoints.setup()
**What goes wrong:** Panel loads but never renders — `show()` is never called.
**Why it happens:** The panel `id` in `manifest.json` `entrypoints[]` must exactly match the key passed to `entrypoints.setup({ panels: { '<id>': ... } })`. Mismatch = UXP registers the panel but never routes lifecycle events to it.
**How to avoid:** Keep a single panel ID constant. In Phase 1, use `'dessy-panel'` in both places.

### Pitfall 5: No Document Open When Panel Auto-Scans
**What goes wrong:** Panel opens and immediately crashes when it calls `app.activeDocument` to auto-scan for tags.
**Why it happens:** The panel opens at InDesign startup before any document is open. `app.activeDocument` throws when no document exists.
**How to avoid:** Guard all document access: check `app.documents.length > 0` before accessing `app.activeDocument`. Phase 1 placeholder UI should show "No document open" state rather than scanning immediately.

---

## Code Examples

Verified patterns from canonical research files and official Adobe sources:

### Manifest v5 — Full Working Example
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
  "requiredPermissions": {
    "localFileSystem": "request"
  }
}
```

Source: STACK.md (canonical, derived from official Adobe developer docs)

Key facts:
- `"app": "ID"` — exact string; not "indesign" or "Indesign"
- `"minVersion": "18.5.0"` — first InDesign with UXP support; targeting v20 is fine
- `manifestVersion: 5` — current; v4 is deprecated
- `requiredPermissions.localFileSystem: "request"` — required for file picker

### vite.config.js — Preact Swap from bolt-uxp React Template
```javascript
// vite.config.js (modified from bolt-uxp React template)
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import uxp from 'vite-uxp-plugin';
import config from './uxp.config';

export default defineConfig(({ mode }) => ({
  plugins: [
    preact(),               // replaces @vitejs/plugin-react; handles JSX + react→preact aliases
    uxp(config, mode)       // bolt-uxp plugin: externals, manifest copy, IIFE output
  ],
  build: {
    sourcemap: true,
    minify: false           // UXP debugger works better with unminified output
  }
}));
```

Source: bolt-uxp vite.config.ts (adapted); @preact/preset-vite npm page

### Panel Entry Point with Preact
```javascript
// src/index.js
const { entrypoints } = require('uxp');
const { render, h } = require('preact');
const App = require('./ui/App').default;

entrypoints.setup({
  panels: {
    'dessy-panel': {
      show(node) {
        render(h(App, null), node);
      }
    }
  }
});
```

### Minimal Panel Component (Phase 1 Placeholder)
```jsx
// src/ui/App.jsx
const { h } = require('preact');
const { useState } = require('preact/hooks');

function App() {
  const [status, setStatus] = useState('Ready');

  async function testFilePicker() {
    const uxp = require('uxp');
    const file = await uxp.storage.localFileSystem.getFileForOpening({
      allowMultiple: false,
      types: ['xlsx']
    });
    if (file) {
      setStatus(`Selected: ${file.name}`);
    } else {
      setStatus('No file selected');
    }
  }

  function testInDesignDOM() {
    const { app } = require('indesign');
    if (app.documents.length === 0) {
      setStatus('No document open');
      return;
    }
    const doc = app.documents.item(0);
    setStatus(`Active doc: ${doc.name}`);
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2>Dessy</h2>
      <p>Status: {status}</p>
      <sp-button onClick={testInDesignDOM}>Test InDesign DOM</sp-button>
      <sp-button onClick={testFilePicker}>Test File Picker</sp-button>
    </div>
  );
}

module.exports = { default: App };
```

### File Picker + Binary Read (fileIO.js)
```javascript
// src/utils/fileIO.js
const uxp = require('uxp');
const storage = uxp.storage;

async function openXlsxPicker() {
  return storage.localFileSystem.getFileForOpening({
    allowMultiple: false,
    types: ['xlsx']
  });
}

async function readFileAsArrayBuffer(fileEntry) {
  const bytes = await fileEntry.read({ format: storage.formats.binary });
  return bytes; // ArrayBuffer for SheetJS
}

module.exports = { openXlsxPicker, readFileAsArrayBuffer };
```

Source: ARCHITECTURE.md + STACK.md (canonical); UXP Storage API docs

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global `app` variable | `require('indesign')` per file | InDesign 18.4 (2023) | Old snippets silently break; must require in every file |
| Bracket notation `collection[n]` | `.item(n)` method | InDesign 18.4 (2023) | Silent undefined; no error thrown |
| CEP/ExtendScript | UXP plugin | InDesign 18.5 (2023) | CEP deprecated; UXP is the only modern path |
| `manifestVersion: 4` | `manifestVersion: 5` | UXP 6.0 | v4 deprecated; use v5 |
| Webpack (react-starter template) | Vite (bolt-uxp) | 2023–2024 | Faster HMR; bolt-uxp is now the standard scaffold |
| `executeAsModal()` | `app.doScript()` + `UndoModes.ENTIRE_SCRIPT` | n/a | `executeAsModal()` is Photoshop-only; InDesign uses `doScript` |

**Deprecated/outdated:**
- `window.alert()`: Crashes InDesign v19.x+. Use `console.log()`.
- `npm install xlsx`: Runtime charCodeAt error. Use standalone bundle.
- Pre-18.4 UXP samples: Use bracket notation and global `app` — both silently broken.

---

## Open Questions

1. **bolt-uxp template selection — React vs plain**
   - What we know: bolt-uxp React template is the closest to what we need; no Preact template exists
   - What's unclear: Whether the bolt-uxp CLI asks for a "vanilla/no framework" option that might be cleaner to start from
   - Recommendation: Use React template and swap Preact in — the preset-vite approach is well-understood and low-risk

2. **JSX in .js files vs .jsx files**
   - What we know: @preact/preset-vite defaults to transforming `.jsx` files; `.js` with JSX may need explicit include config
   - What's unclear: Whether bolt-uxp's vite config already sets `include` patterns for `.js` JSX
   - Recommendation: Use `.jsx` extension for all Preact component files to avoid config issues

3. **sp-* widgets with Preact JSX**
   - What we know: `sp-button`, `sp-textfield` etc. are custom elements; they work in HTML and vanilla JS
   - What's unclear: Whether Preact's JSX correctly passes event handlers to custom elements (may need `onClick` → `onclick` or `ref`-based event binding)
   - Recommendation: Test one `sp-button` click handler in Phase 1 scaffold to validate the pattern; fall back to `addEventListener` via `ref` if JSX event props don't fire

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — greenfield project; UXP plugins have no standard unit test setup |
| Config file | None — see Wave 0 |
| Quick run command | Manual: load plugin in UDT, check Console tab for errors |
| Full suite command | Manual: verify each success criterion in InDesign with UDT open |

### Phase Requirements vs Test Map

This phase has no REQ-IDs (foundational infrastructure). The success criteria map to manual smoke tests:

| Criterion | Behavior | Test Type | How to Verify |
|-----------|----------|-----------|---------------|
| SC-1 | Plugin loads without manifest errors | smoke | UDT shows plugin status "Loaded" with no red errors |
| SC-2 | Panel UI visible in InDesign | smoke | Panel appears under Plugins > Dessy menu |
| SC-3 | InDesign DOM accessible | smoke | "Test InDesign DOM" button shows active doc name in panel |
| SC-4 | File picker returns path | smoke | "Test File Picker" button opens OS dialog, returns selected filename |
| SC-5 | `.item(n)` access works | smoke | DOM test uses `.item(0)` — confirmed by no undefined in output |

No automated test framework is appropriate for a UXP plugin scaffold — tests require a running InDesign process. All Phase 1 validation is manual/smoke inside InDesign via UDT.

### Wave 0 Gaps

- [ ] No test infrastructure needed for this phase — all verification is manual smoke testing in InDesign via UDT
- [ ] README with UDT setup instructions — required per CONTEXT.md; no test but must be created

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — manifest structure, SheetJS pattern, UXP versions, npm package notes
- `.planning/research/ARCHITECTURE.md` — entrypoints.setup() pattern, project structure rationale, data flow
- `.planning/research/PITFALLS.md` — collection bracket notation, manifest reload, global app, async pitfalls

### Secondary (MEDIUM confidence)
- [bolt-uxp GitHub README](https://github.com/hyperbrew/bolt-uxp) — framework options (React/Svelte/Vue), CLI commands, generated project structure
- [bolt-uxp vite.config.ts source](https://github.com/hyperbrew/bolt-uxp/blob/master/vite.config.ts) — IIFE format, external declarations pattern, framework plugin slots
- [@preact/preset-vite npm](https://www.npmjs.com/package/@preact/preset-vite) — Preact+Vite setup, automatic React alias handling
- [factory.dev: UXP + React InDesign guide](https://factory.dev/blog/custom-indesign-plugins-uxp-react) — UDT watch folder setup steps, manifest permissions pattern
- [Adobe: Plugin entry points docs](https://developer.adobe.com/indesign/uxp/plugins/concepts/entry-points/) — entrypoints.setup() API

### Tertiary (LOW confidence — needs validation during implementation)
- Preact JSX custom element event handling (sp-* widgets) — no verified source; requires empirical testing in Phase 1

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — bolt-uxp and Preact versions verified against npm registry 2026-03-29; manifest structure confirmed in STACK.md against official docs
- Architecture: HIGH — patterns drawn directly from ARCHITECTURE.md which was researched against official Adobe developer docs
- Pitfalls: HIGH — drawn from PITFALLS.md with known InDesign 18.4 breaking changes; one LOW item (sp-* event handling with Preact) flagged for validation

**Research date:** 2026-03-29
**Valid until:** 2026-06-29 (60 days — UXP platform is relatively stable; bolt-uxp major version changes could affect scaffold commands)
