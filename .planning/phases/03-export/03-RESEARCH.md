# Phase 3: Export - Research

**Researched:** 2026-03-29
**Domain:** Canvas export (raster, InDesign ExtendScript, CorelDraw VBA/SVG)
**Confidence:** HIGH for raster, MEDIUM-HIGH for InDesign, MEDIUM for CorelDraw

## Summary

This phase implements three export paths from the Fabric.js v7 canvas editor: PNG/JPEG raster export, InDesign ExtendScript (.jsx) generation, and CorelDraw export. Raster export is straightforward using Fabric.js's built-in `toDataURL`/`toCanvasElement` with a multiplier for print-quality resolution. InDesign export requires generating an ExtendScript (.jsx) file that programmatically recreates the layout using InDesign's DOM API. CorelDraw export has two viable paths: SVG intermediary (simpler, good fidelity) or VBA macro generation (richer, but more complex).

The project already uses `canvas.toDataURL()` for page thumbnails in PagesPanel.tsx, and `canvas.toDatalessJSON()` for serialization. The key challenge is multi-page export: each page's canvas JSON is stored separately in sessionStorage keyed by `dessy-generated-page-{projectId}-{pageIndex}`. Export must iterate all pages, load each page's JSON, and generate output for each.

**Primary recommendation:** Use Fabric.js `toCanvasElement` + Blob conversion for raster export, generate standalone ExtendScript .jsx for InDesign, and generate SVG via `canvas.toSVG()` for CorelDraw with an optional VBA macro wrapper.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EXPO-01 | User can export pages as PNG or JPG | Fabric.js toDataURL/toCanvasElement with multiplier; Blob conversion for large files |
| EXPO-02 | User can export InDesign ExtendScript (.jsx) that recreates the layout | ExtendScript DOM API: textFrames.add(), rectangles.add(), colors.add(), geometricBounds |
| EXPO-04 | InDesign export maps text frames, image frames, shapes, and colors to InDesign equivalents | Object-by-object mapping from Fabric.js customType to InDesign API calls |
</phase_requirements>

## Standard Stack

### Core

No new libraries needed for the core export functionality. Everything is built on Fabric.js APIs and pure string generation.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fabric | ^7.2.0 | Already installed; provides toDataURL, toCanvasElement, toSVG | Core canvas library |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| file-saver | ^2.0.5 | Cross-browser file download with Blob support | Use for all file downloads to avoid data URI size limits |
| jszip | ^3.10.1 | Bundle multiple page exports into a single .zip | Use when exporting multi-page documents (all pages as PNG/JPG) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| file-saver | Manual anchor + createObjectURL | file-saver handles edge cases (Safari, IE); manual works for Chrome |
| jszip | Individual file downloads | Poor UX for multi-page; zip is cleaner |
| SVG for CorelDraw | VBA-only macro | SVG is simpler and CorelDraw imports it well; VBA gives richer control |

**Installation:**
```bash
npm install file-saver jszip
npm install -D @types/file-saver
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    export/
      raster-export.ts       # PNG/JPEG export logic
      indesign-export.ts     # ExtendScript .jsx generation
      coreldraw-export.ts    # SVG + optional VBA macro generation
      export-utils.ts        # Shared helpers (page iteration, unit conversion, color mapping)
  components/
    editor/
      modals/
        ExportModal.tsx       # Export UI with format picker, quality options
```

### Pattern 1: Page Iterator for Multi-Page Export

**What:** A shared utility that loads each page's canvas JSON, renders it to a temporary canvas, and yields the canvas for each export format to process.

**When to use:** Every export format needs to iterate all pages.

**Example:**
```typescript
// Source: Project codebase analysis — EditorCanvasInner.tsx lines 201-237
import { Canvas } from 'fabric';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';

interface PageCanvasData {
  pageIndex: number;
  canvasJSON: object;
  pageId: string;
  background: string;
}

/**
 * Collect all page canvas JSONs from sessionStorage + current canvas.
 * The current page is on the live canvas; other pages are in sessionStorage.
 */
export function collectAllPageData(
  canvas: Canvas,
  projectId: string,
  pages: Array<{ id: string; background: string }>
): PageCanvasData[] {
  const currentIdx = /* from projectStore */ 0;
  const result: PageCanvasData[] = [];

  for (let i = 0; i < pages.length; i++) {
    if (i === currentIdx) {
      result.push({
        pageIndex: i,
        canvasJSON: canvas.toDatalessJSON([...CUSTOM_PROPS]),
        pageId: pages[i].id,
        background: pages[i].background,
      });
    } else {
      const stored = sessionStorage.getItem(
        `dessy-generated-page-${projectId}-${i}`
      );
      result.push({
        pageIndex: i,
        canvasJSON: stored ? JSON.parse(stored) : { objects: [] },
        pageId: pages[i].id,
        background: pages[i].background,
      });
    }
  }
  return result;
}
```

