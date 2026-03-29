# Phase 5: Dashboard and Templates - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage projects from a dashboard and start from starter templates. The dashboard replaces the current WelcomeScreen as the app's landing page. Projects are displayed as visual cards with thumbnails. A "New Leaflet" modal provides both blank format selection and template gallery access.

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout
- Card grid layout (responsive) — visual, like Figma/Canva home
- Each card shows: canvas thumbnail, project name, format badge (A4/DL/etc.), relative time ("2 min ago"), page count, 3-dot menu on hover
- 3-dot menu actions: Rename, Duplicate, Delete
- Projects sorted by last-edited (updatedAt) by default
- Thumbnails generated as PNG snapshots on save, stored in IndexedDB

### Empty state
- Friendly illustration + "Create your first leaflet" CTA button
- Show template suggestions below the CTA

### Template gallery
- Category tabs: All, Sale, Event, Restaurant, Real Estate, Corporate, Fitness, Beauty, Education
- Click template opens preview modal with larger preview, name, category, format info, and "Use This Template" button
- 10 starter templates (minimum), ~1-2 per category
- Templates bundled as static JSON files in the app (serialized Fabric.js canvas state per TMPL-02)

### Navigation flow
- Dashboard is the app's home/landing page — WelcomeScreen is removed
- Simple state-based view switching via Zustand `currentView` (dashboard | editor) — no router library
- Clicking the "Dessy" logo in the editor header returns to dashboard (auto-saves first)

### New project creation
- "New Leaflet" button on dashboard opens a format picker modal
- Modal has two tabs: "Blank" (format cards: A4, A5, DL, Bifold, Trifold, Custom) and "Templates" (gallery)
- Format picker is format-only — creation modes (manual/AI/photo/sketch) remain accessible inside the editor header (already exists)

### Claude's Discretion
- Dashboard header design and branding
- Card hover effects and animations
- Template preview modal exact layout
- Illustration choice for empty state

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in decisions above and REQUIREMENTS.md.

### Requirements
- `.planning/REQUIREMENTS.md` §Dashboard (DASH-01 through DASH-04) — project grid, CRUD, template gallery
- `.planning/REQUIREMENTS.md` §Templates (TMPL-01, TMPL-02) — 10-20 templates, JSON storage format

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/storage/projectStorage.ts`: Full project CRUD already implemented (save, load, list, delete) with localStorage
- `src/lib/storage/imageDb.ts`: IndexedDB storage for images — can be extended for thumbnail storage
- `src/stores/projectStore.ts`: Project state management with Zustand
- `src/types/project.ts`: `ProjectMeta` (id, name, format, createdAt, updatedAt) and `Project` types
- `src/components/WelcomeScreen.tsx`: Current landing page — will be replaced by dashboard
- `src/components/ui/Toast.tsx`: Toast notification system for success/error feedback

### Established Patterns
- Dark theme: `#0a0a0a` background, `#1e1e1e` panels, `#2a2a2a` borders, `#6366f1` accent
- Inter font family throughout
- Zustand stores with `useXStore` naming convention
- Lucide React for icons
- react-i18next for all user-facing strings (en.json + bg.json)
- Inline styles used extensively (no Tailwind utility-first pattern in most components)

### Integration Points
- `src/App.tsx`: Currently renders editor directly — needs view switching logic (dashboard vs editor)
- `src/App.tsx` line 43: Uses URL params (`?id=` and `?format=`) for project loading — view switcher replaces this
- Editor header already has AI generation button — creation modes stay there
- Auto-save (`useAutoSave` hook) already persists projects — needs thumbnail capture hook

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-dashboard-and-templates*
*Context gathered: 2026-03-29*
