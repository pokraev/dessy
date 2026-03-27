# Project Research Summary

**Project:** Dessy — AI-powered leaflet/flyer design web app
**Domain:** Browser-based print design tool (canvas editor + AI image generation + export pipeline)
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

Dessy is a print-first web design tool that pairs a Fabric.js canvas editor with Gemini-powered AI image generation. The core value proposition — speed from blank canvas to print-ready PDF — is well-supported by available libraries: Fabric.js 7 handles the canvas object model, jsPDF handles export, and the new `@google/genai` SDK (GA May 2025) covers both prompt enrichment and native image generation. The architecture pattern is established: treat Fabric.js as an imperative island within a declarative Next.js/React app, bridge events to Zustand for UI state, and route all Gemini calls through server-side API routes to keep the API key off the client bundle.

The primary differentiator is PromptCrafter — an AI prompt enrichment flow (Subject-Context-Style framework) that transforms vague user descriptions into production-quality image generation prompts. No competitor (Canva, Adobe Express, Kittl) offers prompt enrichment as a first-class feature. Secondary differentiators are bifold/trifold fold guides, mm-native document dimensions, and InDesign ExtendScript export — all absent from web-based competitors. These features cluster naturally into a build sequence: get the canvas foundation right first, then layer export capabilities, then AI features, then differentiating export formats.

The highest-risk areas are all infrastructure decisions that must be made in Phase 1 and are expensive to retrofit: canvas memory management for multi-page documents (single-canvas-instance architecture with explicit dispose), the coordinate system (mm as canonical unit, DPI-aware conversion functions), image storage (IndexedDB for blobs, not localStorage), and the Fabric.js/Next.js SSR boundary (client-only wrapper with `dynamic({ ssr: false })`). Getting these four decisions wrong early causes compounding problems across every subsequent phase.

---

## Key Findings

### Recommended Stack

The stack is built around Next.js 15 (App Router, server-side API routes for Gemini key isolation), Fabric.js 7 (TypeScript-native canvas library), Zustand 5 (lightweight state with no provider boilerplate), and `@google/genai` 1.x (the new unified Google AI SDK — the old `@google/generative-ai` reaches EOL August 2025). Tailwind CSS 4 (CSS-first config, Oxide engine) handles styling. For export: jsPDF 4 for PDF and custom ExtendScript generation for InDesign.

**Core technologies:**
- **Next.js 15 + TypeScript 5.8:** Framework and type safety — App Router keeps Gemini keys server-side via API routes; note Next.js 16 is current stable but project is pinned to 15
- **Fabric.js 7.2:** Canvas object model — most mature interactive canvas library; ships its own TypeScript types (do NOT install `@types/fabric`)
- **Zustand 5:** Client state management — zero boilerplate, concurrent-safe via `useSyncExternalStore`; use with zundo for undo/redo history
- **`@google/genai` 1.x:** Gemini SDK — use `gemini-2.5-flash` for prompt enrichment, `gemini-2.5-flash-image` for image generation ($0.039/image)
- **Tailwind CSS 4:** Utility CSS — dark mode via `@custom-variant` in CSS (config format changed from v3)
- **jsPDF 4:** Client-side PDF generation — use `toDataURL({ multiplier: 4.17 })` for 300 DPI; do not use outdated v2 documentation
- **zundo 2:** Undo/redo middleware for Zustand — use `toDatalessJSON()` snapshots, not full `toJSON()`, to keep history small

**Critical version warnings:**
- Do NOT install `@types/fabric` — Fabric.js 6+ ships its own types; this package overwrites them with stale v4 types
- Do NOT use `@google/generative-ai` — deprecated, EOL August 31 2025
- `dynamic({ ssr: false })` must live inside a `'use client'` file in Next.js 15 App Router

### Expected Features

Research confirmed the feature landscape against competitors (Canva, Adobe Express, Kittl). See [FEATURES.md](.planning/research/FEATURES.md) for full details.

