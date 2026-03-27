# Build: AI Leaflet Generation Feature

## What I need
Add an AI-powered generation feature to my existing Fabric.js 7 leaflet editor. Users should be able to generate an initial leaflet layout from 3 input modes, which then loads directly into the existing canvas editor.

## My existing stack
- Next.js 16 + React + TypeScript
- Fabric.js 7 canvas editor with toDatalessJSON serialization
- Zustand stores: canvasStore, projectStore, editorStore, brandStore
- Tailwind CSS 4 + Framer Motion
- localStorage + IndexedDB storage
- 5 element types with custom props: customType, shapeKind, id, name, locked, imageId, fitMode
- Export format: .dessy.json

## What to build

### AI Generation Modal
A new modal/dialog with 3 tabs:

1. **Prompt tab** — User types a text description of the leaflet they want (e.g. "tri-fold leaflet for a yoga studio, calm and minimal"). Includes a fold type picker (single page / bi-fold / tri-fold / z-fold).

2. **Photo tab** — User uploads a photo of an existing leaflet. The AI analyzes the layout structure, colors, typography style, and content zones, then generates a new editable version in our Fabric.js format. Not a copy — an abstracted recreation.

3. **Sketch tab** — User uploads a photo of a hand-drawn sketch. The AI interprets the rough drawing (boxes = content zones, scribbles = text areas, blobs = image placeholders) and generates a proper leaflet layout from it.

All three tabs should include:
- Fold type selector (single page, bi-fold 4 panels, tri-fold/z-fold 6 panels)
- Optional logo/brand asset upload
- Loading state during generation
- Preview of generated result before committing
- "Load into Editor" button that deserializes the AI output into the existing Fabric.js canvas using the exact same JSON schema and custom props the editor already uses
- "Regenerate" button

### AI Service Layer
- Support **both Claude API (Anthropic) and Google Gemini API** as providers
- Build a provider-agnostic abstraction so either can be used or swapped
- The AI must output valid Fabric.js canvas JSON matching our existing schema — including _isDocBackground rect, proper customType/shapeKind/id/name/locked props on every element, correct positioning for the chosen fold type and page dimensions
- For image and sketch modes, use the vision/multimodal capabilities of both providers
- Decide the best approach for API routing (server actions vs API routes vs client-side) based on what makes sense for the project — document your choice

### Panel-Aware Generation
The AI must understand fold types:
- **Single page**: 1 canvas (A4/Letter)
- **Bi-fold**: 4 panels (front, back, inside-left, inside-right) — generate as separate pages in projectStore
- **Tri-fold / Z-fold**: 6 panels — generate as separate pages, respecting panel width ratios and reading order

### Integration Rules
- DO NOT modify existing stores, canvas logic, or components — only extend
- Read the existing codebase first to understand the exact Fabric.js JSON structure, element types, page management in projectStore, and how canvases are loaded
- Match the existing code style, patterns, and conventions exactly
- Use the brandStore colors/typography if the user has brand presets saved
- Generate proper UUIDs for all element ids
- Style the modal consistently with the existing editor UI

### Prompt Engineering
Craft robust system prompts for the AI providers that:
- Explain our exact Fabric.js JSON schema with examples
- Enforce valid output that can be directly deserialized
- Handle fold-type-aware panel generation
- For photo mode: extract layout DNA without copying content
- For sketch mode: interpret rough drawings into structured layouts
- Include retry/validation logic if the AI returns malformed JSON
