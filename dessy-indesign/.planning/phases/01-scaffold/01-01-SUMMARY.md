---
phase: 01-scaffold
plan: 01
subsystem: infra
tags: [vite, preact, uxp, indesign, bolt-uxp, vite-uxp-plugin]

requires: []
provides:
  - Vite build pipeline (npm run build -> dist/)
  - manifest.json v5 with localFileSystem permission and dessy-panel entry
  - uxp.config.ts wiring vite-uxp-plugin to InDesign
  - src/index.js entry point with entrypoints.setup() + Preact render
  - src/ui/App.jsx minimal Preact panel component
  - src/state.js shared plugin state object
  - Stub services: excelParser, templateScanner, applier
  - Directory structure: src/ui/, src/services/, src/utils/, src/vendor/
affects:
  - 01-02 (fileIO.js goes in src/utils/)
  - Phase 2 (excelParser.js and SheetJS bundle)
  - Phase 4 (applier.js implements fill logic)

tech-stack:
  added:
    - preact 10.29.0
    - "@preact/preset-vite 2.10.5"
    - vite 5.4.21
    - vite-uxp-plugin 1.2.5
  patterns:
    - "entrypoints.setup() called exactly once in src/index.js with dessy-panel key"
    - "vite-uxp-plugin exports named { uxp } — not default"
    - "uxp.config.ts exports UXP_Config shape with manifest embedded (not a plugins array)"
    - "Preact components use require('preact') and module.exports = { default: Fn }"

key-files:
  created:
    - package.json
    - manifest.json
    - uxp.config.ts
    - vite.config.js
    - index.html
    - src/index.js
    - src/ui/App.jsx
    - src/state.js
    - src/services/excelParser.js
    - src/services/templateScanner.js
    - src/services/applier.js
    - src/utils/.gitkeep
    - src/vendor/.gitkeep
  modified: []

key-decisions:
  - "vite-uxp-plugin uses named export { uxp }, not default export — found during build"
  - "uxp.config.ts must export UXP_Config with manifest embedded directly (not plugins array)"
  - "bolt-uxp CLI cannot run without a TTY; scaffold created manually from research patterns"
  - "dist/ excluded from git via .gitignore; only source files tracked"

patterns-established:
  - "Pattern 1: import { uxp } from 'vite-uxp-plugin' (named export, not default)"
  - "Pattern 2: uxp.config.ts exports { manifest, hotReloadPort, webviewUi, ... } UXP_Config shape"
  - "Pattern 3: entrypoints.setup({ panels: { 'dessy-panel': { show, destroy } } }) in src/index.js"
  - "Pattern 4: Preact CJS style — require('preact'), module.exports = { default: App }"

requirements-completed: []

duration: 20min
completed: 2026-03-29
---

# Phase 01 Plan 01: Scaffold Summary

**Vite + Preact UXP plugin scaffold with manifest v5 and localFileSystem permission, buildable via `npm run build`**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-29T12:09:05Z
- **Completed:** 2026-03-29T12:29:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Full Vite build pipeline established: `npm run build` produces dist/ with manifest.json, index.html, and bundled JS
- manifest.json v5 with `localFileSystem: "request"` permission and `dessy-panel` entrypoint
- Preact replaces React — no react/react-dom in dependencies, @preact/preset-vite handles JSX transform and react alias
- Entry point wired with `entrypoints.setup()` + Preact render; panel ID `dessy-panel` consistent across manifest, uxp.config, and entry point
- All service stubs created with documented interfaces for future phases

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold bolt-uxp project and swap React for Preact** - `4a55877` (feat)
2. **Task 2: Create entry point, App component, stub services, and directory structure** - `2a0115c` (feat)

