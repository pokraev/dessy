# Leaflet Factory

## What This Is

An AI-powered web app for designing print-ready leaflets fast. Designers and non-designers alike can go from blank page to finished leaflet in minutes using a drag-and-drop canvas editor, AI-generated images matched to brand colors, and smart prompt crafting. Quick leaflets are completed entirely in-app; complex ones export seamlessly to InDesign.

## Core Value

Speed — full leaflet from zero to print-ready in minutes, with AI handling the hardest part (generating on-brand images from simple descriptions).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Dashboard with project grid, format picker, CRUD actions
- [ ] Full-screen canvas editor with Fabric.js (drag, resize, rotate, snap guides, zoom, pan)
- [ ] mm-based document with bleed/margin guides, fold lines for bifold/trifold
- [ ] Element types: text frames, image frames, shapes, color blocks, groups
- [ ] Multi-page support with page navigator
- [ ] Left panel: tools, layers (reorder/visibility/lock), page thumbnails
- [ ] Right panel: properties (position, size, rotation, opacity, fill, border, shadow)
- [ ] Typography panel with Google Fonts, presets (Headline, Subhead, Body, Caption, CTA)
- [ ] Style panel: brand colors (up to 10 swatches), palette generator, typography presets
- [ ] PromptCrafter: describe → AI enrich (3 variations) → customize mood/lighting/composition → generate
- [ ] Prompt enrichment via Gemini (gemini-2.5-flash) with Subject-Context-Style framework
- [ ] Image generation via Gemini with history and reuse
- [ ] Color system: react-colorful picker, eyedropper, palette generator, predefined palettes, global swatches
- [ ] Undo/redo (50+ steps), keyboard shortcuts, copy/paste, right-click context menu
- [ ] PDF export (client-side, 300/150/72 dpi, bleed/crop marks)
- [ ] InDesign export (ExtendScript .jsx generation)
- [ ] PNG/JPG raster export per page
- [ ] JSON save/load project files
- [ ] Template gallery with starter templates (Sale, Event, Restaurant, Real Estate, etc.)
- [ ] Auto-save to localStorage every 30 seconds

### Out of Scope

- Real-time collaboration — single-user app for now
- Cloud storage / user accounts — localStorage first, cloud is a future enhancement
- Mobile app — web-first, desktop viewport
- Video/animation in leaflets — static print only
- CMYK color management in-app — defer to InDesign for professional color work

## Context

- Built for a company whose designers already use InDesign daily
- Two usage paths: quick leaflets done entirely in-app, complex ones exported to InDesign for finishing
- PromptCrafter is the key differentiator — transforms basic descriptions into print-quality image prompts using brand context
- Gemini handles both prompt enrichment (gemini-2.5-flash) and image generation
- The app targets desktop browsers; panels collapse but no mobile-first design needed

## Constraints

- **Tech stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Zustand, Fabric.js, Framer Motion — per CLAUDE.md
- **API keys**: Server-side only via API routes, never exposed to client
- **Fabric.js**: Client-side only (dynamic import, ssr: false)
- **Measurements**: All editor measurements in mm, converted to pixels at 72dpi for screen
- **Bundle size**: Lazy load editor page, use Framer Motion sparingly (panels/modals only)
- **Accessibility**: All panels keyboard accessible
- **Server components**: Use where possible, client components only when needed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fabric.js for canvas | Mature library for 2D canvas manipulation with good object model | — Pending |
| Zustand over Redux | Simpler API, less boilerplate, good enough for this state shape | — Pending |
| localStorage over cloud DB | Ship faster, no auth needed, JSON export covers portability | — Pending |
| Gemini for both prompt enrichment and image gen | Single API provider, good quality for both text and image tasks | — Pending |
| Dark theme editor UI | Industry standard for design tools, reduces eye strain | — Pending |

---
*Last updated: 2026-03-27 after initialization*
