# Pitfalls Research

**Domain:** Browser-based print design tool (Fabric.js canvas, AI image generation, PDF/InDesign export)
**Researched:** 2026-03-27
**Confidence:** HIGH (Fabric.js gotchas from official docs; MEDIUM for AI/export patterns from multiple credible sources)

---

## Critical Pitfalls

### Pitfall 1: Fabric.js Canvas Not Disposed on Page Switch → Memory Leak

**What goes wrong:**
Multi-page documents require switching between canvas instances (or reloading a single canvas with different JSON). If the previous canvas is not explicitly disposed — or if a new canvas is created for each page — memory accumulates and never gets released. With 4-6 pages in a leaflet, `loadFromJSON()` can balloon memory to 512MB–1GB per canvas within a short session.

**Why it happens:**
Fabric.js does not garbage-collect canvas instances automatically. Developers naturally reach for `new Canvas()` per page or call `loadFromJSON()` without cleaning up the previous state first. Groups with nested images are especially problematic: `canvas.dispose()` only iterates flat objects, so images inside groups never get their dispose called.

**How to avoid:**
- Use a single canvas instance and swap content via `loadFromJSON()` — always call `canvas.clear()` before loading a new page state.
- After `canvas.clear()`, explicitly dispose all group children before clearing: iterate groups, call `.getObjects()` recursively, call `.dispose()` on each `FabricImage`.
- Never hold references to old canvas objects in Zustand state after a page switch — clear the history stack when switching pages.

**Warning signs:**
- Browser task manager shows memory climbing continuously during page navigation
- Page thumbnail generation gets progressively slower
- `canvas.loadFromJSON()` takes noticeably longer after several page switches

**Phase to address:**
Canvas editor foundation phase (when multi-page navigator is built). This architecture decision must be made before the page system exists, not retrofitted.

---

### Pitfall 2: Zustand State and Fabric.js Canvas Desync

**What goes wrong:**
Two sources of truth exist: the Fabric.js canvas object model and Zustand store. When changes happen on the canvas (drag, resize, user interaction) and are not reflected back into Zustand — or when Zustand updates are applied without notifying Fabric.js to re-render — the UI state (properties panel, layer list) shows stale data. This silently corrupts undo/redo history.

**Why it happens:**
Fabric.js has its own event system (`object:modified`, `object:added`, `selection:changed`). Developers build the Zustand store separately and forget to wire canvas events back to store updates. The canvas is the source of truth for visual state, but the panels read from Zustand — so they drift.

**How to avoid:**
- Establish a single canonical rule: **Fabric.js canvas is the source of truth for object state; Zustand is the UI layer**.
- Listen to `canvas.on('object:modified')`, `canvas.on('object:added')`, `canvas.on('object:removed')` and sync those changes into Zustand in a single `syncFromCanvas()` function.
- Never update Zustand object properties directly from the properties panel; instead issue the command to Fabric.js and let the event listener sync back.
- For undo/redo, take JSON snapshots from Fabric via `canvas.toDatalessJSON()` after each committed action — not from Zustand.

**Warning signs:**
- Properties panel shows wrong values after drag/resize
- Layer panel order doesn't match canvas visual order
- Undo restores canvas but panels still show post-undo values

**Phase to address:**
Canvas editor foundation phase. Define the sync contract before building any UI panels.

---

### Pitfall 3: Undo/Redo History Becomes Unusably Slow with Large Canvases

**What goes wrong:**
The simplest undo/redo implementation stores full JSON snapshots of the canvas on every `object:modified` event. With a moderately complex leaflet (10–20 objects, high-res images embedded as base64), each snapshot can be several megabytes. Storing 50+ snapshots means hundreds of megabytes in memory, and calling `loadFromJSON()` to restore each snapshot introduces a visible delay (200–500ms) that makes undo feel broken.

**Why it happens:**
`canvas.toJSON()` includes full base64-encoded image data by default. Developers snapshot on every event including continuous operations (drag move fires `object:modified` hundreds of times per second during a drag).