### Pattern 2: Offscreen Canvas for Raster Export

**What:** Create a temporary Fabric.js Canvas, load page JSON, render at high multiplier, extract Blob.

**When to use:** Raster export (PNG/JPEG) at print resolution.

**Example:**
```typescript
// Approach: use toCanvasElement for multiplied render, then toBlob for download
async function exportPageAsBlob(
  canvasJSON: object,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
  multiplier: number
): Promise<Blob> {
  const tempCanvasEl = document.createElement('canvas');
  const tempCanvas = new Canvas(tempCanvasEl, { width, height });
  await tempCanvas.loadFromJSON(canvasJSON);
  tempCanvas.renderAll();

  const exportCanvas = tempCanvas.toCanvasElement(multiplier, {
    left: 0, top: 0, width, height,
  });

  return new Promise((resolve, reject) => {
    exportCanvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      `image/${format}`,
      format === 'jpeg' ? 0.95 : undefined
    );
  });
}
```

### Pattern 3: String Template for ExtendScript Generation

**What:** Build ExtendScript .jsx as a string by iterating canvas objects and emitting InDesign API calls.

**When to use:** InDesign export.

**Why string templates:** ExtendScript is ES3-era JavaScript. No modules, no modern syntax. The .jsx file must be self-contained.

### Anti-Patterns to Avoid
- **Using data URIs for large files:** Chrome caps data URIs at ~2MB in anchor href. Always convert to Blob + createObjectURL.
- **Rendering export on the live canvas:** Never modify the user's active canvas for export. Always use an offscreen/temporary canvas.
- **Hardcoding DPI in export:** Use the project's measurement system. Canvas is at 72 DPI screen; for 300 DPI print, multiplier = 300/72 = 4.17.
- **Synchronous page iteration:** Loading page JSON and rendering is async. Use async/await properly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File download | Manual anchor element creation | file-saver's saveAs() | Handles Safari, blob size limits, filename sanitization |
| ZIP packaging | Manual ZIP binary format | jszip | ZIP format is complex; jszip is 100KB gzipped and battle-tested |
| SVG generation | Custom SVG string building | Fabric.js canvas.toSVG() | Fabric.js handles all object type serialization, transforms, gradients |
| Color conversion (hex to RGB array) | String parsing | Simple utility function | But do write this yourself; it's 3 lines, no library needed |

**Key insight:** The export formats themselves (ExtendScript, VBA) must be hand-built as string templates because there are no client-side libraries for generating them. But file I/O and SVG generation should use existing tools.

## Common Pitfalls

### Pitfall 1: Data URI Size Limit in Chrome
**What goes wrong:** `canvas.toDataURL()` with high multiplier produces a base64 string exceeding 2MB. Creating an anchor with this as href silently fails or produces a "network error" on download.
**Why it happens:** Chrome enforces a ~2MB limit on data URIs in anchor href attributes.
**How to avoid:** Always use `toCanvasElement()` + `HTMLCanvasElement.toBlob()` + `URL.createObjectURL()` instead of `toDataURL()` for export.
**Warning signs:** Export works for small canvases but fails silently for complex ones.

### Pitfall 2: AligningGuidelines Plugin Crash During Export
**What goes wrong:** The `fabric-guideline-plugin` hooks into `before:render` and tries to access an overlay context that doesn't exist on temporary canvases.
**Why it happens:** The plugin assumes a full DOM-attached canvas with overlay layers.
**How to avoid:** Temporarily remove `before:render` listeners before calling toDataURL/toCanvasElement, restore after. The project already does this in PagesPanel.tsx (lines 237-251).
**Warning signs:** Uncaught TypeError during export referencing overlay context.

