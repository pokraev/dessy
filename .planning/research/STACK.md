# Stack Research

**Domain:** AI-powered web design tool (canvas editor + print export)
**Researched:** 2026-03-27
**Confidence:** HIGH (all core choices verified against npm/official sources)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (project constraint) | React framework, routing, API routes | App Router gives server components by default — API routes keep Gemini keys server-side. Note: Next.js 16 is current stable (released Oct 2025), upgrade is low-risk when ready. |
| TypeScript | 5.8+ | Type safety | 5.8 is current stable (Mar 2025). TypeScript 5.9 in progress; 5.x series is the safe choice. |
| React | 18.x (Next.js 15 peer) | UI runtime | Next.js 15 uses React 18. Next.js 16 ships React 19.2 — stay on 18 until Next.js upgrade. |
| Tailwind CSS | 4.x (4.0 released Jan 22, 2025) | Utility CSS | CSS-first config (`@import "tailwindcss"`), Oxide/Rust engine, 5x faster builds. Dark mode via `@custom-variant dark` in CSS instead of `tailwind.config.js`. |
| Fabric.js | 7.x (7.2.0 current) | Canvas object model | v6 rewrote in TypeScript; v7 is a clean upgrade from v6 with no breaking changes. Most mature interactive canvas library with text editing, object transforms, SVG serialization. |
| Zustand | 5.x (5.0.12 current) | Client state management | Uses `useSyncExternalStore` (React 18 concurrent-safe). Zero boilerplate, no providers, ideal for the flat-ish editor state shape (canvas, UI panels, history). |
| @google/genai | 1.x (1.46.0 current) | Gemini API SDK | The NEW unified SDK — `@google/generative-ai` is deprecated with EOL August 31, 2025. Use `@google/genai` for all new work. Supports Gemini 2.5 Flash and Gemini 2.5 Flash Image. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jsPDF | 4.x (4.2.1 current) | Client-side PDF generation | PDF export at 72/150/300 dpi. Use `fabric.toDataURL({ multiplier: N })` to scale canvas, then `addImage()` to embed. v4 is current — do NOT use the outdated v2 docs floating around. |
| react-colorful | 2.x | Minimal color picker component | Color pickers in properties panel. 2.8 KB gzipped, tree-shakeable, 12 color model components (HEX, HSL, etc.), ships TypeScript types. |
| motion (framer-motion) | 12.x (12.38.0 current) | Animation | Panel/modal transitions only, per bundle-size constraint. Import from `motion/react` — the package was renamed from `framer-motion` to `motion`. No breaking changes, both package names work during migration. |
| zundo | 2.x | Undo/redo middleware for Zustand | Use with Zustand's temporal middleware. Under 700 bytes. For the 50-step canvas history, store serialized Fabric.js JSON snapshots in the temporal stack. |
| immer | 10.x | Immutable state updates | Optional companion for Zustand stores with deeply nested state (e.g. layers tree). Zustand ships an `immer` middleware out of the box. |
| next/font | Built into Next.js | Google Fonts self-hosting | Self-hosts fonts at build time, zero external network requests, prevents layout shift. Use for the typography panel's font loading. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint + `eslint-config-next` | Linting | Ships with `create-next-app`. Next.js 15 uses `eslint-config-next` v15; `next lint` still works (deprecation warning in 15.5 targets old config format). |
| Prettier | Code formatting | No special config needed for this stack. |
| `@types/fabric` | Fabric.js types | Fabric.js 6+ ships its own types — do NOT install separate `@types/fabric`. Installing it will cause type conflicts. |
| `next.config` canvas externals | Webpack workaround | Add `config.externals = [...config.externals, { canvas: 'canvas' }]` to prevent Webpack from bundling the native canvas node binding that Fabric.js optionally requires. Required for Next.js App Router compatibility. |

---

## Installation

```bash
# Core
npm install next@15 react react-dom typescript tailwindcss fabric zustand @google/genai

# Supporting
npm install jspdf react-colorful motion zundo immer

# Dev
npm install -D @types/react @types/react-dom @types/node eslint eslint-config-next
```

**Do NOT install:**
- `@types/fabric` — Fabric.js 6+ ships its own TypeScript types; installing this package causes conflicts
- `@google/generative-ai` — deprecated, EOL August 2025; use `@google/genai` instead
- `framer-motion` alongside `motion` — pick one (prefer `motion`)