**How to avoid:**
- Use `canvas.toDatalessJSON()` instead of `canvas.toJSON()` — this stores image references (URLs/IDs) instead of base64 data, keeping snapshots small.
- Debounce history snapshots: only capture state on `mouse:up` or after a completed action, not on every intermediate event.
- Store images separately in a Zustand image registry keyed by ID; serialize only the ID in canvas JSON.
- Cap history at 50 snapshots and drop the oldest when the limit is reached.
- The `fabric-history` npm package does not support Fabric.js v6 — implement history manually or use `zundo` middleware for Zustand as the history store.

**Warning signs:**
- Undo takes perceptibly longer than 100ms
- Memory usage climbs noticeably after several edits
- Browser becomes unresponsive during rapid undo/redo

**Phase to address:**
Canvas editor foundation phase (before undo/redo is exposed to users). The data-less JSON approach must be baked into the architecture from day one.

---

### Pitfall 4: PDF Export Produces Blurry Text and Low-Resolution Output

**What goes wrong:**
The naive PDF export approach rasterizes the Fabric.js canvas to PNG via `canvas.toDataURL()` and embeds that image into a PDF with jsPDF. This produces a raster PDF — text is not selectable, resolution is limited to screen DPI (72–96 PPI), and the result looks blurry when printed at A5/A4 size. Print-ready PDFs require 300 DPI minimum.

**Why it happens:**
`canvas.toDataURL()` reflects the screen-resolution canvas. Developers do not scale up the canvas before rasterizing for export. Additionally, multiplying canvas size by 4x (for 300 DPI at 72 DPI screen) creates a canvas too large for browsers to handle, causing a blank white export due to the browser's max canvas size limit (~16,384 × 16,384 px).

**How to avoid:**
- For the export pipeline: render to an offscreen canvas scaled to the target DPI multiplier (`300/72 ≈ 4.16x`) and use `canvas.toDataURL('image/png', 1.0)`.
- Check the total pixel count before rendering — if it exceeds browser limits, scale down to 150 DPI for the export.
- Consider using `pdf-lib` or `jsPDF` with vector text output for text layers rather than pure rasterization. Add text elements as actual PDF text objects and only rasterize image/shape layers.
- Always test export at actual print size (print a test page at A5 or A4 and inspect sharpness).

**Warning signs:**
- Exported PDF text looks soft or pixelated when zoomed in Acrobat
- Exported PDF file size is unexpectedly small (under-resolution) or blank (over-resolution)
- Testing on a Retina display masks the problem — always test on a 1x display

**Phase to address:**
PDF export phase. Design the export pipeline around the 300 DPI multiplier constraint before implementing the export UI.

---

### Pitfall 5: CORS Taints the Canvas and Blocks Export

