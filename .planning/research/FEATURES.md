# Feature Research

**Domain:** AI-powered leaflet/flyer design web app
**Researched:** 2026-03-27
**Confidence:** HIGH (core table stakes), MEDIUM (differentiators), HIGH (anti-features from competitor observation)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in any design tool. Missing these = product feels broken or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Drag-and-drop canvas editor | Every design tool from Canva to Figma trains users to expect this as baseline | MEDIUM | Fabric.js handles this; snap guides, resize handles, rotation required |
| Template gallery with categories | Non-designers won't start from blank; templates are the entry point | MEDIUM | Sale, Event, Restaurant, Real Estate etc. — 10-20 well-designed starters suffice for v1 |
| Text editing with font selection | Typography is core to leaflet design; without it the tool is unusable | MEDIUM | Google Fonts integration covers breadth; presets (Headline, Body, CTA) reduce friction |
| Image placement and scaling | Users need to bring their own photos/images | LOW | Fabric.js image object; upload + URL; resize and crop in-canvas |
| Undo/redo | Users make mistakes; no undo = rage quit | LOW | 50-step history stack is industry standard |
| PDF export | Print-readiness is the entire point of a leaflet tool | MEDIUM | Client-side PDF at 300 dpi with bleed and crop marks is the minimum; Canva even offers this |
| PNG/JPG export | Digital distribution alongside print | LOW | Per-page raster export at configurable DPI |
| Bleed and crop marks | Any print-focused tool must handle this; printers require it | MEDIUM | 3mm bleed standard; show/hide bleed zone, crop marks on PDF export |
| mm-based document dimensions | Print designers think in mm, not pixels | LOW | Conversion layer (mm → px at 72dpi screen, 300dpi export) |
| Layers panel | Users need to manage z-order and visibility; this is universal expectation | MEDIUM | Reorder, visibility toggle, lock; Fabric.js object stacking |
| Element selection, move, resize, rotate | Fundamental canvas manipulation | LOW | Fabric.js provides this out of the box |
| Color picker with hex/RGB input | Designers need precise color entry | LOW | react-colorful; hex, RGB, opacity |
| Save and reload work | Without persistence, nothing else matters | LOW | JSON to localStorage + auto-save every 30s is sufficient for v1 |
| Keyboard shortcuts | Copy, paste, delete, undo, zoom — all expected by any design-aware user | LOW | Standard set: Ctrl+Z, Ctrl+C/V, Delete, Ctrl++/- |
| Zoom and pan | Large documents require navigation | LOW | Fabric.js viewport transform |

### Differentiators (Competitive Advantage)

