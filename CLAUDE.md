# Dessy - Vite + React + Fabric.js 7

## Critical Conventions

- **Serialization:** Always use `canvas.toObject([...CUSTOM_PROPS])` — never `toJSON` or `toDatalessJSON`
- **Deserialization:** Always use `loadCanvasJSON(canvas, json)` from `src/lib/fabric/load-canvas-json.ts` — never raw `canvas.loadFromJSON`
- **Fabric.js 7:** `obj.type` returns lowercase (`'group'`, `'rect'`, `'image'`). All objects need `originX: 'left', originY: 'top'`
- **Clone:** Always pass `[...CUSTOM_PROPS]` to `obj.clone()` and assign new `id: crypto.randomUUID()`
- **Styling:** Tailwind CSS 4 with `@theme` in `src/globals.css`. No inline `style={{}}` in new code
- **Dev server:** Port 3002. Always restart after changes (`npm run dev`)
- **i18n:** All UI strings via `react-i18next`. Both `en.json` and `bg.json` must have matching keys