**What goes wrong:**
Any image loaded from a cross-origin URL (including Gemini-generated images served from Google's CDN, or Google Fonts) without the `crossOrigin: 'anonymous'` attribute taints the Fabric.js canvas. A tainted canvas throws a `SecurityError` when `toDataURL()` or `toBlob()` is called, silently breaking PDF export and PNG/JPG download.

**Why it happens:**
Fabric.js's `FabricImage.fromURL()` does not set `crossOrigin` by default. Developers test with locally-hosted images and don't notice the problem until they integrate AI-generated images or external asset URLs.

**How to avoid:**
- Always load images via `FabricImage.fromURL(url, { crossOrigin: 'anonymous' })`.
- Proxy AI-generated images through a Next.js API route (`/api/proxy-image`) that fetches and re-serves them from the same origin before placing on canvas.
- Proxy Google Fonts requests through the same origin or pre-load font files locally.
- Add an integration test that loads a cross-origin image and verifies `canvas.toDataURL()` does not throw.

**Warning signs:**
- `SecurityError: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported` in console
- Export works in development (localhost) but fails in production
- PDF export silently produces a blank page

**Phase to address:**
Canvas editor foundation phase (image loading infrastructure). Must be established before the AI image integration phase.

---

### Pitfall 6: mm-to-Pixel Conversion Causes Print Dimension Errors

**What goes wrong:**
The app uses mm as the canonical unit and converts to pixels for screen display at 72 PPI. If the same pixel-to-mm ratio is used naively for PDF export, the exported document will have incorrect physical dimensions. A 148mm × 210mm (A5) leaflet may render as 148px × 210px in the PDF instead of the correct point-based size (419pt × 595pt at 72dpi, or 1748px × 2480px at 300dpi).

**Why it happens:**
Developers use a single `MM_TO_PX` constant for both screen rendering and export, not accounting for the different reference DPIs. CSS assumes 96 PPI for layout, Fabric.js defaults to 72 PPI, and PDF uses 72 points per inch — all different.

**How to avoid:**
- Define conversion functions explicitly:
  - `mmToPx(mm, dpi)` — general conversion: `mm * dpi / 25.4`
  - Screen rendering: `mmToPx(mm, 72)` (Fabric.js default)
  - PDF export at 300 DPI: `mmToPx(mm, 300)`
  - PDF point size: `mm * 72 / 25.4` (points = px at 72 DPI)
- Store all object positions and sizes in mm in Zustand; convert only at render time.
- Include bleed in the export dimensions: add 3mm bleed on each side to the canvas size.
- Write a unit test: `mmToPx(210, 300)` should equal `2480` (A4 height at 300 DPI).

**Warning signs:**
- Printed output is noticeably smaller or larger than expected
- Bleed area is missing or incorrect in exported PDF
- A5 exported PDF opens in Acrobat as a non-standard page size

**Phase to address:**
Canvas editor foundation phase (before any export is built — establish the coordinate system). Verify with a physical print test before shipping.

---

### Pitfall 7: AI Image Generation Fails Silently or Gets Rate-Limited with No User Feedback

**What goes wrong:**
Gemini image generation (`gemini-2.5-flash`) returns HTTP 429 (rate limit) or triggers safety filters (`IMAGE_SAFETY`) without a structured error response the frontend can meaningfully handle. Users click "Generate" and see either a generic error or nothing at all. Worse: some safety filter rejections return a 200 response with no image, not a 4xx error.

**Why it happens:**
- Google cut the Gemini API free tier by 50–92% in December 2025; 2.5 Flash is now capped at 250 RPD on the free tier.
- Safety filters use a dual-layer architecture with aggressive defaults — legitimate commercial prompts (e.g., underwear product photography) can be blocked even with filters relaxed.
- Developers implement generic HTTP error handling that doesn't distinguish between rate limit errors, safety blocks, and model errors.

**How to avoid:**
- Parse Gemini error responses specifically: check for `IMAGE_SAFETY` in the response body, not just HTTP status.
- Implement exponential backoff with jitter for 429 responses; surface a user-friendly "Generation limit reached, try again in X minutes" message.
- For safety filter hits: show a specific message ("Image blocked by safety filter — try adjusting your description") rather than a generic error.
- In the PromptCrafter, pre-screen prompts for known problematic patterns (famous names, financial documents, explicit content) before sending to API.
- Store generated image URLs server-side temporarily so the user can re-use recent generations without hitting rate limits again.
- Always use a paid API key in production — the free tier rate limits are too restrictive for a real product.

**Warning signs:**
- High rate of silent failures in the generate button during testing
- Users report retrying generation multiple times with no result
- `RECITATION` or `IMAGE_SAFETY` strings appearing in API error logs

**Phase to address:**
AI integration phase (PromptCrafter + image generation). Build error handling and retry logic before exposing the feature to users.

---

### Pitfall 8: Next.js 15 SSR Breaks Fabric.js Canvas (Wrong dynamic() Usage)

**What goes wrong:**
Fabric.js directly accesses browser-only globals (`window`, `document`, `HTMLCanvasElement`) and will crash during Next.js server-side rendering. In Next.js 15 App Router, the common `dynamic(() => import(...), { ssr: false })` pattern now fails with a build error if called from a Server Component — it must live inside a `'use client'` file.

**Why it happens:**
In Next.js 15, `dynamic()` with `ssr: false` is restricted to Client Components only. Developers place the dynamic import at the page level, which is a Server Component by default in the App Router. A known Fabric.js GitHub issue (#8444) documents this incompatibility specifically.

**How to avoid:**
- Create a thin wrapper: `EditorCanvas.client.tsx` with `'use client'` at the top that does `export default dynamic(() => import('./EditorCanvasInner'), { ssr: false })`.
- The actual canvas initialization logic goes in `EditorCanvasInner.tsx`.
- Never import Fabric.js from a file without `'use client'` — not even type imports, as they can cause module resolution to pull in Fabric's node-canvas shims.
- Add a `next.config.ts` entry to mark `fabric` as client-side only.

**Warning signs:**
- `ReferenceError: window is not defined` during build or SSR
- `Error: dynamic import with ssr: false from a Server Component` build error
- Build succeeds but the editor page shows a blank canvas on first server render

**Phase to address:**
Canvas editor foundation phase, before any Fabric.js code is written. The wrapper architecture must be the first thing established.

---

### Pitfall 9: InDesign ExtendScript Export Produces an Unusable Script

**What goes wrong:**
The app generates a `.jsx` ExtendScript file for InDesign. Common failure modes: font names don't match InDesign's internal font identifiers (PostScript names vs. display names), coordinates use the wrong origin (Fabric.js uses top-left; InDesign uses bottom-left by default), and text frame sizes don't account for the leading difference between screen and print rendering.

**Why it happens:**
Fabric.js uses a screen coordinate system (origin at top-left, Y increases downward, pixels). InDesign's DOM uses a point-based coordinate system (origin at top-left for documents, but bottom-left for some operations depending on `coordinateSpaceCoordinates`). Google Fonts display names (e.g., "Roboto") differ from PostScript names (e.g., "Roboto-Regular") that InDesign requires.

**How to avoid:**
- Use InDesign's `textFrame.parentStory.textFrameContents` with PostScript font names, not display names. Maintain a mapping table from Google Font family name to PostScript name.
- Verify coordinate transform: Fabric Y origin is top-left; InDesign document coordinates are also top-left at `[0, 0]` — but apply the bleed offset.
- Include a fallback font in the script: if the specified font is not installed, substitute a common alternative.
- Generate the script with enough context that a designer can run it and get a usable starting point, not a perfect replica. Document this expectation clearly in the export UI.
- Test the generated script against actual InDesign 2025/2026 before shipping.

**Warning signs:**
- ExtendScript throws `Font not found` errors when run in InDesign
- Text frames appear in wrong positions after running the script
- Objects are outside the document bleed area

**Phase to address:**
InDesign export phase. Requires a functional InDesign installation for testing — plan time for manual validation.

---

### Pitfall 10: localStorage Hits 5MB Limit with Embedded Images → Silent Data Loss

**What goes wrong:**
Auto-save stores the full project JSON to localStorage every 30 seconds. A project with several AI-generated images stored as base64 data URLs can easily exceed the 5MB localStorage limit. The browser silently fails the write (or throws a `QuotaExceededError` that goes uncaught), and the user loses the last several minutes of work.

**Why it happens:**
A single 512px AI-generated image at base64 encoding is ~700KB. Four images in a project plus canvas state plus history snapshots can exceed 5MB quickly. localStorage is synchronous — the write attempt blocks the main thread briefly before failing, degrading UX even when it doesn't fail.

**How to avoid:**
- Never store image binary data in localStorage. Store image metadata (prompt, generation timestamp, URL) and re-fetch or serve from IndexedDB.
- Use IndexedDB (via `idb` library) for actual image blobs — it has no practical size limit.
- For project JSON, use the image registry pattern: store images in IndexedDB keyed by UUID, reference UUIDs in the Fabric.js JSON.
- Wrap all localStorage writes in try/catch and handle `QuotaExceededError` by showing a "Storage full — please export your project" warning.
- On load, verify the saved JSON is valid before applying it (JSON.parse in a try/catch).

**Warning signs:**
- Console shows `QuotaExceededError: Failed to execute 'setItem' on 'Storage'`
- Auto-save silently stops working after the user adds several images
- Project loads but images are missing (URLs no longer valid, base64 data truncated)

**Phase to address:**
Save/load infrastructure phase. The storage architecture must be designed before auto-save is implemented — retrofitting from localStorage to IndexedDB is expensive.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store base64 images in canvas JSON / localStorage | Simpler serialization, no separate image store | Hits 5MB localStorage limit; undo history becomes huge; export is slow | Never — use IndexedDB from the start |
| One Fabric.js `Canvas` instance per page | Simpler page model | Memory leak, sluggish page switching, browser OOM | Never for multi-page — reuse single canvas instance |
| `canvas.toJSON()` for undo history (includes base64) | Simpler snapshot implementation | Undo steps become multi-MB blobs, 50-step history = hundreds of MB | Never — use `toDatalessJSON()` always |
| Load AI images directly from Gemini CDN URL | No proxy needed | CORS taints canvas, export breaks in production | Never — proxy all external images |
| Use `fabric-history` npm package | Quick undo/redo implementation | Package doesn't support Fabric.js v6; breaks silently | Never for v6 — implement manually |
| Generic HTTP error handling for Gemini API | Faster to build | Safety filter hits look the same as network errors; users get no actionable feedback | Never — Gemini-specific error parsing is required |
| Single `MM_TO_PX` constant for screen + export | Simpler codebase | Exported PDF has wrong physical dimensions | Never — DPI is always context-dependent |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Fabric.js + Next.js 15 | `dynamic({ ssr: false })` in Server Component | Wrap in a `'use client'` file; never import Fabric from server-side code |
| Gemini image gen | Assume 200 response = success | Check for `IMAGE_SAFETY`, `RECITATION`, and empty candidates array even on 200 |
| Gemini image gen | Use `gemini-2.5-pro` for images | Use `gemini-2.5-flash` (image-capable model) — Pro does not generate images directly |
| Google Fonts + canvas export | Load fonts via CSS `@import` only | Pre-load fonts with `FontFace` API and call `document.fonts.ready` before calling `canvas.toDataURL()` |
| External images on canvas | Load images without `crossOrigin` attribute | Always pass `{ crossOrigin: 'anonymous' }` to `FabricImage.fromURL()` and proxy from same origin |
| InDesign ExtendScript | Use Google Fonts display names in script | Map to PostScript font names; include font fallback logic |
| PDF export with jsPDF | Rasterize canvas at screen DPI | Scale offscreen canvas to 300 DPI; use vector text for text layers via pdf-lib |
| Fabric.js v6 | Use `import { fabric }` syntax (v5 style) | Use named imports: `import { Canvas, Rect, FabricImage } from 'fabric'` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Undo snapshot on every `object:modified` event | UI freezes during drag; memory climbs continuously | Debounce snapshots to `mouse:up` only; use `toDatalessJSON()` | After ~30 seconds of normal editing |
| Re-rendering entire canvas on every Zustand state update | Jank during panel interaction (color picker, font selector) | Keep Fabric.js as rendering authority; Zustand drives panels only, not canvas re-renders | As soon as properties panel is built |
| Creating new `FabricImage` objects for history restore | Slow undo (~500ms+), visible flash during restore | Maintain an image object pool; reuse objects when restoring | After 5–10 history steps with images |
| Synchronous `localStorage.setItem()` with large JSON on auto-save | Main thread freeze every 30 seconds | Use `requestIdleCallback` for auto-save; switch to IndexedDB async writes | When project JSON > ~1MB |
| Loading all pages' canvas state into memory at once | Memory spikes on project open | Lazy-load page JSON on page navigation; keep only current page canvas active | With 4+ pages and complex content |
| No `canvas.dispose()` when unmounting editor route | Memory leak on navigate-away / navigate-back | Always dispose in the `useEffect` cleanup function | First navigation cycle |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Gemini API key in client-side code or Next.js `NEXT_PUBLIC_` env var | API key scraped from browser; unauthorized usage billed to account | All Gemini calls must go through Next.js API routes (`/api/generate-image`); never use `NEXT_PUBLIC_` prefix for API keys |
| No rate limiting on `/api/generate-image` route | Automated abuse generates thousands of images at your API cost | Add per-IP rate limiting in the API route using `next-rate-limit` or Vercel Edge middleware |
| Trusting user-provided prompt text without server-side sanitization | Prompt injection attempts to extract API key or generate harmful content | Sanitize prompts server-side; never include raw user input in system prompts that have API key context |
| Loading project JSON from user-provided URL without validation | Path traversal or SSRF via the proxy image route | Validate proxy URLs against an allowlist; never proxy arbitrary user-supplied URLs |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during AI image generation (5–15 second wait) | User thinks the button is broken; clicks multiple times, triggering multiple API calls | Show a progress indicator with estimated time; disable the generate button during generation; queue duplicate requests |
| Undo removes the AI-generated image from the canvas but the generation already happened and cost a credit | User frustration; perception that undo is broken | Make undo for image placement undoable, but keep the generated image in the generation history panel for reuse |
| Export dialog with no preview of what will be exported | User exports at wrong DPI or without bleed, discovers the problem at print | Show a thumbnail preview in the export dialog; highlight bleed area clearly; default to 300 DPI with a warning for 72 DPI |
| Auto-save feedback that only says "Saved" without timestamp | User can't tell how stale the last save is after a crash | Show "Last saved: 2 minutes ago" with a live relative timestamp; change to "Unsaved changes" when dirty |
| No feedback when Google Font is loading mid-design | Text momentarily renders in fallback font; looks like a bug | Show a subtle loading spinner next to font selector; disable export until all fonts are loaded |

---

## "Looks Done But Isn't" Checklist

- [ ] **PDF Export:** Canvas-to-PDF pipeline tested at 300 DPI on a physical printer — not just "it opens in Acrobat"
- [ ] **InDesign Export:** Generated `.jsx` script runs without errors in actual InDesign 2025/2026 — not just "the file is generated"
- [ ] **CORS:** Export tested with AI-generated images on the canvas (not just locally-uploaded images from the same origin)
- [ ] **Multi-page memory:** Browser memory profile shows no growth after switching between all pages 10 times
- [ ] **localStorage limits:** Auto-save tested with a project containing 5+ AI-generated images — no QuotaExceededError
- [ ] **Undo/redo:** 50 undo steps tested with a complex canvas — each step completes in under 100ms
- [ ] **Font loading in export:** PDF export tested with a Google Font that was added after page load (not just the initial font) — font renders correctly in the PDF
- [ ] **Rate limiting:** App handles a 429 from Gemini gracefully with user-visible feedback
- [ ] **Safety filter:** App handles `IMAGE_SAFETY` response from Gemini with specific user guidance
- [ ] **Bleed/crop marks:** Exported PDF crop marks are at the correct offset from the live area edges

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| localStorage storing base64 images hits quota limit | HIGH | Migrate to IndexedDB image store; update serialization format; provide migration script for existing localStorage data |
| Multi-page memory leak discovered after shipping | HIGH | Refactor canvas lifecycle management; add explicit dispose calls; requires regression testing across all canvas operations |
| Undo history using `toJSON()` instead of `toDatalessJSON()` | MEDIUM | Swap snapshot method; clear existing history on upgrade; undo stack reset is acceptable since history is session-only |
| CORS tainting discovered after AI integration | MEDIUM | Add image proxy route; update all `FabricImage.fromURL()` calls to use proxy; test all image loading paths |
| PDF export producing wrong physical dimensions | MEDIUM | Fix `mmToPx()` conversion; test against known paper sizes; users who already exported will need to re-export |
| InDesign script producing wrong font names | LOW | Update PostScript name mapping table; regenerate and re-download script |
| Gemini API key exposed in client bundle | CRITICAL | Rotate API key immediately; add server-side route; audit git history for exposure; review Vercel environment variables |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Canvas not disposed → memory leak | Canvas editor foundation | Memory profile after 10 page switches shows flat memory |
| Zustand/Fabric.js desync | Canvas editor foundation | Properties panel values match canvas after programmatic position change |
| Undo/redo history too large | Canvas editor foundation | 50 undo steps with images completes in <100ms total |
| PDF export blurry / wrong DPI | PDF export phase | Physical A5 print test — text is sharp at 5cm reading distance |
| CORS taints canvas | Canvas foundation (image loading) | Export succeeds after placing a Gemini-generated image on canvas |
| mm/px conversion errors | Canvas editor foundation | Unit test: `mmToPx(210, 300)` === 2480 |
| AI generation silent failures | AI integration phase | 429 and IMAGE_SAFETY responses show user-visible error messages |
| Next.js SSR breaks Fabric.js | Canvas editor foundation (first PR) | `next build` succeeds; no SSR errors in production logs |
| InDesign export font mismatch | InDesign export phase | Generated script runs without errors in InDesign 2026 |
| localStorage quota exceeded | Save/load infrastructure phase | Auto-save works correctly with 5 AI images in project |

---

## Sources

- [Fabric.js Official Gotchas Documentation](https://fabricjs.com/docs/old-docs/gotchas/) — HIGH confidence
- [Fabric.js v6 Upgrade Guide](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-60/) — HIGH confidence
- [Fabric.js Issue #8444 — Incompatibility with Next.js App Router](https://github.com/fabricjs/fabric.js/issues/8444) — HIGH confidence
- [Fabric.js Issue #10011 — Undo/Redo in v6](https://github.com/fabricjs/fabric.js/issues/10011) — HIGH confidence
- [Fabric.js Memory Leak Issues (GitHub)](https://github.com/fabricjs/fabric.js/issues/4848) — HIGH confidence
- [Next.js 15 SSR False Discussion](https://github.com/vercel/next.js/discussions/72236) — HIGH confidence
- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits) — HIGH confidence
- [Gemini IMAGE_SAFETY Troubleshooting Guide](https://www.aifreeapi.com/en/posts/gemini-image-silent-failure-image-safety-fix) — MEDIUM confidence
- [Gemini Free Tier Cut December 2025](https://blog.laozhang.ai/api-guides/gemini-image-generation-limits/) — MEDIUM confidence
- [localStorage vs IndexedDB Performance Analysis (RxDB)](https://rxdb.info/articles/localstorage-indexeddb-cookies-opfs-sqlite-wasm.html) — HIGH confidence
- [Canvas Performance Engineering: 30x Improvement Case Study](https://dev.to/shivuser/how-we-made-our-canvas-application-30x-faster-a-deep-dive-into-performance-engineering-2f8p) — MEDIUM confidence
- [jsPDF PDF Generation Pitfalls (Joyfill, 2025)](https://joyfill.io/blog/creating-pdfs-from-html-css-in-javascript-what-actually-works) — MEDIUM confidence
- [Print-Ready PDF / PDF-X Standards Guide](https://img.ly/blog/what-does-print-ready-pdf-mean-understanding-pdf-x-standards-for-professional-printing/) — MEDIUM confidence
- [Fabric.js Undo/Redo Tips — Alim Özdemir](https://alimozdemir.com/posts/fabric-js-history-operations-undo-redo-and-useful-tips) — MEDIUM confidence
- [Fabric.js Tainted Canvas Issue #5046](https://github.com/fabricjs/fabric.js/issues/5046) — HIGH confidence

---
*Pitfalls research for: AI-powered leaflet design tool (Fabric.js + Gemini + PDF/InDesign export)*
*Researched: 2026-03-27*