**Must have (table stakes) — all P1:**
- Drag-and-drop canvas editor with resize, rotate, snap guides
- Text frames with Google Fonts + typography presets (Headline/Subhead/Body/Caption/CTA)
- Image frames with upload and placement
- Shapes and color blocks
- Layers panel (reorder, visibility, lock)
- Properties panel (position, size, rotation, opacity, fill, border)
- Undo/redo (50 steps via `toDatalessJSON()` snapshots)
- mm-based document with bleed/margin guides
- PDF export at 300 DPI with bleed and crop marks
- PNG/JPG raster export
- Multi-page document with page navigator
- Auto-save to localStorage (project JSON) + IndexedDB (image blobs)
- JSON project save/load

**Should have (differentiators) — P1 for core, P2 for refinements:**
- PromptCrafter AI prompt enrichment + Gemini image generation (primary differentiator; no competitor offers this)
- Brand color swatches (up to 10) with global apply
- Fold line guides for bifold/trifold formats (absent from all major competitors)
- Template gallery (10-20 high-quality print-tested starters)
- InDesign ExtendScript export (unique; enables hybrid print workflow)
- Snap guides and smart alignment
- Right-click context menu

**Defer (v2+):**
- Cloud storage and user accounts (requires auth infrastructure)
- Real-time collaboration (out of scope per project spec)
- CMYK color management (belongs in InDesign)
- Custom font upload (complex licensing; Google Fonts covers v1 needs)
- Expanded template library (50+)

**Anti-features to avoid building:**
- AI-generated full layout from prompt (quality inconsistency; PromptCrafter + templates is the right model)
- Built-in stock photo library (shifts focus, ongoing cost)
- Mobile-first layout (canvas tool requires desktop UX)

### Architecture Approach

The app follows a three-panel editor shell (toolbar/layers/pages left, canvas center, properties/typography/AI right) with Fabric.js as an imperative rendering island bridged to Zustand via event listeners. Zustand is split into four stores: `canvasStore` (selection, active tool, zoom), `editorStore` (UI panel state), `projectStore` (pages, persistence), and `brandStore` (colors, typography presets). All Gemini calls route through three Next.js API routes. The export pipeline operates on an offscreen `StaticCanvas` at target DPI — it never mutates the live editor canvas. See [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) for file structure, data flows, and build order.

**Major components:**
1. **`useFabricCanvas` hook** — owns the Fabric.js instance lifecycle, event binding, and canvas ref; the single point of contact between React and Fabric
2. **Zustand stores (4 slices)** — UI source of truth; Fabric.js is the canvas source of truth; they sync via event bridges
3. **`useHistory` hook** — stack-based undo/redo using `toDatalessJSON()` snapshots, debounced to `mouse:up`, with `historyProcessing` guard to prevent event recursion
4. **Export pipeline (`lib/export/`)** — offscreen `StaticCanvas` at 300 DPI for PDF/PNG, ExtendScript generator for InDesign; completely isolated from editor canvas
5. **API routes (`/api/ai/`)** — `enrich-prompt`, `generate-image`, `variations`; Gemini SDK used server-side only
6. **Image registry (IndexedDB)** — generated image blobs stored by UUID, referenced in canvas JSON; never embedded as base64 in localStorage

**Build order from architecture research:**
Unit system → canvas shell → Zustand stores → element creation + tools → history → panels → persistence → export → AI integration → InDesign export → template gallery

### Critical Pitfalls

See [PITFALLS.md](.planning/research/PITFALLS.md) for full details on all 10 pitfalls. The five highest-impact ones:

1. **Fabric.js SSR crash in Next.js 15** — `dynamic({ ssr: false })` must be in a `'use client'` wrapper file; never import Fabric from any server-side code. Address in first PR of Phase 1.

2. **Canvas memory leak on multi-page documents** — use a single canvas instance, call `canvas.clear()` before `loadFromJSON()`, and explicitly dispose nested image objects in groups. A new canvas per page causes OOM within minutes. Must be the architectural decision before any page-system code is written.