### Pitfall 3: InDesign geometricBounds Coordinate Order
**What goes wrong:** Setting geometricBounds with [x1, y1, x2, y2] (standard) instead of [y1, x1, y2, x2] (InDesign's format).
**Why it happens:** InDesign uses [top, left, bottom, right] which is y-first, contrary to most coordinate systems.
**How to avoid:** Always use the format `[top, left, bottom, right]` for geometricBounds. Document this prominently in code comments.
**Warning signs:** Elements appear in wrong positions or are rotated 90 degrees.

### Pitfall 4: InDesign Measurement Units
**What goes wrong:** geometricBounds values interpreted in points instead of millimeters.
**Why it happens:** InDesign defaults to whatever the user's preference is set to.
**How to avoid:** Set `app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;` at the top of every generated ExtendScript.
**Warning signs:** Layout appears at wrong scale in InDesign.

### Pitfall 5: Multi-Page Canvas Data Not Available
**What goes wrong:** Trying to export pages that haven't been visited yet — their canvas JSON doesn't exist in sessionStorage.
**Why it happens:** Pages are only saved to sessionStorage when switching away from them.
**How to avoid:** Before export, save the current page to sessionStorage first. Handle missing page data gracefully (empty page).
**Warning signs:** Some pages export as blank.

### Pitfall 6: Fabric.js originX/originY Differences in v7
**What goes wrong:** Fabric.js 7 changed default origin to 'center' instead of 'left'/'top'. Coordinate calculations for InDesign/CorelDraw export may be wrong.
**Why it happens:** This project forces `originX: 'left', originY: 'top'` on all elements (see element-factory.ts), but imported/generated elements might not have this set.
**How to avoid:** When reading object coordinates for export, always account for originX/originY. Use `obj.getBoundingRect()` for absolute coordinates.
**Warning signs:** Elements shifted by half their width/height in exported layouts.

### Pitfall 7: Font Mapping Between Systems
**What goes wrong:** Google Fonts used in the canvas are not available in InDesign/CorelDraw.
**Why it happens:** Different font ecosystems. Google Fonts are web fonts; InDesign uses system/Adobe fonts.
**How to avoid:** Include a font mapping comment in generated scripts. Use common font family names where possible. Document that the user may need to substitute fonts.
**Warning signs:** "Missing font" dialogs when running ExtendScript in InDesign.

## Code Examples

### Raster Export (PNG/JPEG) with Blob

```typescript
// Source: Fabric.js GitHub issues #4906, #1970, and project PagesPanel.tsx
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

const DPI_MULTIPLIERS = {
  72: 1,      // Screen
  150: 150 / 72,  // Low-res print (~2.08)
  300: 300 / 72,  // High-res print (~4.17)
};

async function exportRasterPages(
  pages: PageCanvasData[],
  docWidth: number,   // px at 72 DPI (from formats.ts)
  docHeight: number,  // px at 72 DPI
  format: 'png' | 'jpeg',
  dpi: 300 | 150 | 72 = 300
): Promise<void> {
  const multiplier = DPI_MULTIPLIERS[dpi];
  const zip = new JSZip();

  for (const page of pages) {
    const blob = await exportPageAsBlob(
      page.canvasJSON, docWidth, docHeight, format, multiplier
    );
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    zip.file(`page-${page.pageIndex + 1}.${ext}`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `export-${Date.now()}.zip`);
}
```

### InDesign ExtendScript Generation

```typescript
// Source: InDesign ExtendScript API — indesignjs.de/extendscriptAPI/indesign-latest/
// Source: ExtendScript wiki — github.com/ExtendScript/wiki/wiki/Colors-And-Swatches

function generateInDesignScript(
  pages: PageCanvasData[],
  meta: { name: string; format: string },
  docWidthMm: number,
  docHeightMm: number
): string {
  const lines: string[] = [];

  // Header
  lines.push('// Generated by Dessy Leaflet Factory');
  lines.push('// Date: ' + new Date().toISOString());
  lines.push('// NOTE: Fonts used in this layout may need to be installed or substituted.');
  lines.push('');

  // Set measurement units to mm
  lines.push('app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;');
  lines.push('');

  // Create document
  lines.push('var doc = app.documents.add();');
  lines.push('doc.documentPreferences.properties = {');
  lines.push(`  pageWidth: "${docWidthMm}mm",`);
  lines.push(`  pageHeight: "${docHeightMm}mm",`);
  lines.push('  facingPages: false');
  lines.push('};');
  lines.push('');

  // Add color swatches
  lines.push('// --- Color Swatches ---');
  lines.push('function addColor(name, r, g, b) {');
  lines.push('  try { return doc.colors.item(name); }');
  lines.push('  catch(e) {');
  lines.push('    var c = doc.colors.add();');
  lines.push('    c.properties = {');
  lines.push('      name: name,');
  lines.push('      model: ColorModel.PROCESS,');
  lines.push('      space: ColorSpace.RGB,');
  lines.push('      colorValue: [r, g, b]');
  lines.push('    };');
  lines.push('    return c;');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  // Process each page
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      lines.push(`doc.pages.add();`);
    }
    lines.push(`var page${i} = doc.pages[${i}];`);
    lines.push('');

    // Process objects on this page
    const objects = (pages[i].canvasJSON as { objects?: unknown[] }).objects || [];
    for (const obj of objects) {
      lines.push(...generateObjectScript(obj, i));
    }
  }

  lines.push('');
  lines.push('alert("Layout imported successfully! Please check fonts and image placeholders.");');

  return lines.join('\n');
}
```

### Object-to-InDesign Mapping

```typescript
// Mapping Fabric.js objects to InDesign ExtendScript API calls

function generateObjectScript(obj: any, pageIdx: number): string[] {
  const lines: string[] = [];

  // Convert px (72 DPI) to mm
  const leftMm = pxToMm(obj.left || 0);
  const topMm = pxToMm(obj.top || 0);
  const widthMm = pxToMm((obj.width || 0) * (obj.scaleX || 1));
  const heightMm = pxToMm((obj.height || 0) * (obj.scaleY || 1));

  // geometricBounds = [top, left, bottom, right] in mm
  const bounds = `[${topMm}, ${leftMm}, ${topMm + heightMm}, ${leftMm + widthMm}]`;

  switch (obj.customType) {
    case 'text': {
      const varName = `tf_${pageIdx}_${Math.random().toString(36).slice(2, 8)}`;
      lines.push(`var ${varName} = page${pageIdx}.textFrames.add();`);
      lines.push(`${varName}.geometricBounds = ${bounds};`);
      lines.push(`${varName}.contents = ${JSON.stringify(obj.text || '')};`);
      // Font properties
      lines.push(`${varName}.parentStory.texts[0].properties = {`);
      lines.push(`  appliedFont: "${obj.fontFamily || 'Arial'}",`);
      lines.push(`  pointSize: ${obj.fontSize || 12},`);
      if (obj.fill && obj.fill !== '#000000') {
        const [r, g, b] = hexToRgb(obj.fill);
        const colorName = `color_${obj.fill.replace('#', '')}`;
        lines.push(`  fillColor: addColor("${colorName}", ${r}, ${g}, ${b}),`);
      }
      lines.push(`  justification: Justification.${mapTextAlign(obj.textAlign || 'left')}`);
      lines.push('};');
      break;
    }

    case 'image': {
      // Create an empty graphic frame as placeholder
      const varName = `img_${pageIdx}_${Math.random().toString(36).slice(2, 8)}`;
      lines.push(`var ${varName} = page${pageIdx}.rectangles.add({`);
      lines.push(`  geometricBounds: ${bounds},`);
      lines.push(`  contentType: ContentType.GRAPHIC_TYPE`);
      lines.push('});');
      lines.push(`// TODO: Place image file — ${varName}.place(File("path/to/image.jpg"));`);
      break;
    }

    case 'shape': {
      if (obj.shapeKind === 'rect' || obj.shapeKind === 'triangle') {
        const varName = `rect_${pageIdx}_${Math.random().toString(36).slice(2, 8)}`;
        lines.push(`var ${varName} = page${pageIdx}.rectangles.add({`);
        lines.push(`  geometricBounds: ${bounds}`);
        lines.push('});');
        if (obj.fill && obj.fill !== 'transparent') {
          const [r, g, b] = hexToRgb(obj.fill);
          const colorName = `color_${obj.fill.replace('#', '')}`;
          lines.push(`${varName}.fillColor = addColor("${colorName}", ${r}, ${g}, ${b});`);
        }
      } else if (obj.shapeKind === 'circle') {
        // InDesign uses ovals
        const varName = `oval_${pageIdx}_${Math.random().toString(36).slice(2, 8)}`;
        lines.push(`var ${varName} = page${pageIdx}.ovals.add({`);
        lines.push(`  geometricBounds: ${bounds}`);
        lines.push('});');
        if (obj.fill && obj.fill !== 'transparent') {
          const [r, g, b] = hexToRgb(obj.fill);
          const colorName = `color_${obj.fill.replace('#', '')}`;
          lines.push(`${varName}.fillColor = addColor("${colorName}", ${r}, ${g}, ${b});`);
        }
      } else if (obj.shapeKind === 'line') {
        // InDesign uses graphicLines
        const x1Mm = leftMm;
        const y1Mm = topMm;
        const x2Mm = leftMm + widthMm;
        const y2Mm = topMm + heightMm;
        const varName = `line_${pageIdx}_${Math.random().toString(36).slice(2, 8)}`;
        lines.push(`var ${varName} = page${pageIdx}.graphicLines.add();`);
        lines.push(`${varName}.paths[0].pathPoints[0].anchor = [${x1Mm}, ${y1Mm}];`);
        lines.push(`${varName}.paths[0].pathPoints[1].anchor = [${x2Mm}, ${y2Mm}];`);
        if (obj.stroke && obj.stroke !== 'transparent') {
          const [r, g, b] = hexToRgb(obj.stroke);
          const colorName = `color_${obj.stroke.replace('#', '')}`;
          lines.push(`${varName}.strokeColor = addColor("${colorName}", ${r}, ${g}, ${b});`);
          lines.push(`${varName}.strokeWeight = "${pxToMm(obj.strokeWidth || 1)}mm";`);
        }
      }
      break;
    }

    case 'colorBlock': {
      const varName = `block_${pageIdx}_${Math.random().toString(36).slice(2, 8)}`;
      lines.push(`var ${varName} = page${pageIdx}.rectangles.add({`);
      lines.push(`  geometricBounds: ${bounds}`);
      lines.push('});');
      if (obj.fill && obj.fill !== 'transparent') {
        const [r, g, b] = hexToRgb(obj.fill);
        const colorName = `color_${obj.fill.replace('#', '')}`;
        lines.push(`${varName}.fillColor = addColor("${colorName}", ${r}, ${g}, ${b});`);
      }
      break;
    }

    case 'group': {
      // Flatten group — process child objects individually
      // InDesign can group after placement
      lines.push('// Group start');
      const children = (obj as any).objects || [];
      for (const child of children) {
        lines.push(...generateObjectScript(child, pageIdx));
      }
      lines.push('// Group end');
      break;
    }
  }

  return lines;
}

function mapTextAlign(align: string): string {
  switch (align) {
    case 'center': return 'CENTER_ALIGN';
    case 'right': return 'RIGHT_ALIGN';
    case 'justify': return 'FULL_JUSTIFY';
    default: return 'LEFT_ALIGN';
  }
}
```

### CorelDraw SVG Export

```typescript
// Source: Fabric.js toSVG API and CorelDraw SVG import documentation

function exportCorelDrawSVG(
  canvas: Canvas,
  docWidthMm: number,
  docHeightMm: number
): string {
  // Fabric.js toSVG() generates standard SVG
  // We need to set proper dimensions in mm for print
  const svgString = canvas.toSVG({
    width: `${docWidthMm}mm`,
    height: `${docHeightMm}mm`,
    viewboxWidth: canvas.width,
    viewboxHeight: canvas.height,
  });

  return svgString;
}
```

### CorelDraw VBA Macro Generation (Optional Enhancement)

```typescript
// Source: CorelDraw VBA SDK — community.coreldraw.com/sdk/api/

function generateCorelDrawMacro(
  pages: PageCanvasData[],
  docWidthMm: number,
  docHeightMm: number
): string {
  const lines: string[] = [];

  lines.push("' Generated by Dessy Leaflet Factory");
  lines.push("' Run this macro in CorelDRAW's VBA editor");
  lines.push("Sub CreateLayout()");
  lines.push("  Dim doc As Document");
  lines.push(`  Set doc = CreateDocument()`);
  lines.push(`  doc.Unit = cdrMillimeter`);
  lines.push("");

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      lines.push("  doc.AddPages 1");
    }
    lines.push(`  Dim pg${i} As Page`);
    lines.push(`  Set pg${i} = doc.Pages(${i + 1})`);
    lines.push(`  pg${i}.SetSize ${docWidthMm}, ${docHeightMm}`);
    lines.push(`  pg${i}.Activate`);
    lines.push("");

    const objects = (pages[i].canvasJSON as { objects?: unknown[] }).objects || [];
    for (const obj of objects) {
      lines.push(...generateCorelObject(obj as any, i));
    }
  }

  lines.push("  MsgBox \"Layout created successfully!\"");
  lines.push("End Sub");

  return lines.join('\n');
}