Features that set this product apart. These align directly with the stated core value: speed from blank to print-ready via AI.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| PromptCrafter — AI prompt enrichment | Transforms "product photo of a shoe" into a rich, print-quality image prompt using Subject-Context-Style framework; removes the skill gap between user intention and AI output quality | HIGH | Gemini 2.5-flash for enrichment; 3 variation output; mood/lighting/composition controls; this is the primary differentiator |
| AI image generation in-canvas | Eliminates stock photo hunting; generated images are contextually matched to the leaflet's brand and content | HIGH | Gemini image generation with generation history; re-use across designs; placement directly onto canvas frame |
| Brand color swatches with palette generator | Users maintain brand consistency without leaving the tool; palette generation from a single seed color accelerates setup | MEDIUM | Up to 10 brand swatches; global apply; palette generator using color theory (complementary, triadic, etc.) |
| InDesign export via ExtendScript | Unique in the web-based tool space — enables hybrid workflow where quick designs go straight to print, complex ones get finished in InDesign by professionals | HIGH | ExtendScript .jsx generation that recreates layout in InDesign; text frames, image frames, colors; no competitor does this |
| Print document types: bifold/trifold with fold guides | Most web tools ignore folded leaflet formats entirely; fold line visualization is missing from Canva and Adobe Express | MEDIUM | Fold line overlays on canvas; correct panel dimensions for trifold (equal thirds); fold-aware margin guides |
| Typography presets (Headline/Subhead/Body/Caption/CTA) | Non-designers struggle with font pairing and hierarchy; named presets encode good typographic decisions | LOW | 5 presets per brand style; saves to project; applies in one click |
| Multi-page document with page navigator | Bifold/trifold leaflets are inherently multi-page; most simple tools force separate files per side | MEDIUM | Page thumbnails sidebar; add/remove/reorder pages; shared brand state across pages |
| Right-click context menu | Power-user efficiency feature missing from most simple tools | LOW | Bring to front, send to back, duplicate, delete, group/ungroup |
| Snap guides and smart alignment | Speeds layout without requiring design training | MEDIUM | Center snap, edge snap, equidistant snap; toggleable |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like good ideas but create problems given the stated constraints and target audience.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time collaboration | Teams want to co-edit | Requires WebSocket infrastructure, conflict resolution, auth/session management, and operational transforms — this is a full product in itself; PROJECT.md explicitly calls this out of scope | Single-user with JSON export/share; hand off via InDesign export for team finishing |
| CMYK color management in-app | Professional print requires CMYK for accurate color | Accurate CMYK simulation requires ICC profiles, color engine (like LittleCMS), and complex rendering — out of reach for a canvas tool; incorrect CMYK simulation is worse than no CMYK | PDF exports handled by printer's RIP; complex work goes to InDesign where CMYK is native |
| Built-in stock photo library | Users want images without leaving the tool | Licensing costs, API rate limits, and storage requirements make this a significant ongoing cost; it shifts focus from AI generation (the differentiator) to competing with Shutterstock | AI image generation via PromptCrafter; users can upload their own photos |
| Animation / video export | Digital flyers could be animated | Completely outside the print-first mandate; adds significant complexity to the canvas model (timeline, keyframes); Fabric.js is not optimized for animation rendering | Static print is the goal; digital sharing uses PNG/PDF |
| Mobile-first / native mobile app | Designers want to work on iPad | Design tools with complex canvas interactions are unusable on mobile without purpose-built touch UX; resource cost is enormous | Desktop web only; panels collapse for smaller screens, but no mobile-first layout needed |
| AI-generated full layout from prompt | "Make me a leaflet about X" in one click | Fully generated layouts currently produce inconsistent results for print-quality work; users lose control and spend more time fixing than they would starting from a template | PromptCrafter for image generation + templates for layout; AI assists, human directs |
| User accounts and cloud storage | Users want access from any device | Requires auth system, backend storage, billing — all heavy infrastructure for a tool that should ship fast | localStorage + JSON file export/import; cloud storage is a future v2 feature |
| Vast template library (500+) | More templates = more value perception | Template quality beats template quantity; 500 mediocre templates are worse than 20 excellent ones; maintenance burden grows with library size | 20-30 high-quality, print-tested templates in key categories |
| Font upload / custom fonts | Brand-specific fonts not on Google Fonts | Font licensing for web embedding is complex; many commercial fonts have restrictive web licenses | Google Fonts covers most use cases; InDesign export allows professional fonts to be applied in InDesign where licenses permit |

---

## Feature Dependencies

```
Template Gallery
    └──requires──> Canvas Editor (render templates onto canvas)
                       └──requires──> Element Types (text, image, shape, group)
                                          └──requires──> Properties Panel (edit elements)

PromptCrafter (AI image generation)
    └──requires──> Gemini API route (server-side, no client key exposure)
    └──requires──> Image Frame element type (place generated image on canvas)
    └──requires──> Brand Color Swatches (provide color context to prompt enricher)

InDesign Export
    └──requires──> Canvas Editor (elements to export)
    └──requires──> mm-based document model (InDesign is mm-native)
    └──requires──> Multi-page support (export all pages)

PDF Export
    └──requires──> Canvas Editor
    └──requires──> Bleed/Margin guides (export includes bleed area)
    └──requires──> mm-based document model (correct physical dimensions)

Multi-page Document
    └──requires──> Page Navigator (UI to switch pages)
    └──requires──> Canvas Editor (per-page canvas state)

Brand Color Swatches ──enhances──> Typography Presets (brand uses specific font/color combos)
Brand Color Swatches ──enhances──> PromptCrafter (color context in prompt enrichment)
Typography Presets ──enhances──> Template Gallery (templates reference preset styles)

Layers Panel ──enhances──> Canvas Editor (visibility, lock, reorder)
Undo/Redo ──enhances──> all editing operations

Fold Guides (bifold/trifold) ──requires──> Multi-page support
Fold Guides ──requires──> mm-based document model

Auto-save ──requires──> JSON save/load (save serialized canvas state)

Snap Guides ──enhances──> Canvas Editor (alignment during drag)
```

### Dependency Notes

