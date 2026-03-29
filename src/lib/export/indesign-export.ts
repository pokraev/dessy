/**
 * InDesign ExtendScript (.jsx) generator.
 *
 * Converts Fabric.js canvas data into a self-contained ExtendScript file
 * that recreates the layout in Adobe InDesign with correct positioning,
 * colors, fonts, and multi-page support.
 *
 * COORDINATE SYSTEM NOTE:
 * InDesign geometricBounds uses [top, left, bottom, right] (Y-first!).
 * This is different from most coordinate systems that use [x, y, w, h].
 */

import { saveAs } from 'file-saver';
import { collectAllPageData, hexToRgb, pxToMm } from './export-utils';
import type { PageExportData } from './export-utils';
import type { Canvas } from 'fabric';
import type { Page } from '@/types/project';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FabricObject {
  customType?: string;
  shapeKind?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: string;
  textAlign?: string;
  underline?: boolean;
  linethrough?: boolean;
  opacity?: number;
  visible?: boolean;
  rx?: number;
  ry?: number;
  objects?: FabricObject[];
  // Line-specific (Fabric stores x1,y1,x2,y2)
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

interface ExportMeta {
  name: string;
  format?: string;
}

// ---------------------------------------------------------------------------
// Text alignment mapping
// ---------------------------------------------------------------------------

function mapTextAlign(align: string): string {
  switch (align) {
    case 'center':
      return 'CENTER_ALIGN';
    case 'right':
      return 'RIGHT_ALIGN';
    case 'justify':
      return 'FULL_JUSTIFY';
    default:
      return 'LEFT_ALIGN';
  }
}

// ---------------------------------------------------------------------------
// Unique ID generator (for ExtendScript variable names)
// ---------------------------------------------------------------------------

let _counter = 0;
function uid(): string {
  _counter += 1;
  return String(_counter);
}

// ---------------------------------------------------------------------------
// Per-object ExtendScript generation
// ---------------------------------------------------------------------------

function generateObjectScript(
  obj: FabricObject,
  pageIdx: number,
  colorSet: Set<string>,
): string[] {
  if (obj.visible === false) return [];

  const lines: string[] = [];

  // Convert px (72 DPI) to mm, accounting for scale
  const leftMm = pxToMm(obj.left ?? 0);
  const topMm = pxToMm(obj.top ?? 0);
  const widthMm = pxToMm((obj.width ?? 0) * (obj.scaleX ?? 1));
  const heightMm = pxToMm((obj.height ?? 0) * (obj.scaleY ?? 1));

  // geometricBounds = [top, left, bottom, right] (Y-first!)
  const bounds = `[${topMm.toFixed(3)}, ${leftMm.toFixed(3)}, ${(topMm + heightMm).toFixed(3)}, ${(leftMm + widthMm).toFixed(3)}]`;

  const angle = obj.angle ?? 0;

  /** Emit addColor call and track the swatch */
  function emitColor(hex: string): string {
    if (!hex || hex === 'transparent') return '"None"';
    const rgb = hexToRgb(hex);
    if (!rgb) return '"None"';
    const [r, g, b] = rgb;
    const colorName = `color_${hex.replace('#', '')}`;
    colorSet.add(hex);
    return `addColor("${colorName}", ${r}, ${g}, ${b})`;
  }

  switch (obj.customType) {
    // ----- TEXT -----
    case 'text': {
      const v = `tf_${pageIdx}_${uid()}`;
      lines.push(`  var ${v} = page${pageIdx}.textFrames.add();`);
      lines.push(`  ${v}.geometricBounds = ${bounds};`);
      lines.push(`  ${v}.contents = ${JSON.stringify(obj.text ?? '')};`);

      // Font with try/catch fallback
      const fontFamily = obj.fontFamily ?? 'Arial';
      lines.push(`  try {`);
      lines.push(`    ${v}.parentStory.texts[0].appliedFont = app.fonts.item("${fontFamily}");`);
      lines.push(`  } catch(_e) {`);
      lines.push(`    try { ${v}.parentStory.texts[0].appliedFont = app.fonts.item("Arial"); } catch(_e2) {}`);
      lines.push(`  }`);

      // Point size
      lines.push(`  ${v}.parentStory.texts[0].pointSize = ${obj.fontSize ?? 12};`);

      // Bold / italic
      if (obj.fontWeight && (obj.fontWeight === 'bold' || Number(obj.fontWeight) >= 700)) {
        lines.push(`  try { ${v}.parentStory.texts[0].fontStyle = "Bold"; } catch(_e) {}`);
      }
      if (obj.fontStyle === 'italic') {
        lines.push(`  try { ${v}.parentStory.texts[0].fontStyle = "Italic"; } catch(_e) {}`);
      }

      // Underline / strikethrough
      if (obj.underline) {
        lines.push(`  ${v}.parentStory.texts[0].underline = true;`);
      }
      if (obj.linethrough) {
        lines.push(`  ${v}.parentStory.texts[0].strikeThru = true;`);
      }

      // Fill color
      if (obj.fill && obj.fill !== '#000000' && obj.fill !== 'transparent') {
        lines.push(`  ${v}.parentStory.texts[0].fillColor = ${emitColor(obj.fill)};`);
      }

      // Justification
      lines.push(`  ${v}.parentStory.texts[0].justification = Justification.${mapTextAlign(obj.textAlign ?? 'left')};`);

      // Rotation
      if (angle !== 0) {
        lines.push(`  ${v}.rotationAngle = ${-angle};`);
      }

      lines.push('');
      break;
    }

    // ----- IMAGE -----
    case 'image': {
      const v = `img_${pageIdx}_${uid()}`;
      lines.push(`  var ${v} = page${pageIdx}.rectangles.add({`);
      lines.push(`    geometricBounds: ${bounds},`);
      lines.push(`    contentType: ContentType.GRAPHIC_TYPE`);
      lines.push(`  });`);
      lines.push(`  // TODO: Place image file — ${v}.place(File("path/to/image.jpg"));`);

      if (angle !== 0) {
        lines.push(`  ${v}.rotationAngle = ${-angle};`);
      }

      lines.push('');
      break;
    }

    // ----- SHAPE -----
    case 'shape': {
      const kind = obj.shapeKind ?? 'rect';

      if (kind === 'rect') {
        const v = `rect_${pageIdx}_${uid()}`;
        lines.push(`  var ${v} = page${pageIdx}.rectangles.add({`);
        lines.push(`    geometricBounds: ${bounds}`);
        lines.push(`  });`);

        if (obj.fill && obj.fill !== 'transparent') {
          lines.push(`  ${v}.fillColor = ${emitColor(obj.fill)};`);
        }

        // Corner radius
        if (obj.rx && obj.rx > 0) {
          const radiusMm = pxToMm(obj.rx * (obj.scaleX ?? 1));
          lines.push(`  ${v}.topLeftCornerRadius = "${radiusMm.toFixed(3)}mm";`);
          lines.push(`  ${v}.topRightCornerRadius = "${radiusMm.toFixed(3)}mm";`);
          lines.push(`  ${v}.bottomLeftCornerRadius = "${radiusMm.toFixed(3)}mm";`);
          lines.push(`  ${v}.bottomRightCornerRadius = "${radiusMm.toFixed(3)}mm";`);
        }

        // Stroke
        if (obj.stroke && obj.stroke !== 'transparent' && (obj.strokeWidth ?? 0) > 0) {
          lines.push(`  ${v}.strokeColor = ${emitColor(obj.stroke)};`);
          lines.push(`  ${v}.strokeWeight = "${pxToMm(obj.strokeWidth ?? 1).toFixed(3)}mm";`);
        }

        if (angle !== 0) {
          lines.push(`  ${v}.rotationAngle = ${-angle};`);
        }

        lines.push('');

      } else if (kind === 'circle') {
        const v = `oval_${pageIdx}_${uid()}`;
        lines.push(`  var ${v} = page${pageIdx}.ovals.add({`);
        lines.push(`    geometricBounds: ${bounds}`);
        lines.push(`  });`);

        if (obj.fill && obj.fill !== 'transparent') {
          lines.push(`  ${v}.fillColor = ${emitColor(obj.fill)};`);
        }

        if (obj.stroke && obj.stroke !== 'transparent' && (obj.strokeWidth ?? 0) > 0) {
          lines.push(`  ${v}.strokeColor = ${emitColor(obj.stroke)};`);
          lines.push(`  ${v}.strokeWeight = "${pxToMm(obj.strokeWidth ?? 1).toFixed(3)}mm";`);
        }

        if (angle !== 0) {
          lines.push(`  ${v}.rotationAngle = ${-angle};`);
        }

        lines.push('');

      } else if (kind === 'line') {
        const v = `line_${pageIdx}_${uid()}`;
        // For lines, use the actual endpoints
        const x1Mm = leftMm;
        const y1Mm = topMm;
        const x2Mm = leftMm + widthMm;
        const y2Mm = topMm + heightMm;

        lines.push(`  var ${v} = page${pageIdx}.graphicLines.add();`);
        lines.push(`  ${v}.paths[0].pathPoints[0].anchor = [${x1Mm.toFixed(3)}, ${y1Mm.toFixed(3)}];`);
        lines.push(`  ${v}.paths[0].pathPoints[1].anchor = [${x2Mm.toFixed(3)}, ${y2Mm.toFixed(3)}];`);

        if (obj.stroke && obj.stroke !== 'transparent') {
          lines.push(`  ${v}.strokeColor = ${emitColor(obj.stroke)};`);
          lines.push(`  ${v}.strokeWeight = "${pxToMm(obj.strokeWidth ?? 2).toFixed(3)}mm";`);
        }

        if (angle !== 0) {
          lines.push(`  ${v}.rotationAngle = ${-angle};`);
        }

        lines.push('');

      } else if (kind === 'triangle') {
        // InDesign polygon with 3 path points
        const v = `tri_${pageIdx}_${uid()}`;

        // Triangle vertices: top-center, bottom-left, bottom-right
        const cx = leftMm + widthMm / 2;
        const topY = topMm;
        const bottomY = topMm + heightMm;
        const leftX = leftMm;
        const rightX = leftMm + widthMm;

        lines.push(`  var ${v} = page${pageIdx}.polygons.add();`);
        lines.push(`  ${v}.paths[0].entirePath = [`);
        lines.push(`    [${cx.toFixed(3)}, ${topY.toFixed(3)}],`);
        lines.push(`    [${rightX.toFixed(3)}, ${bottomY.toFixed(3)}],`);
        lines.push(`    [${leftX.toFixed(3)}, ${bottomY.toFixed(3)}]`);
        lines.push(`  ];`);

        if (obj.fill && obj.fill !== 'transparent') {
          lines.push(`  ${v}.fillColor = ${emitColor(obj.fill)};`);
        }

        if (obj.stroke && obj.stroke !== 'transparent' && (obj.strokeWidth ?? 0) > 0) {
          lines.push(`  ${v}.strokeColor = ${emitColor(obj.stroke)};`);
          lines.push(`  ${v}.strokeWeight = "${pxToMm(obj.strokeWidth ?? 1).toFixed(3)}mm";`);
        }

        if (angle !== 0) {
          lines.push(`  ${v}.rotationAngle = ${-angle};`);
        }

        lines.push('');
      }

      break;
    }

    // ----- COLOR BLOCK -----
    case 'colorBlock': {
      const v = `block_${pageIdx}_${uid()}`;
      lines.push(`  var ${v} = page${pageIdx}.rectangles.add({`);
      lines.push(`    geometricBounds: ${bounds}`);
      lines.push(`  });`);

      if (obj.fill && obj.fill !== 'transparent') {
        lines.push(`  ${v}.fillColor = ${emitColor(obj.fill)};`);
      }

      if (obj.stroke && obj.stroke !== 'transparent' && (obj.strokeWidth ?? 0) > 0) {
        lines.push(`  ${v}.strokeColor = ${emitColor(obj.stroke)};`);
        lines.push(`  ${v}.strokeWeight = "${pxToMm(obj.strokeWidth ?? 1).toFixed(3)}mm";`);
      }

      if (angle !== 0) {
        lines.push(`  ${v}.rotationAngle = ${-angle};`);
      }

      // Opacity
      if (obj.opacity !== undefined && obj.opacity < 1) {
        lines.push(`  ${v}.transparencySettings.blendingSettings.opacity = ${(obj.opacity * 100).toFixed(1)};`);
      }

      lines.push('');
      break;
    }

    // ----- GROUP -----
    case 'group': {
      lines.push(`  // --- Group start ---`);
      const children = obj.objects ?? [];
      for (const child of children) {
        lines.push(...generateObjectScript(child, pageIdx, colorSet));
      }
      lines.push(`  // --- Group end ---`);
      lines.push('');
      break;
    }

    default:
      lines.push(`  // Unsupported element type: ${obj.customType ?? 'unknown'}`);
      lines.push('');
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Main script generator
// ---------------------------------------------------------------------------

/**
 * Generate a complete InDesign ExtendScript (.jsx) string from page data.
 *
 * @param pages - Array of page canvas data (from collectAllPageData)
 * @param meta - Project metadata (name, format)
 * @param docWidthMm - Document page width in millimeters
 * @param docHeightMm - Document page height in millimeters
 * @returns Complete .jsx script as a string
 */
export function generateInDesignScript(
  pages: PageExportData[],
  meta: ExportMeta,
  docWidthMm: number,
  docHeightMm: number,
): string {
  // Reset UID counter for deterministic output within a single generation
  _counter = 0;

  const colorSet = new Set<string>();
  const lines: string[] = [];

  // ---------- Header ----------
  lines.push('// ===================================================');
  lines.push(`// InDesign ExtendScript — Generated by Dessy`);
  lines.push(`// Project: ${meta.name || 'Untitled'}`);
  lines.push(`// Date: ${new Date().toISOString()}`);
  lines.push('// NOTE: Fonts used in this layout may need to be');
  lines.push('//       installed or substituted in InDesign.');
  lines.push('// ===================================================');
  lines.push('');

  // ---------- Measurement units ----------
  lines.push('app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;');
  lines.push('');

  // ---------- Create document ----------
  lines.push('var doc = app.documents.add();');
  lines.push('doc.documentPreferences.properties = {');
  lines.push(`  pageWidth: "${docWidthMm}mm",`);
  lines.push(`  pageHeight: "${docHeightMm}mm",`);
  lines.push('  facingPages: false');
  lines.push('};');
  lines.push('');

  // ---------- addColor helper ----------
  lines.push('// --- Color helper ---');
  lines.push('function addColor(name, r, g, b) {');
  lines.push('  try {');
  lines.push('    var existing = doc.colors.itemByName(name);');
  lines.push('    existing.name; // force resolve — throws if not found');
  lines.push('    return existing;');
  lines.push('  } catch(e) {');
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

  // ---------- Pages and objects ----------
  const pageBodyLines: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pageBodyLines.push(`doc.pages.add();`);
    }
    pageBodyLines.push(`var page${i} = doc.pages[${i}];`);
    pageBodyLines.push('');

    // Page background
    const bg = pages[i].background;
    if (bg && bg !== 'transparent' && bg !== '#ffffff' && bg !== '#FFFFFF' && bg !== 'white') {
      const bgV = `bg_${i}`;
      pageBodyLines.push(`  var ${bgV} = page${i}.rectangles.add({`);
      pageBodyLines.push(`    geometricBounds: [0, 0, ${docHeightMm}, ${docWidthMm}]`);
      pageBodyLines.push(`  });`);
      const rgb = hexToRgb(bg);
      if (rgb) {
        const [r, g, b] = rgb;
        const colorName = `color_${bg.replace('#', '')}`;
        colorSet.add(bg);
        pageBodyLines.push(`  ${bgV}.fillColor = addColor("${colorName}", ${r}, ${g}, ${b});`);
      }
      pageBodyLines.push('');
    }

    // Process objects on this page
    const canvasData = pages[i].canvasJSON as { objects?: FabricObject[] };
    const objects = canvasData.objects ?? [];
    for (const obj of objects) {
      pageBodyLines.push(...generateObjectScript(obj, i, colorSet));
    }
  }

  lines.push(...pageBodyLines);

  // ---------- Completion alert ----------
  lines.push('');
  lines.push('alert("Layout imported successfully!\\n\\n' +
    'Please check:\\n' +
    '- Font substitutions (some web fonts may not be available)\\n' +
    '- Image placeholders (marked with TODO comments in script)\\n' +
    '- Color accuracy (RGB values mapped from web hex colors)");');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public export function
// ---------------------------------------------------------------------------

/**
 * Collect all page data from the canvas/sessionStorage and generate + download
 * an InDesign ExtendScript (.jsx) file.
 *
 * @param canvas - Active Fabric.js canvas instance
 * @param projectId - Current project ID (for sessionStorage key lookup)
 * @param pages - Page definitions array (id + background)
 * @param currentPageIndex - Index of the currently active page
 * @param docWidthMm - Document page width in millimeters
 * @param docHeightMm - Document page height in millimeters
 * @param projectName - Human-readable project name for the filename
 */
export function exportInDesign(
  canvas: Canvas,
  projectId: string,
  pages: Page[],
  currentPageIndex: number,
  docWidthMm: number,
  docHeightMm: number,
  projectName?: string,
): void {
  const allPages = collectAllPageData(canvas, projectId, pages, currentPageIndex);

  const script = generateInDesignScript(
    allPages,
    { name: projectName ?? 'Untitled' },
    docWidthMm,
    docHeightMm,
  );

  const blob = new Blob([script], { type: 'application/javascript;charset=utf-8' });
  const safeName = (projectName ?? 'dessy-export')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
  saveAs(blob, `${safeName}.jsx`);
}