function generateCorelObject(obj: any, pageIdx: number): string[] {
  const lines: string[] = [];
  const leftMm = pxToMm(obj.left || 0);
  const topMm = pxToMm(obj.top || 0);
  const widthMm = pxToMm((obj.width || 0) * (obj.scaleX || 1));
  const heightMm = pxToMm((obj.height || 0) * (obj.scaleY || 1));

  // CorelDraw Y-axis: origin at bottom-left, positive up
  // Need to flip Y coordinates

  switch (obj.customType) {
    case 'text': {
      const varName = `s${pageIdx}_${Math.random().toString(36).slice(2, 6)}`;
      // CreateArtisticText(Left, Bottom, Text, LanguageID, CharSet, Font, Size)
      lines.push(`  Dim ${varName} As Shape`);
      lines.push(`  Set ${varName} = ActiveLayer.CreateArtisticText(${leftMm}, ${topMm}, ${JSON.stringify(obj.text || '')})`);
      lines.push(`  ${varName}.Text.Story.Size = ${obj.fontSize || 12}`);
      if (obj.fontFamily) {
        lines.push(`  ${varName}.Text.Story.Font = "${obj.fontFamily}"`);
      }
      break;
    }

    case 'shape':
    case 'colorBlock': {
      if (obj.shapeKind === 'circle') {
        lines.push(`  ActiveLayer.CreateEllipse ${leftMm}, ${topMm + heightMm}, ${leftMm + widthMm}, ${topMm}`);
      } else {
        lines.push(`  ActiveLayer.CreateRectangle2 ${leftMm}, ${topMm}, ${widthMm}, ${heightMm}`);
      }
      break;
    }
  }

  return lines;
}
```

## InDesign ExtendScript Deep Dive

### Key API Reference

| Operation | ExtendScript API | Notes |
|-----------|-----------------|-------|
| Create document | `app.documents.add()` | Returns Document object |
| Set page size | `doc.documentPreferences.pageWidth = "210mm"` | String with unit suffix |
| Set measurement | `app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS` | SET THIS FIRST |
| Add page | `doc.pages.add()` | Returns Page object |
| Add text frame | `page.textFrames.add()` | Returns TextFrame |
| Add rectangle | `page.rectangles.add()` | Returns Rectangle |
| Add oval | `page.ovals.add()` | Returns Oval |
| Add graphic line | `page.graphicLines.add()` | Returns GraphicLine |
| Set bounds | `frame.geometricBounds = [top, left, bottom, right]` | Y-first! Units follow scriptPreferences |
| Set text content | `frame.contents = "text"` | String assignment |
| Set font | `frame.parentStory.texts[0].appliedFont = "Arial"` | Font name string |
| Set font size | `frame.parentStory.texts[0].pointSize = 12` | Always in points |
| Set text color | `frame.parentStory.texts[0].fillColor = colorSwatch` | Must reference a Color object |
| Set fill color | `rectangle.fillColor = colorSwatch` | Must reference a Color object |
| Set stroke | `rectangle.strokeColor = colorSwatch; rectangle.strokeWeight = "1mm"` | String with unit |
| Add color swatch | `doc.colors.add(); color.properties = {...}` | RGB: [0-255], CMYK: [0-100] |
| Place image | `rectangle.place(File("path"))` | Returns array of Graphics |
| Set justification | `texts[0].justification = Justification.LEFT_ALIGN` | Enum values |
| Group objects | `page.groups.add([obj1, obj2])` | Array of page items |

### InDesign Color Model

```javascript
// RGB color (what we use — project stores hex colors)
var myColor = doc.colors.add();
myColor.properties = {
  name: "MyRed",
  model: ColorModel.PROCESS,
  space: ColorSpace.RGB,
  colorValue: [255, 0, 0]  // 0-255 per channel
};