- **InDesign Export requires mm-based document model:** InDesign's coordinate system is point/mm based; pixel-only documents produce wrong physical dimensions in the .jsx output.
- **PromptCrafter requires Brand Color Swatches:** The enrichment prompt needs brand color context to generate on-brand imagery; without swatches, generated images may clash with the design.
- **Multi-page support is a prerequisite for bifold/trifold fold guides:** Fold formats inherently have a front/inside/back structure that requires page objects.
- **PDF export with bleed requires the bleed zone to be visible during editing:** Users must see what will be cut to design correctly; bleed guides at edit time prevent export surprises.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to prove the core value proposition (fast, AI-assisted, print-ready leaflets).

- [ ] Canvas editor with drag-and-drop, resize, rotate, snap — without this nothing works
- [ ] Text frames with Google Fonts and typography presets — leaflets are primarily text
- [ ] Image frames with upload + placement — users bring brand imagery
- [ ] Shapes and color blocks — basic layout composition
- [ ] Brand color swatches (up to 10) — brand consistency without a full brand kit system
- [ ] PromptCrafter with Gemini prompt enrichment and image generation — the primary differentiator; validates the AI hypothesis
- [ ] PDF export at 300dpi with bleed and crop marks — validates the print-ready claim
- [ ] PNG/JPG raster export — covers digital distribution
- [ ] mm-based document with bleed/margin guides — credibility with professional users
- [ ] Multi-page document with page navigator — enables bifold/trifold use cases
- [ ] Fold line guides for bifold/trifold formats — differentiator vs. Canva
- [ ] Template gallery with 10-20 starters — removes blank page anxiety
- [ ] Layers panel with reorder/visibility/lock — expected by any design-aware user
- [ ] Properties panel (position, size, rotation, opacity, fill, border) — precision editing
- [ ] Undo/redo (50 steps) — prevents rage quit
- [ ] Auto-save to localStorage every 30s — data safety without cloud
- [ ] JSON project save/load — portability without accounts
- [ ] Keyboard shortcuts (standard set) — efficiency for repeat users

### Add After Validation (v1.x)

Features to add once core workflow is confirmed working.

