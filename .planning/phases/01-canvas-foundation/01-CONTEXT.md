# Phase 1: Canvas Foundation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Working Fabric.js canvas in Next.js with all element types (text, image, shape, color block, group), mm-based document with bleed/margin guides, persistence (localStorage auto-save + IndexedDB for images + JSON export/import), undo/redo (50 steps), keyboard shortcuts, and dark-themed app shell (header, bottom bar, collapsible panels). Multi-page navigation UI is in scope but full multi-page panel is Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Element Creation Flow
- Text frames: click-drag to define frame size (InDesign-style), then type inside the fixed-width frame
- Shapes (rect, circle, line): click-drag to define size from corner to corner
- Image frames: both paths — can draw empty placeholder frame (X pattern or gray) OR drag-drop files directly onto canvas
- Default appearance: brand-aware — use first brand color for shape fills, brand font for text if set; fall back to sensible defaults if no brand defined yet

### Canvas Work Surface
- Pasteboard (area outside document): subtle checkerboard pattern (transparency-style)
- Document boundary: drop shadow on white page PLUS semi-transparent red-tinted overlay showing the 3mm bleed zone
- Margin guides: Claude's discretion on color (cyan or magenta are both fine)
- Grid overlay: Claude's discretion on style (dots vs lines)
- Rulers: yes, mm-based rulers along top and left edge that scroll with the canvas (InDesign/Illustrator-style)
- Default page background: white (#FFFFFF), changeable per page via Style panel (Phase 2)

### Snap & Guide Behavior
- All snap targets active: element edges & centers, page center & edges, equal spacing (Figma-style smart guides), margin & bleed guides
- Snap threshold: Claude's discretion (industry standard ~5-8px is fine)
- Guide line color: Claude's discretion (magenta is industry standard)

### Undo Granularity
- Drag operations: Claude's discretion (standard is one step per mousedown→mouseup)
- Property panel changes: debounced at 300ms — rapid slider/input changes group into one undo step
- Text editing: Claude's discretion (word-level grouping is standard)
- History stored as `toDatalessJSON()` snapshots (from research pitfalls — never store base64 in history)

### Claude's Discretion
- Grid overlay style (dots vs lines)
- Margin guide color
- Snap threshold distance
- Snap guide line color
- Drag undo granularity (one step per drag vs debounced)
- Text editing undo granularity (word-level vs pause-based)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specification
- `CLAUDE.md` — Full app specification including tech stack, editor layout, canvas behaviors, element types, keyboard shortcuts, design system colors/typography/spacing, API routes, Zustand state shape, and build phase instructions

### Research
- `.planning/research/STACK.md` — Verified library versions: Fabric.js 7.x, `@google/genai` 1.46+, jsPDF v4, Zustand 5, zundo for undo, Tailwind CSS 4 dark mode via `@custom-variant`
- `.planning/research/ARCHITECTURE.md` — Canvas-as-imperative-island pattern, Zustand/Fabric.js sync contract, SSR boundary, export pipeline architecture
- `.planning/research/PITFALLS.md` — Multi-page memory leak prevention, undo/redo memory management, `toDatalessJSON()` requirement, SSR gotchas, CORS image loading

### Requirements
- `.planning/REQUIREMENTS.md` — Phase 1 requirements: CANV-01 through CANV-10, ELEM-01 through ELEM-05, PERS-01 through PERS-03, EXPO-03, UXSH-01 through UXSH-06

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the foundational patterns

### Integration Points
- Next.js App Router: `/` (dashboard, Phase 4) and `/editor/[id]` (editor, this phase)
- Zustand store: `ProjectState` interface defined in CLAUDE.md — implement during this phase
- Fabric.js: client-side only via `dynamic({ ssr: false })` in a `'use client'` component

</code_context>

<specifics>
## Specific Ideas

- Element creation is InDesign-style: always click-drag to define size (not click-to-place like Figma)
- Bleed visualization uses red-tinted overlay — clear visual distinction between safe area and bleed
- Rulers are mandatory — designers expect them for precision work
- Brand-aware defaults: new elements inherit brand colors/fonts when available

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-canvas-foundation*
*Context gathered: 2026-03-27*