// Apply to shape
myRect.fillColor = myColor;

// Built-in colors (always available)
// doc.colors.item("Black")
// doc.colors.item("Paper") — white/page color
// doc.colors.item("None") — no fill
```

### Multi-Page Document Setup

```javascript
app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;

var doc = app.documents.add();
doc.documentPreferences.properties = {
  pageWidth: "210mm",
  pageHeight: "297mm",
  facingPages: false,
  pagesPerDocument: 1  // Start with 1, add more
};

// Add additional pages
for (var i = 1; i < totalPages; i++) {
  doc.pages.add();
}

// Access pages
var page0 = doc.pages[0];
var page1 = doc.pages[1];
```

### Fabric.js to InDesign Object Mapping

| Fabric.js Type | customType | InDesign Equivalent | API |
|----------------|------------|-------------------|-----|
| Textbox | text | TextFrame | page.textFrames.add() |
| Rect (image placeholder) | image | Rectangle (graphic frame) | page.rectangles.add({contentType: ContentType.GRAPHIC_TYPE}) |
| Rect | shape (rect) | Rectangle | page.rectangles.add() |
| Ellipse | shape (circle) | Oval | page.ovals.add() |
| Line | shape (line) | GraphicLine | page.graphicLines.add() |
| Triangle | shape (triangle) | Polygon (approximation) | page.polygons.add() or page.rectangles.add() with clip |
| Rect | colorBlock | Rectangle with fill | page.rectangles.add() + fillColor |
| Group | group | Group | Flatten children, then page.groups.add() |

### Handling Triangles in InDesign

InDesign doesn't have a native triangle shape. Two approaches:
1. **Polygon with 3 points:** Use `page.polygons.add()` and set 3 path points — most accurate.
2. **Rectangle approximation:** Less accurate but simpler.

```javascript
// Polygon approach for triangles
var tri = page.polygons.add();
tri.paths[0].pathPoints[0].anchor = [topMm, leftMm + widthMm/2]; // top center
tri.paths[0].pathPoints[1].anchor = [topMm + heightMm, leftMm]; // bottom left
// Need to add a third point
var pp = tri.paths[0].pathPoints.add();
pp.anchor = [topMm + heightMm, leftMm + widthMm]; // bottom right
```

### Handling Rotation

```javascript
// Rotation in InDesign — degrees, clockwise
textFrame.rotationAngle = -30; // negative = clockwise in InDesign
// Fabric.js angle is also clockwise, so: indesignAngle = -fabricAngle
```

### Font Considerations

The generated script should include font fallback comments:
```javascript
// Font mapping — substitute if not available:
// "Inter" -> "Helvetica Neue" or "Arial"
// "Playfair Display" -> "Garamond" or "Times New Roman"
try {
  frame.parentStory.texts[0].appliedFont = "Inter";
} catch(e) {
  frame.parentStory.texts[0].appliedFont = "Arial";
}
```

## CorelDraw Export Deep Dive

### Recommended Approach: SVG as Primary, VBA as Optional

**SVG is the recommended primary format** for CorelDraw export because:
1. CorelDraw has excellent SVG import support
2. Fabric.js has built-in `toSVG()` method
3. No external dependencies needed
4. Text, shapes, colors, and gradients transfer well
5. SVG is an open standard — works in other vector editors too

**VBA macro as optional enhancement** because:
1. More complex to generate correctly
2. CorelDraw VBA API varies between versions
3. Y-axis is inverted (origin at bottom-left)
4. Less portable than SVG

### CorelDraw SVG Import Behavior

| SVG Feature | CorelDraw Support | Notes |
|-------------|------------------|-------|
| Basic shapes (rect, circle, ellipse, line) | Excellent | Full fidelity |
| Text with font-family | Good | Requires font installed on system |
| Fill colors (solid) | Excellent | Hex colors preserved |
| Gradients (linear, radial) | Good | May need minor adjustment |
| Stroke properties | Excellent | Width, color, dash patterns |
| Groups | Good | Layer structure preserved |
| Opacity | Good | Supported via SVG opacity attribute |
| Transforms (translate, rotate, scale) | Good | Matrix transforms supported |
| Embedded images (base64) | Good | Images embedded in SVG are imported |
| Clipping paths | Moderate | Complex clips may simplify |

### SVG Export Considerations for CorelDraw

1. **Convert text to presentation attributes** — ensures font rendering matches
2. **Use mm units in SVG** — CorelDraw respects SVG units for sizing
3. **Embed images as base64** — avoids broken image links
4. **Set proper viewBox** — ensures correct scaling on import

### CorelDraw VBA Key Methods

| Operation | VBA Method | Notes |
|-----------|-----------|-------|
| Create document | `CreateDocument()` | Returns Document |
| Set units | `doc.Unit = cdrMillimeter` | Global document unit |
| Set page size | `page.SetSize width, height` | In document units |
| Add pages | `doc.AddPages count` | Adds N pages |
| Create rectangle | `ActiveLayer.CreateRectangle2 x, y, w, h` | x,y = lower-left corner |
| Create ellipse | `ActiveLayer.CreateEllipse x1, y1, x2, y2` | Bounding box corners |
| Create text | `ActiveLayer.CreateArtisticText x, y, "text"` | Position + string |
| Create paragraph text | `ActiveLayer.CreateParagraphText x1, y1, x2, y2, "text"` | Bounding box |
| Set fill color | `shape.Fill.UniformColor.RGBAssign r, g, b` | 0-255 per channel |
| Set outline color | `shape.Outline.Color.RGBAssign r, g, b` | 0-255 per channel |
| Set outline width | `shape.Outline.Width = 0.5` | In document units |
| Set font | `shape.Text.Story.Font = "Arial"` | Font name string |
| Set font size | `shape.Text.Story.Size = 12` | In points |
| Group shapes | `doc.Selection.Group` | Groups selected shapes |

### CorelDraw Y-Axis Inversion

**Critical:** CorelDraw's coordinate system has origin at the bottom-left with Y increasing upward. Fabric.js and InDesign have origin at top-left with Y increasing downward.

```
Fabric.js / InDesign:        CorelDraw:
(0,0) ---------> X          Y ^
  |                           |
  |                           |
  v                          (0,0) ---------> X
  Y