3. **History snapshots bloating memory** — always use `canvas.toDatalessJSON()` (stores image references, not base64). Debounce snapshot capture to `mouse:up` events only, not continuous `object:modified` events. Using `canvas.toJSON()` at 50 steps = hundreds of MB in memory.

4. **CORS tainting the canvas and blocking export** — always pass `{ crossOrigin: 'anonymous' }` to `FabricImage.fromURL()`. Proxy all AI-generated images through a `/api/proxy-image` Next.js route before placing on canvas. Discovered only in production (works on localhost, breaks with external URLs).

5. **localStorage quota exceeded with image data** — never store image binary data (base64) in localStorage or canvas JSON. Use IndexedDB for image blobs, referenced by UUID in project JSON. A single AI image as base64 can be 700KB–3MB; four images with 50-step history will silently fail the auto-save.

---

## Implications for Roadmap

Based on combined research findings, the dependency graph and pitfall-to-phase mapping from architecture and pitfalls research suggest the following phase structure:

### Phase 1: Canvas Foundation and Infrastructure

**Rationale:** Every other phase depends on a correctly architected canvas. The most expensive pitfalls (SSR crash, memory leak, history bloat, CORS, unit conversion errors) must all be resolved here before any UI panels, AI features, or export functionality is built. Architecture decisions made in this phase are the hardest to change later.

**Delivers:** A working Fabric.js canvas instance in Next.js 15 App Router, mm-based coordinate system with DPI-aware conversion functions, Zustand store architecture (4 slices), Fabric↔Zustand event bridge, image loading infrastructure with CORS-safe proxy, IndexedDB image registry, undo/redo with `toDatalessJSON()` debounced to `mouse:up`, auto-save to localStorage (project JSON) with IndexedDB (image blobs), and JSON project save/load.

**Addresses (from FEATURES.md):** Element selection/move/resize/rotate, undo/redo (50 steps), zoom and pan, auto-save, JSON save/load, mm-based document dimensions.

**Avoids (from PITFALLS.md):** Pitfalls 1 (SSR), 2 (memory leak), 3 (history bloat), 5 (CORS), 6 (unit conversion), 10 (localStorage quota).

**Research flag:** STANDARD — well-documented patterns; architecture research provides implementation-level detail including code examples.

---

### Phase 2: Core Editor UI (Tools, Panels, Elements)

**Rationale:** With the canvas foundation solid, build the editing surface users interact with. ToolBar, LayersPanel, PropertiesPanel, element factory, and keyboard shortcuts are all direct consumers of the stores and canvas established in Phase 1. These can be built largely in parallel once Phase 1 stores are stable.

**Delivers:** Three-panel editor shell, tool modes (pointer/text/image/shape), text frames with Google Fonts integration, image frames with upload, shapes, brand color swatches, layers panel (reorder/visibility/lock), properties panel (position/size/rotation/opacity/fill/border), typography presets (5 presets), keyboard shortcuts (Cmd+Z/C/V/Delete/+/-), snap guides, right-click context menu.

**Addresses (from FEATURES.md):** Drag-and-drop canvas, text editing with font selection, image placement, shapes and color blocks, layers panel, properties panel, color picker, keyboard shortcuts, snap guides, typography presets, brand color swatches.

**Avoids (from PITFALLS.md):** Pitfall 2 (Zustand/Fabric desync — panels must read from store snapshots, never query Fabric directly on render).

**Research flag:** STANDARD — panel architecture is well-established; the split-source-of-truth pattern is clearly documented in ARCHITECTURE.md.

---

### Phase 3: Multi-Page Support and Document Formats

**Rationale:** Multi-page is a prerequisite for bifold/trifold fold guides, and fold guides are a key differentiator. This phase must come before export (which iterates pages) and before template gallery (templates include multi-page formats). The single-canvas-instance architecture from Phase 1 enables safe page switching.

**Delivers:** Page navigator UI (thumbnails, add/remove/reorder), multi-page canvas state management (load/unload per page), bifold and trifold document types with fold line overlays, document format picker (A4, A5, bifold, trifold, custom mm), bleed and margin guide overlays, document dimension system.