## Files Created/Modified
- `package.json` - Dependencies: preact, @preact/preset-vite, vite, vite-uxp-plugin
- `manifest.json` - Plugin identity, manifestVersion 5, localFileSystem permission, dessy-panel entry
- `uxp.config.ts` - UXP_Config shape with InDesign target and panel sizing
- `vite.config.js` - Preact preset + vite-uxp-plugin (named export)
- `index.html` - Panel shell with root div and module script entry
- `src/index.js` - entrypoints.setup() wired to dessy-panel with Preact render
- `src/ui/App.jsx` - Minimal Preact component placeholder (h() style)
- `src/state.js` - pluginState object with excelData, tags, mapping, selectedRow, status
- `src/services/excelParser.js` - Stub: parseExcel(arrayBuffer) — Phase 2
- `src/services/templateScanner.js` - Stub: scanDocument() — Phase 2
- `src/services/applier.js` - Stub: applyMapping(mapping, rowData) — Phase 4
- `src/utils/.gitkeep` - Placeholder for Phase 1 fileIO.js
- `src/vendor/.gitkeep` - Placeholder for Phase 2 xlsx.full.min.js

## Decisions Made
- Used named `{ uxp }` import from vite-uxp-plugin (default import fails — module exports named `uxp`)
- uxp.config.ts must use `UXP_Config` shape with `manifest` object embedded (vite-uxp-plugin reads `config.manifest.id` directly)
- bolt-uxp CLI requires a TTY and cannot run in non-interactive mode; project scaffolded manually using research file patterns
- dist/ excluded from git via .gitignore (build artifact, not source)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed vite-uxp-plugin default import**
- **Found during:** Task 1 (first npm run build)
- **Issue:** `import uxp from 'vite-uxp-plugin'` fails — module exports `{ uxp }` as named export
- **Fix:** Changed to `import { uxp } from 'vite-uxp-plugin'`
- **Files modified:** vite.config.js
- **Verification:** Build succeeds after fix
- **Committed in:** 4a55877 (Task 1 commit)

**2. [Rule 3 - Blocking] Rewrote uxp.config.ts to match UXP_Config shape**
- **Found during:** Task 1 (type inspection of vite-uxp-plugin API)
- **Issue:** Original config used a plugins array shape; vite-uxp-plugin reads `config.manifest` directly as UXP_Config
- **Fix:** Rewrote uxp.config.ts to export `{ manifest, hotReloadPort, webviewUi, webviewReloadPort, copyZipAssets }`
- **Files modified:** uxp.config.ts
- **Verification:** Build succeeds; dist/manifest.json correctly generated from config
- **Committed in:** 4a55877 (Task 1 commit)

**3. [Rule 3 - Blocking] Created src files as part of Task 1 to enable build verification**
- **Found during:** Task 1 (build step requires entry point to exist)
- **Issue:** index.html references `/src/index.js` which didn't exist yet, causing rollup to fail
- **Fix:** Created minimal src/index.js and src/ui/App.jsx to allow build to succeed (Task 2 then finalized these)
- **Files modified:** src/index.js, src/ui/App.jsx
- **Verification:** Build succeeds; files finalized in Task 2 commit
- **Committed in:** 2a0115c (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking issues)
**Impact on plan:** All fixes required for build to succeed. No scope creep — the uxp-plugin API shape and TTY limitation are infrastructure-level details the plan assumed would be handled by the bolt-uxp CLI.

## Issues Encountered
- bolt-uxp CLI throws `ERR_TTY_INIT_FAILED` when run without an interactive terminal — cannot scaffold non-interactively. Resolved by manually creating all project files from the verified patterns in RESEARCH.md and STACK.md.

## User Setup Required
None — no external service configuration required. UDT setup instructions will be covered in Phase 1 README (Plan 01-02 or a dedicated docs task).

## Next Phase Readiness
- Build pipeline is ready; Plan 01-02 can add fileIO.js to src/utils/ and test the file picker integration
- Service stubs have documented interfaces so Phase 2 and Phase 4 can implement without re-reading this plan
- dist/ is gitignored; UDT should point to the dist/ folder produced by `npm run build` or `npm run dev`

---
*Phase: 01-scaffold*
*Completed: 2026-03-29*
