# Phase 1: Scaffold - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Loadable UXP plugin with correct manifest, InDesign DOM access, and file I/O wired. This phase delivers the foundation every subsequent phase builds on — correct import patterns, permissions, and a visible panel.

</domain>

<decisions>
## Implementation Decisions

### Panel Location
- Dockable sidebar panel (like Layers or Properties) — always accessible, stays open
- Medium width (~400px) — room for mapping table columns without scrolling
- Auto-scan the active document for tags when the panel opens
- Appears under Plugins > Dessy in InDesign menus

### Project Structure
- Modular by concern: `src/services/` (excel, scanner, fill), `src/ui/` (panel components), `src/utils/`
- Plain JavaScript — no TypeScript (InDesign DOM types are unofficial/partial)
- Preact for panel UI — lightweight React-like component state management
- Adobe Spectrum CSS for styling — native InDesign look and feel

### Dev Workflow
- UDT (UXP Developer Tool) with Vite hot-reload via bolt-uxp
- Errors logged to both UXP Developer Tool console AND shown in panel UI
- User may need UDT installation instructions — include setup guide in README

### Plugin Identity
- Plugin name: "Dessy"
- Menu location: Plugins > Dessy
- Placeholder icon — to be replaced later with a real one
- Target: InDesign 2025 (v20) — UXP v8 support

### From Research (locked)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UXP Platform
- `.planning/research/STACK.md` — Technology stack decisions, manifest structure, SheetJS integration pattern
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow, build order
- `.planning/research/PITFALLS.md` — Critical pitfalls: undo architecture, DOM breaking changes, image path format, manifest permissions

### Project Context
- `.planning/PROJECT.md` — Vision, constraints, key decisions
- `.planning/REQUIREMENTS.md` — Full v1 requirements with REQ-IDs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — this phase establishes the patterns for all future phases

### Integration Points
- bolt-uxp template provides the initial scaffold — build on top of it
- UDT (UXP Developer Tool) is the development/testing harness

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for UXP plugin scaffolding.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-scaffold*
*Context gathered: 2026-03-29*