```

Conversion: `corelY = pageHeightMm - fabricYMm`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| canvas.toDataURL() for download | toCanvasElement() + toBlob() + createObjectURL() | 2023+ | Required for files >2MB |
| Fabric.js clipTo | Fabric.js clipPath | v3+ | clipTo removed; use clipPath for crop regions |
| ExtendScript Toolkit | VS Code + ExtendScript Debugger | 2020+ | Adobe deprecated ESTK; VS Code is now standard |
| CorelDraw legacy macro format | CorelDraw VBA (GMS modules) | X7+ | VBA is the current macro standard |

## Open Questions

1. **Image export in InDesign script**
   - What we know: Image frames in Fabric.js store a reference (`imageId`) to IndexedDB blobs, not file paths
   - What's unclear: How to handle images in ExtendScript — can we embed base64 in the script, or must images be separate files?
   - Recommendation: Export images as separate files alongside the .jsx script (in a zip). Generate `place(File("./images/image-1.jpg"))` calls with relative paths. Include a README in the zip.

2. **Gradient support in InDesign ExtendScript**
   - What we know: Fabric.js supports linear and radial gradients. InDesign has gradient swatches.
   - What's unclear: Exact API for creating gradient swatches in ExtendScript
   - Recommendation: For v1, convert gradients to solid colors (use first stop color). Add gradient support as enhancement.

3. **CorelDraw version compatibility for VBA macros**
   - What we know: VBA API is documented for X7 through 2026
   - What's unclear: Exact API differences between versions
   - Recommendation: Target CorelDraw 2020+ API. Use simple CreateRectangle2/CreateArtisticText methods that are stable across versions.

4. **Rotation and transforms in ExtendScript**
   - What we know: InDesign supports `rotationAngle` property
   - What's unclear: How complex transforms (skew, non-uniform scale) map to InDesign
   - Recommendation: Support rotation. Bake scale into dimensions. Skip skew (rare in print layouts).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 + ts-jest |
| Config file | jest.config.ts (needs creation if not present) |
| Quick run command | `npx jest --testPathPattern=export --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EXPO-01 | Raster export generates valid Blob for each page | unit | `npx jest src/lib/export/__tests__/raster-export.test.ts -x` | Wave 0 |
| EXPO-02 | InDesign script contains valid ExtendScript syntax | unit | `npx jest src/lib/export/__tests__/indesign-export.test.ts -x` | Wave 0 |
| EXPO-04 | InDesign export maps all element types correctly | unit | `npx jest src/lib/export/__tests__/indesign-export.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=export --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
- [ ] `src/lib/export/__tests__/raster-export.test.ts` -- covers EXPO-01
- [ ] `src/lib/export/__tests__/indesign-export.test.ts` -- covers EXPO-02, EXPO-04
- [ ] `src/lib/export/__tests__/coreldraw-export.test.ts` -- covers CorelDraw export
- [ ] `src/lib/export/__tests__/export-utils.test.ts` -- covers shared utilities (color conversion, unit mapping)

Note: Raster export tests will need to mock Fabric.js Canvas (JSDOM has no real canvas). InDesign/CorelDraw export tests can validate generated string output without canvas mocking.

## Sources

### Primary (HIGH confidence)
- Fabric.js official docs — `fabricjs.com/api/classes/canvas/` — toDataURL, toCanvasElement, toSVG methods
- InDesign ExtendScript API — `indesignjs.de/extendscriptAPI/indesign-latest/` — TextFrames, Rectangles, Colors, Document
- ExtendScript wiki Colors and Swatches — `github.com/ExtendScript/wiki/wiki/Colors-And-Swatches` — Color creation API

### Secondary (MEDIUM confidence)
- CorelDraw VBA SDK — `community.coreldraw.com/sdk/api/` — Layer.CreateRectangle2, CreateArtisticText
- CorelDraw SVG support — `product.corel.com/help/CorelDRAW/` — SVG import/export capabilities
- Fabric.js GitHub issues #4906, #1970, #2526 — toDataURL multiplier and DPI handling

### Tertiary (LOW confidence)
- CorelDraw VBA Programming Guide (corelpro.xyz) — Examples may be from older versions (X6-X8 era)
- Stack Overflow / Medium articles on Fabric.js export — General patterns, not v7 specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Fabric.js built-in APIs well documented; file-saver and jszip are stable mature libraries
- Raster export architecture: HIGH — Standard browser APIs (toBlob, createObjectURL), well-trodden path
- InDesign ExtendScript: MEDIUM-HIGH — API is stable and well-documented; geometricBounds coordinate order and unit handling verified from multiple sources
- CorelDraw SVG: MEDIUM — SVG import works well per CorelDraw docs, but exact fidelity for all Fabric.js features untested
- CorelDraw VBA: MEDIUM-LOW — API documented but examples are sparse for modern versions; Y-axis inversion adds complexity

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days — stable domain, APIs don't change frequently)