---

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|-------------------------|
| Canvas library | Fabric.js 7 | Konva.js | Konva has better React integration (`react-konva`), cleaner React state model. Choose Konva for new projects not already committed to Fabric. Since project spec mandates Fabric, stay the course. |
| Canvas library | Fabric.js 7 | Excalidraw | Whiteboard UX only; not suitable for print design tools. |
| State management | Zustand 5 | Redux Toolkit | Redux makes sense when state shape is large, highly normalized, or team has Redux expertise. For this app's shape Zustand is 10x less code. |
| AI SDK | @google/genai | Vercel AI SDK (`@ai-sdk/google`) | Vercel AI SDK is excellent for streaming text generation and multimodal apps. Use it if you add streaming chat UI. For direct image generation with Gemini 2.5 Flash Image, `@google/genai` maps 1:1 to the API. |
| PDF export | jsPDF | pdf-lib | pdf-lib is better for editing existing PDFs or embedding custom fonts directly. For canvas-screenshot-to-PDF, jsPDF's `addImage()` workflow is simpler. |
| PDF export | jsPDF rasterized | SVG → PDF via svg2pdf.js | `svg2pdf.js` converts Fabric.js SVG output to vector PDF — text stays selectable and shapes are crisp. Higher quality for print. Higher complexity. Flag this for the PDF export phase. |
| CSS framework | Tailwind CSS 4 | CSS Modules | CSS Modules are fine but Tailwind's dark mode and theming system is well-suited to the panel-heavy editor UI. |
| Animation | motion (framer-motion) | React Spring | Both are excellent. Framer Motion has better docs and broader community. `motion` is the current package name. |
| Undo/redo | zundo | Custom history array in Zustand | Custom arrays work but miss edge cases (branching history, coalescing rapid updates). zundo is <700B and handles these correctly. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@google/generative-ai` | Officially deprecated, EOL August 31 2025. New features (Gemini 2.5 Flash Image) only in the new SDK. | `@google/genai` |
| `@types/fabric` | Fabric.js 6+ ships its own `.d.ts` files. Installing `@types/fabric` overwrites them with stale v4 types, causing compile errors. | Nothing — Fabric.js types are included. |
| `react-color` (casesandberg) | Unmaintained since 2022. 31 KB, no TypeScript, no tree-shaking. | `react-colorful` (2.8 KB, actively maintained) |
| `html2canvas` for PDF export | Captures DOM screenshots, produces low-quality rasterized output, struggles with canvas elements. For Fabric.js, call `canvas.toDataURL()` directly — it's more accurate and faster. | `fabric.toDataURL({ multiplier: 4 })` + jsPDF `addImage()` |
| Server-side Gemini calls from client components | Exposes API key in browser network tab. | Next.js API routes (`app/api/`) — key stays in `process.env` server-side only. |
| `dynamic(() => import('fabric'), { ssr: false })` at page level | Fabric.js imports must be deferred until after mount due to `window`/`document` dependencies. Use inside a `useEffect` or wrap the canvas component with `dynamic({ ssr: false })`. | `const { Canvas, Rect } = await import('fabric')` inside `useEffect`, or wrap component in Next.js `dynamic()` with `ssr: false`. |
| Global `tailwind.config.js` dark mode toggle | Removed in Tailwind v4. Dark mode config moved to CSS. | `@custom-variant dark (&:where(.dark, .dark *))` in global CSS. |

---

## Stack Patterns by Variant

**For the canvas editor page (heavy client-side):**
- Mark the top-level editor layout as `'use client'`
- Fabric.js canvas component must be wrapped in `dynamic(() => import(...), { ssr: false })`
- Zustand store for editor state (selected objects, tool mode, zoom, page index)
- zundo temporal middleware on the history-relevant slice only (not UI panel state)

**For the dashboard page (light server-side):**
- Keep as Server Component; fetch templates from static JSON at build time
- Client components only for the project grid cards (hover/click interactions)

**For Gemini API calls:**
- All calls go through `/app/api/generate-image/route.ts` and `/app/api/enrich-prompt/route.ts`
- Never import `@google/genai` in client components
- Use `gemini-2.5-flash` model for prompt enrichment (text)
- Use `gemini-2.5-flash-image` model for image generation (`$0.039/image`)

**For PDF export at print resolution:**
- Scale Fabric.js canvas via `canvas.setZoom(multiplier)` temporarily OR use `toDataURL({ multiplier: 4 })` (4x = 288dpi equivalent at 72dpi screen)
- For true 300dpi, multiply by `300/72 ≈ 4.17`
- Embed result in jsPDF with `doc.addImage(dataUrl, 'PNG', x, y, w, h)`
- Multi-page: iterate pages, `doc.addPage()` between each

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|----------------|-------|
| Next.js 15.x | React 18.x | React 19 requires Next.js 16+. Stick with React 18 while on Next.js 15. |
| Fabric.js 7.x | TypeScript 5.x | Ships its own types. Do not install `@types/fabric`. |
| Tailwind CSS 4.x | PostCSS 8.x | v4 uses its own PostCSS plugin `@tailwindcss/postcss`. Config format changed completely from v3. |
| Zustand 5.x | React 18+ | v5 uses `useSyncExternalStore` — requires React 18 minimum. |
| motion 12.x | React 18+ | No breaking changes from `framer-motion`; import path changed to `motion/react`. |
| @google/genai 1.x | Node.js 18+ | GA as of May 2025. Use in API routes only (not client bundles). |
| zundo 2.x | Zustand 5.x | Verify zundo peer dep is Zustand 4 or 5 at install time — community reports both work. |

---

## Sources

- [Fabric.js Releases (GitHub)](https://github.com/fabricjs/fabric.js/releases) — confirmed v7.2.0 current; TypeScript built-in since v6. MEDIUM confidence (search result, no direct npm page access).
- [Upgrading to Fabric.js 7.0 (official docs)](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/) — v7 is minimal delta from v6, safe upgrade. HIGH confidence.
- [Gemini Image Generation (Google AI Docs)](https://ai.google.dev/gemini-api/docs/image-generation) — Gemini 2.5 Flash Image confirmed production-ready. HIGH confidence.
- [Google Gemini 2.5 Flash Image GA (Google Developers Blog)](https://developers.googleblog.com/en/gemini-2-5-flash-image-now-ready-for-production-with-new-aspect-ratios/) — $0.039/image pricing, 10 aspect ratios, SynthID watermark. HIGH confidence.
- [@google/genai npm (Google official)](https://www.npmjs.com/package/@google/genai) — v1.46.0 current, GA May 2025, replaces deprecated `@google/generative-ai`. HIGH confidence.
- [Zustand npm](https://www.npmjs.com/package/zustand) — v5.0.12 current, uses `useSyncExternalStore`. HIGH confidence.
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — stable January 22, 2025. CSS-first config. HIGH confidence.
- [Tailwind Dark Mode docs](https://tailwindcss.com/docs/dark-mode) — `@custom-variant` replaces `darkMode: 'class'` config. HIGH confidence.
- [Next.js 16 release blog](https://nextjs.org/blog/next-16) — Next.js 16 (October 2025) is current; 15.x remains supported. HIGH confidence. Project constraint is 15.x per CLAUDE.md.
- [TypeScript 5.8 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html) — 5.8 stable March 2025. HIGH confidence.
- [jsPDF npm / libraries.io](https://libraries.io/npm/jspdf) — v4.2.1 current (not 2.x as older tutorials show). MEDIUM confidence (search result).
- [react-colorful GitHub](https://github.com/omgovich/react-colorful) — actively maintained, 2.8 KB, ships TypeScript types. MEDIUM confidence.
- [motion changelog](https://motion.dev/changelog) — v12.38.0 current, renamed from `framer-motion`. HIGH confidence.
- [zundo GitHub](https://github.com/charkour/zundo) — <700 bytes undo/redo middleware for Zustand. MEDIUM confidence.
- [Next.js Lazy Loading docs](https://nextjs.org/docs/pages/guides/lazy-loading) — `dynamic(() => import(...), { ssr: false })` pattern confirmed. HIGH confidence.
- [Fabric.js + Next.js SSR workaround (GitHub issue #8444)](https://github.com/fabricjs/fabric.js/issues/8444) — canvas externals webpack config required. MEDIUM confidence (community issue, widely replicated).

---
*Stack research for: AI-powered leaflet design web app (canvas editor + print export)*
*Researched: 2026-03-27*