- [ ] InDesign export (.jsx ExtendScript) — add when hybrid workflow is validated with actual InDesign users; technically complex, high value if the target audience is confirmed
- [ ] Palette generator from seed color — add when brand color setup is identified as a friction point
- [ ] Generation history and image reuse — add when users are observed regenerating the same images repeatedly
- [ ] Right-click context menu — add when keyboard shortcut power users are confirmed to exist
- [ ] Eyedropper color picker — add after base color picker is stable
- [ ] Shadow and advanced element styling — add when users request polish beyond basic styling

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Cloud storage and user accounts — requires auth infrastructure; defer until localStorage limits become real user complaints
- [ ] Real-time collaboration — multi-user is a distinct product problem; defer entirely
- [ ] Expanded template library (50+) — add templates in response to observed use case patterns, not speculatively
- [ ] Font upload — complex licensing; defer until Google Fonts coverage is confirmed insufficient
- [ ] CMYK support — professional color workflows belong in InDesign; consider only if print partners require it

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Canvas editor (drag, resize, rotate, snap) | HIGH | MEDIUM | P1 |
| PromptCrafter + AI image generation | HIGH | HIGH | P1 |
| PDF export (300dpi, bleed, crop marks) | HIGH | MEDIUM | P1 |
| Text frames + Google Fonts + typography presets | HIGH | MEDIUM | P1 |
| Template gallery (10-20 templates) | HIGH | MEDIUM | P1 |
| mm-based document with bleed/margin guides | HIGH | LOW | P1 |
| Multi-page + fold guides | HIGH | MEDIUM | P1 |
| Brand color swatches | HIGH | LOW | P1 |
| Layers panel | HIGH | MEDIUM | P1 |
| Properties panel | HIGH | MEDIUM | P1 |
| Undo/redo | HIGH | LOW | P1 |
| Auto-save to localStorage | HIGH | LOW | P1 |
| JSON project save/load | HIGH | LOW | P1 |
| PNG/JPG raster export | MEDIUM | LOW | P1 |
| Image frames + upload | HIGH | LOW | P1 |
| InDesign export (.jsx) | HIGH (for target audience) | HIGH | P2 |
| Palette generator | MEDIUM | MEDIUM | P2 |
| Generation history and reuse | MEDIUM | MEDIUM | P2 |
| Eyedropper color picker | MEDIUM | LOW | P2 |
| Right-click context menu | MEDIUM | LOW | P2 |
| Shadow and advanced styling | LOW | LOW | P2 |
| Cloud storage + accounts | HIGH (eventually) | HIGH | P3 |
| Real-time collaboration | MEDIUM | VERY HIGH | P3 |
| Expanded template library (50+) | MEDIUM | MEDIUM | P3 |
| Font upload | LOW | HIGH | P3 |
| CMYK color management | LOW (v1 audience) | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Canva | Adobe Express | Kittl | Our Approach |
|---------|-------|---------------|-------|--------------|
| Drag-and-drop canvas | Yes | Yes | Yes | Fabric.js — same baseline |
| Template library | 250,000+ | Large | Moderate | 20-30 high-quality print-tested starters |
| AI image generation | Magic Media (DALL-E/Firefly) | Firefly generative fill | No (as of 2025) | Gemini via PromptCrafter — with prompt enrichment as differentiator |
| AI prompt crafting / enrichment | No | No | No | YES — Subject-Context-Style framework, 3 variations, mood controls |
| Brand kit (colors, fonts) | Yes (Pro plan) | Yes | Yes | Brand swatches + typography presets (free, no paywalled) |
| PDF export with bleed + crop marks | Yes (Pro) | Yes | Limited | Yes — first-class, 300/150/72dpi, no paywall |
| InDesign export | No | No (Adobe apps only) | No | YES — unique via ExtendScript .jsx generation |
| Bifold/trifold fold guides | No | No | No | YES — differentiator |
| mm-based document model | Limited (pixel-first) | Partial | No | YES — print-first |
| Multi-page documents | Yes | Yes | Limited | Yes |
| Layers panel | Limited | Limited | Yes | Full layers with visibility, lock, reorder |
| Undo/redo | Yes | Yes | Yes | 50-step history |
| CMYK support | No | Partial | No | Explicitly deferred to InDesign |
| Cloud storage | Yes | Yes | Yes | localStorage v1; cloud is v2 |
| Real-time collaboration | Yes (Pro) | Yes | No | Explicitly out of scope v1 |
| Mobile app | Yes | Yes | No | Desktop web only |

---

## Sources

- [Top 10 AI Poster & Flyer Design Tools in 2026](https://www.devopsschool.com/blog/top-10-ai-poster-flyer-design-tools-in-2025-features-pros-cons-comparison/)
- [9 Best Flyer Design Software in 2026 — Venngage](https://venngage.com/blog/best-flyer-design-software/)
- [10 Best Flyer Design Software Tools in 2026 — Design Shifu](https://designshifu.com/best-software-to-make-flyers/)
- [Adobe Express vs Canva 2026 — Style Factory](https://www.stylefactoryproductions.com/blog/adobe-express-vs-canva)
- [Kittl vs Canva 2026 — Style Factory](https://www.stylefactoryproductions.com/blog/kittl-vs-canva)
- [Canva Free Online Flyer Maker](https://www.canva.com/create/flyers/)
- [Canva Brand Kit documentation](https://www.canva.com/help/brand-kit/)
- [6 Best AI-Powered Flyer Maker Tools for 2026 — PosterMyWall](https://www.postermywall.com/blog/2025/12/24/6-best-ai-powered-flyer-maker-tools-for-2026/)
- [Common Print Design Pitfalls — OneClearchoice](https://www.oneclearchoice.com/post/common-print-design-pitfalls-and-how-to-avoid-them)
- [Print Layout Pitfalls and Best Practices — Lueur Externe](https://blog.lueurexterne.com/en/blog/print-layout-common-pitfalls-and-best-practices-for-professional-printing/)
- [InDesign ExtendScript API — indesignjs.de](https://www.indesignjs.de/extendscriptAPI/indesign-latest/)
- [Embed, Edit & Automate InDesign Files in the Browser 2025 — img.ly](https://img.ly/blog/embed-edit-automate-indesign-files-in-the-browser-complete-guide-2025/)
- [AI Image Generation Guide for Designers 2026 — Kittl Blog](https://www.kittl.com/blogs/ai-image-generation-guide-ais/)

---
*Feature research for: AI-powered leaflet design web app (Leaflet Factory)*
*Researched: 2026-03-27*