**Addresses (from FEATURES.md):** Multi-page document with page navigator, fold guides for bifold/trifold formats, mm-based document with bleed/margin guides.

**Avoids (from PITFALLS.md):** Pitfall 1 (canvas not disposed on page switch — single canvas instance required), Pitfall 6 (unit conversion — bleed dimensions must use DPI-aware `mmToPx(mm, dpi)`).

**Research flag:** STANDARD — multi-page canvas management pattern is documented; single-canvas-instance approach is clear.

---

### Phase 4: Export Pipeline (PDF and Raster)

**Rationale:** PDF export is table stakes for a print tool and validates the print-ready claim. It depends on a stable canvas state, mm/unit system, and multi-page support (all in prior phases). The offscreen canvas pattern isolates export from the live editor — this must be designed correctly the first time (the "looks done but isn't" checklist in PITFALLS.md flags physical print testing as required, not just "opens in Acrobat").

**Delivers:** PDF export at 300/150/72 DPI with bleed area and crop marks, multi-page PDF (iterate pages, `addPage()`), PNG/JPG raster export, export modal with DPI selector and bleed preview thumbnail, font loading verification before export (`document.fonts.ready`).

**Addresses (from FEATURES.md):** PDF export (300 DPI, bleed, crop marks), PNG/JPG raster export.

**Avoids (from PITFALLS.md):** Pitfall 4 (blurry PDF — offscreen canvas at 300 DPI multiplier, check browser canvas size limits), Pitfall 6 (unit conversion — `mmToPx(mm, 300)` for export dimensions).

**Research flag:** NEEDS RESEARCH — the vector text in PDF path (pdf-lib vs. jsPDF raster-only) has a branch decision. STACK.md flags `svg2pdf.js` as an alternative for vector PDF text that needs validation. Recommend a brief research phase to decide raster-vs-vector PDF approach before implementation.

---

### Phase 5: AI Integration (PromptCrafter + Image Generation)

**Rationale:** AI is the primary differentiator but depends on the canvas (to place generated images), CORS-safe image loading (Phase 1), and brand color swatches (Phase 2) for prompt context. Gemini error handling complexity (rate limits, IMAGE_SAFETY silent failures) requires deliberate design. Building AI last in v1 core means it can iterate independently without blocking other features.

**Delivers:** PromptCrafter modal UI (describe → enrich → variations → customize → generate), `/api/ai/enrich-prompt` route (Gemini 2.5 Flash, Subject-Context-Style enrichment, 3 variations), `/api/ai/generate-image` route (Gemini 2.5 Flash Image, base64 response), image history panel (reuse generated images without regenerating), per-IP rate limiting on API routes, explicit error handling for 429 (rate limit) and IMAGE_SAFETY responses.

**Addresses (from FEATURES.md):** PromptCrafter with AI prompt enrichment (primary differentiator), AI image generation in-canvas, generation history and image reuse.

**Avoids (from PITFALLS.md):** Pitfall 7 (AI silent failures — Gemini-specific error parsing required; 200 response can still be a safety block), security pitfalls (API key in server env only, prompt sanitization, rate limiting).

**Research flag:** NEEDS RESEARCH — Gemini image generation API parameters, aspect ratio support, SynthID watermark behavior, and current safety filter thresholds should be validated against the latest `@google/genai` SDK docs before implementation begins.

---

### Phase 6: Template Gallery and Project Dashboard

**Rationale:** Templates depend on a stable serialization format from Fabric.js `toJSON()` (Phase 1) and multi-page support (Phase 3). Building the template gallery last in v1 means templates can be authored with confidence that all canvas features are complete — no template redesign needed when new element types or formats are added.

**Delivers:** Dashboard page (Server Component, no client JS for initial render), template gallery with categories (Sale, Event, Restaurant, Real Estate, etc.), 10-20 print-tested starter templates in JSON format, project grid (new/open/duplicate), FormatPicker (document type selection on new project), template serialization/loading into canvas.

