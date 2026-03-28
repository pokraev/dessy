# Dessy - AI-Powered Leaflet Design Tool

A browser-based leaflet/brochure design tool with AI layout generation, built on Next.js 16 and Fabric.js 7.

## Features

### Canvas Editor
- Fabric.js 7 canvas with mm-based measurements, bleed/margin guides
- Element types: text frames, image frames, rectangles, triangles, circles, lines, color blocks
- Click-drag element creation (InDesign-style)
- Zoom, pan, snap-to-guide alignment
- Undo/redo (50+ steps), keyboard shortcuts, context menu
- Auto-save to localStorage, JSON export/import

### AI Layout Generation
- Generate leaflet layouts from text prompts, photos, or hand-drawn sketches
- Supports Claude (Anthropic) and Gemini (Google) as AI providers
- Fold types: Single page, Bi-fold (4 panels), 3-Panel (3 pages), Tri-fold (6 panels), Z-fold (6 panels)
- Style presets: Minimal, Bold, Elegant, Playful
- HEIC/HEIF image support (auto-converted to JPEG)
- Notebook/ruled paper line detection for sketch mode
- Image placeholder detection ("Img" labels in sketches)

### Editor Tools
- Selection, text, triangle, rectangle, circle, line, image frame, hand (pan)
- Distribute horizontally/vertically (3+ objects)
- Make same size (2+ objects)
- Convert shape to image frame (right-click context menu)
- Clear canvas with confirmation dialog

### Multi-Page Support
- Page navigation in bottom bar
- Per-page canvas state (sessionStorage)
- AI generation creates correct page count per fold type

## Getting Started

### Prerequisites
- Node.js 18+
- An API key for at least one AI provider

### Setup

```bash
npm install
```

Create `.env.local` with your AI provider key:

```env
# Use one or both providers
AI_PROVIDER=anthropic  # or "gemini"

ANTHROPIC_API_KEY=sk-ant-...
# GEMINI_API_KEY=AIza...
```

### Development

The dev server requires a raised file descriptor limit on macOS:

```bash
ulimit -n 10240 && npx next dev --turbopack -p 3002
```

Or use a production build (no file watchers):

```bash
npx next build && npx next start -p 3002
```

Open `http://localhost:3002/editor/my-project` to start designing.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| T | Text tool |
| G | Triangle tool |
| R | Rectangle tool |
| C | Circle tool |
| L | Line tool |
| I | Image frame tool |
| H | Hand (pan) tool |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| ? | Shortcuts overlay |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Canvas**: Fabric.js 7
- **State**: Zustand
- **AI**: Anthropic Claude / Google Gemini (server-side API routes)
- **Styling**: Tailwind CSS + inline styles (dark theme)
- **Image Processing**: heic2any (HEIC conversion)

## Project Structure

```
src/
  app/                    # Next.js App Router pages + API routes
    api/generate-leaflet/ # AI generation endpoint
    editor/[projectId]/   # Editor page
  components/editor/      # Editor UI components
    modals/               # AI generation modal + tabs
    panels/               # Toolbar, context menu, properties
    ui/                   # Header, bottom bar
  hooks/                  # Canvas, element creation, shortcuts
  lib/
    ai/                   # AI providers, prompts, schema validation
    fabric/               # Element factory, custom props
    image-utils.ts        # HEIC conversion, resize
  stores/                 # Zustand stores (canvas, project, editor)
  types/                  # TypeScript type definitions
```