**Addresses (from FEATURES.md):** Template gallery with categories, project management (new/open), dashboard entry point.

**Avoids (from PITFALLS.md):** Template quantity trap (anti-feature: 500+ mediocre templates; research confirms 20 high-quality starters beat 200 average ones).

**Research flag:** STANDARD — dashboard and template gallery are well-understood patterns; no novel technical risk.

---

### Phase 7: InDesign Export

**Rationale:** InDesign export is technically complex, requires a functional InDesign installation for testing, and is a P2 feature (high value for the target professional audience, but not required for initial validation). Deferring it to after core v1 validation aligns with FEATURES.md which marks it as v1.x. It depends on a stable element model and mm-based document model (both from prior phases).

**Delivers:** ExtendScript `.jsx` generator (`lib/export/indesign.ts`), Google Fonts display name to PostScript name mapping table, coordinate transform (Fabric top-left origin to InDesign document coordinates), text frame and image frame ExtendScript generation, font fallback logic, export UI integration, tested against InDesign 2025/2026.

**Addresses (from FEATURES.md):** InDesign export (.jsx ExtendScript) — unique differentiator with no competitor equivalent.

**Avoids (from PITFALLS.md):** Pitfall 9 (InDesign font name mismatch — PostScript names vs. display names; wrong coordinate origin; requires real InDesign testing, not just file generation).

**Research flag:** NEEDS RESEARCH — InDesign ExtendScript API surface for text frames, image frames, and color swatches needs validation against InDesign 2026. The coordinate system and font name mapping will require iteration against a real InDesign instance. Plan extra research time here.

---

### Phase Ordering Rationale

- **Phases 1-3 are sequential by hard dependency:** canvas must exist before panels, panels before multi-page, multi-page before export.
- **Phase 4 (export) before Phase 5 (AI):** Export correctness requires stable canvas state; AI images placed on canvas must survive the export pipeline (CORS proxy from Phase 1 must be validated with AI images before export is called done).
- **Phase 5 (AI) before Phase 6 (templates):** Templates showcasing AI generation must have the generation workflow complete; AI also informs which template styles prove most popular.
- **Phase 6 (templates) before Phase 7 (InDesign):** Templates should be validated with real users before investing in the complex InDesign export path.
- **Phase 7 is explicitly deferrable** to after initial v1 user validation per FEATURES.md prioritization.

---

### Research Flags

**Phases needing `/gsd:research-phase` during planning:**
- **Phase 4 (Export Pipeline):** Vector vs. raster PDF text decision — `svg2pdf.js` vs. jsPDF `addImage()`. STACK.md raises this as unresolved. Needs a proof-of-concept to pick the approach before full implementation.
- **Phase 5 (AI Integration):** Validate current Gemini `@google/genai` 1.x API parameters for image generation (aspect ratios, modality config, response format). Safety filter behavior and current free-tier limits (250 RPD as of Dec 2025 Gemini free tier cuts) should be confirmed before building the error-handling layer.
- **Phase 7 (InDesign Export):** ExtendScript API surface for InDesign 2026, PostScript font name mapping for Google Fonts, coordinate system validation. This phase has unique testing requirements (real InDesign installation).

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Canvas Foundation):** Fabric.js + Next.js App Router patterns are well-documented; ARCHITECTURE.md includes working code examples.
- **Phase 2 (Editor UI):** Panel architecture, Zustand store patterns, keyboard shortcut registration — all standard React patterns.
- **Phase 3 (Multi-page):** Single-canvas-instance page switching is clearly documented; no novel integration risk.
- **Phase 6 (Template Gallery):** Next.js Server Component dashboard with static JSON templates is a standard pattern.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core library versions verified against npm and official release notes; critical version warnings (deprecated SDK, `@types/fabric` conflict) confirmed from primary sources |
| Features | HIGH (table stakes), MEDIUM (differentiators) | Table stakes confirmed against Canva/Adobe Express/Kittl competitor analysis; PromptCrafter differentiator is a novel feature with no direct comps to validate against |
| Architecture | HIGH | Patterns verified across official Fabric.js docs, Google Gemini quickstart repo, and community-validated implementations; code examples are implementation-ready |
| Pitfalls | HIGH (Fabric.js/Next.js), MEDIUM (AI/export) | Fabric.js gotchas sourced from official docs and tracked GitHub issues; Gemini error handling patterns from MEDIUM-confidence community sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Vector PDF text quality:** The raster-only PDF approach (jsPDF + `addImage()`) is confirmed working but produces non-selectable text. `svg2pdf.js` for vector text is noted as higher quality but higher complexity. This choice affects Phase 4 scope significantly and needs a time-boxed proof-of-concept before planning Phase 4.

- **Gemini free tier viability for development:** The free tier was cut 50-92% in December 2025 (250 RPD). Development and testing with real AI generation will likely require a paid API key from the start. Budget and key provisioning should be confirmed before Phase 5 planning.

- **InDesign availability for testing:** Phase 7 (InDesign export) requires a licensed InDesign 2025/2026 installation for validation. This is a planning dependency — identify access to InDesign before committing to Phase 7 scope and timeline.

- **`zundo` + Zustand 5 peer dependency compatibility:** STACK.md notes "community reports both work" for `zundo` with Zustand 5, but flags this as needing verification at install time. Confirm before committing to zundo in Phase 1 — fallback is a custom history array.

- **Gemini 2.5 Flash Image aspect ratio support:** STACK.md confirms 10 aspect ratios and SynthID watermark but the exact API parameters for aspect ratio selection and watermark suppression need validation against the current `@google/genai` SDK docs.

---

## Sources

### Primary (HIGH confidence)
- [Fabric.js Official Docs](https://fabricjs.com/docs/) — canvas patterns, history, SSR gotchas, dispose behavior
- [@google/genai npm (Google official)](https://www.npmjs.com/package/@google/genai) — v1.46.0 current, GA May 2025
- [Gemini Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation) — confirmed production-ready; $0.039/image pricing
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config confirmed
- [Next.js 16 release blog](https://nextjs.org/blog/next-16) — project pinned to 15.x; 16 is current stable
- [Fabric.js Issue #8444](https://github.com/fabricjs/fabric.js/issues/8444) — Next.js App Router incompatibility
- [Fabric.js Issue #10011](https://github.com/fabricjs/fabric.js/issues/10011) — undo/redo in v6
- [High DPI Canvas — web.dev](https://web.dev/articles/canvas-hidipi) — DPI export patterns
- [localStorage vs IndexedDB (RxDB)](https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html) — storage architecture

### Secondary (MEDIUM confidence)
- [Style Factory: Adobe Express vs Canva 2026](https://www.stylefactoryproductions.com/blog/adobe-express-vs-canva) — competitor feature analysis
- [Style Factory: Kittl vs Canva 2026](https://www.stylefactoryproductions.com/blog/kittl-vs-canva) — competitor feature analysis
- [Fabric.js History Operations — Alim Özdemir](https://alimozdemir.com/posts/fabric-js-history-operations-undo-redo-and-useful-tips) — undo/redo implementation
- [Gemini IMAGE_SAFETY Troubleshooting](https://www.aifreeapi.com/en/posts/gemini-image-silent-failure-image-safety-fix) — safety filter error handling
- [jsPDF pitfalls (Joyfill 2025)](https://joyfill.io/blog/creating-pdfs-from-html-css-in-javascript-what-actually-works) — PDF export gotchas
- [Canvas Performance Engineering (dev.to)](https://dev.to/shivuser/how-we-made-our-canvas-application-30x-faster-a-deep-dive-into-performance-engineering-2f8p) — performance patterns

### Tertiary (LOW confidence / needs validation)
- Gemini free tier rate limit cut (December 2025) — 250 RPD reported; verify current limits before Phase 5
- `zundo` + Zustand 5 peer dependency compatibility — community-reported; verify at install time

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
