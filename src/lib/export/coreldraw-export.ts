/**
 * CorelDraw export: SVG files and VBA macro (.bas) generation.
 *
 * SVG uses Fabric.js toSVG() with mm dimensions for accurate print sizing.
 * VBA macro generates CorelDraw-native shapes with Y-axis inversion.
 */

import type { Canvas } from 'fabric';
import type { Page } from '@/types/project';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { collectAllPageData, hexToRgb, pxToMm, type PageExportData } from './export-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CanvasJSON {
  objects?: FabricObjectData[];
  [key: string]: unknown;
}

interface FabricObjectData {
  type?: string;
  customType?: string;
  shapeKind?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// SVG Export
// ---------------------------------------------------------------------------

/**
 * Generate an SVG string from a Fabric.js canvas JSON snapshot.
 * Uses a temporary StaticCanvas to render the SVG with mm dimensions
 * and a viewBox matching the canvas pixel dimensions.
 */
async function renderPageToSVG(
  canvasJSON: CanvasJSON,
  canvasWidth: number,
  canvasHeight: number,
  docWidthMm: number,
  docHeightMm: number,
): Promise<string> {
  const { StaticCanvas } = await import('fabric');

  const tempCanvas = new StaticCanvas(undefined, {
    width: canvasWidth,
    height: canvasHeight,
  });

  const { loadCanvasJSON } = await import('@/lib/fabric/load-canvas-json');
  await loadCanvasJSON(tempCanvas, canvasJSON);
  tempCanvas.renderAll();

  const svgString = tempCanvas.toSVG({
    width: `${docWidthMm}mm`,
    height: `${docHeightMm}mm`,
    viewBox: {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
    },
  });

  tempCanvas.dispose();

  return svgString;
}

/**
 * Export the current project as CorelDraw-compatible SVG.
 *
 * Single page: downloads a .svg file.
 * Multi-page: downloads a .zip containing one .svg per page.
 */
export async function exportCorelDrawSVG(
  canvas: Canvas,
  projectId: string,
  pages: Page[],
  currentPageIndex: number,
  docWidthMm: number,
  docHeightMm: number,
  projectName: string,
): Promise<void> {
  const allPages = collectAllPageData(
    canvas,
    projectId,
    pages,
    currentPageIndex,
  );

  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'export';

  if (allPages.length === 1) {
    const svg = await renderPageToSVG(
      allPages[0].canvasJSON as CanvasJSON,
      canvasWidth,
      canvasHeight,
      docWidthMm,
      docHeightMm,
    );
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, `${safeName}.svg`);
    return;
  }

  // Multi-page: create ZIP
  const zip = new JSZip();
  for (const pageData of allPages) {
    const svg = await renderPageToSVG(
      pageData.canvasJSON as CanvasJSON,
      canvasWidth,
      canvasHeight,
      docWidthMm,
      docHeightMm,
    );
    zip.file(`${safeName}_page${pageData.pageIndex + 1}.svg`, svg);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${safeName}_coreldraw.zip`);
}

// ---------------------------------------------------------------------------
// VBA Macro Generation
// ---------------------------------------------------------------------------

/**
 * Generate VBA code for a single Fabric.js object.
 *
 * CRITICAL: CorelDraw Y-axis is inverted (origin at bottom-left, Y up).
 * Conversion: corelY = docHeightMm - (topMm + heightMm)
 */
function generateCorelObject(
  obj: FabricObjectData,
  pageIdx: number,
  docHeightMm: number,
): string[] {
  const lines: string[] = [];

  const leftMm = pxToMm(obj.left ?? 0);
  const topMm = pxToMm(obj.top ?? 0);
  const widthMm = pxToMm((obj.width ?? 0) * (obj.scaleX ?? 1));
  const heightMm = pxToMm((obj.height ?? 0) * (obj.scaleY ?? 1));

  // CorelDraw Y inversion: bottom-left origin
  const corelY = docHeightMm - (topMm + heightMm);

  // Unique variable name per shape
  const varName = `s${pageIdx}_${Math.random().toString(36).slice(2, 8)}`;

  switch (obj.customType) {
    case 'text': {
      // Paragraph text with bounding box for wrapping support
      const x1 = leftMm;
      const y1 = corelY + heightMm; // top in CorelDraw coords (higher Y)
      const x2 = leftMm + widthMm;
      const y2 = corelY; // bottom in CorelDraw coords (lower Y)
      const escapedText = (obj.text ?? '').replace(/"/g, '""');

      lines.push(`  Dim ${varName} As Shape`);
      lines.push(
        `  Set ${varName} = ActiveLayer.CreateParagraphText(${x1}, ${y1}, ${x2}, ${y2}, "${escapedText}")`,
      );
      if (obj.fontSize) {
        lines.push(`  ${varName}.Text.Story.Size = ${obj.fontSize}`);
      }
      if (obj.fontFamily) {
        lines.push(`  ${varName}.Text.Story.Font = "${obj.fontFamily}"`);
      }
      if (obj.fill && obj.fill !== 'transparent') {
        const [r, g, b] = hexToRgb(obj.fill);
        lines.push(`  ${varName}.Fill.UniformColor.RGBAssign ${r}, ${g}, ${b}`);
      }
      break;
    }

    case 'shape': {
      if (obj.shapeKind === 'circle') {
        // CreateEllipse uses bounding box: x1, y1 (top-left in Corel), x2, y2 (bottom-right in Corel)
        const x1 = leftMm;
        const y1 = corelY + heightMm; // top in CorelDraw coords
        const x2 = leftMm + widthMm;
        const y2 = corelY; // bottom in CorelDraw coords
        lines.push(`  Dim ${varName} As Shape`);
        lines.push(
          `  Set ${varName} = ActiveLayer.CreateEllipse(${x1}, ${y1}, ${x2}, ${y2})`,
        );
        if (obj.fill && obj.fill !== 'transparent') {
          const [r, g, b] = hexToRgb(obj.fill);
          lines.push(
            `  ${varName}.Fill.UniformColor.RGBAssign ${r}, ${g}, ${b}`,
          );
        }
      } else if (obj.shapeKind === 'line') {
        // Line segment from start to end
        const x1 = leftMm;
        const y1 = docHeightMm - topMm;
        const x2 = leftMm + widthMm;
        const y2 = docHeightMm - (topMm + heightMm);
        lines.push(`  Dim ${varName} As Shape`);
        lines.push(
          `  Set ${varName} = ActiveLayer.CreateLineSegment(${x1}, ${y1}, ${x2}, ${y2})`,
        );
        if (obj.stroke && obj.stroke !== 'transparent') {
          const [r, g, b] = hexToRgb(obj.stroke);
          lines.push(
            `  ${varName}.Outline.Color.RGBAssign ${r}, ${g}, ${b}`,
          );
        }
        if (obj.strokeWidth) {
          lines.push(
            `  ${varName}.Outline.Width = ${pxToMm(obj.strokeWidth)}`,
          );
        }
      } else {
        // rect, triangle, or other — use CreateRectangle2 (x, y = lower-left corner)
        lines.push(`  Dim ${varName} As Shape`);
        lines.push(
          `  Set ${varName} = ActiveLayer.CreateRectangle2(${leftMm}, ${corelY}, ${widthMm}, ${heightMm})`,
        );
        if (obj.fill && obj.fill !== 'transparent') {
          const [r, g, b] = hexToRgb(obj.fill);
          lines.push(
            `  ${varName}.Fill.UniformColor.RGBAssign ${r}, ${g}, ${b}`,
          );
        }
      }
      break;
    }

    case 'colorBlock': {
      // Color blocks are rectangles with fill
      lines.push(`  Dim ${varName} As Shape`);
      lines.push(
        `  Set ${varName} = ActiveLayer.CreateRectangle2(${leftMm}, ${corelY}, ${widthMm}, ${heightMm})`,
      );
      if (obj.fill && obj.fill !== 'transparent') {
        const [r, g, b] = hexToRgb(obj.fill);
        lines.push(
          `  ${varName}.Fill.UniformColor.RGBAssign ${r}, ${g}, ${b}`,
        );
      }
      break;
    }

    case 'image': {
      // Image frames become placeholder rectangles with a comment
      lines.push(`  ' Image placeholder — replace with File > Import`);
      lines.push(`  Dim ${varName} As Shape`);
      lines.push(
        `  Set ${varName} = ActiveLayer.CreateRectangle2(${leftMm}, ${corelY}, ${widthMm}, ${heightMm})`,
      );
      lines.push(
        `  ${varName}.Fill.UniformColor.RGBAssign 200, 200, 200`,
      );
      break;
    }

    default:
      // Unknown customType — skip with comment
      lines.push(`  ' Skipped unknown element type: ${obj.customType ?? obj.type ?? 'unknown'}`);
      break;
  }

  lines.push('');
  return lines;
}

/**
 * Generate a complete CorelDraw VBA macro string from page data.
 *
 * The macro creates a document with the correct page size in mm,
 * adds pages, and recreates all elements with proper coordinates.
 */
export function generateCorelDrawMacro(
  pages: PageExportData[],
  docWidthMm: number,
  docHeightMm: number,
): string {
  const lines: string[] = [];

  lines.push("' Generated by Dessy Leaflet Factory");
  lines.push("' Run this macro in CorelDRAW's VBA editor (Tools > Macros)");
  lines.push("' Target: CorelDRAW 2020+");
  lines.push('');
  lines.push('Sub CreateLayout()');
  lines.push('  Dim doc As Document');
  lines.push('  Set doc = CreateDocument()');
  lines.push('  doc.Unit = cdrMillimeter');
  lines.push('');

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      lines.push('  doc.AddPages 1');
    }

    lines.push(`  Dim pg${i} As Page`);
    lines.push(`  Set pg${i} = doc.Pages(${i + 1})`);
    lines.push(`  pg${i}.SetSize ${docWidthMm}, ${docHeightMm}`);
    lines.push(`  pg${i}.Activate`);
    lines.push('');

    const objects =
      (pages[i].canvasJSON as CanvasJSON).objects ?? [];

    for (const obj of objects) {
      lines.push(...generateCorelObject(obj, i, docHeightMm));
    }
  }

  lines.push('  MsgBox "Layout created successfully!"');
  lines.push('End Sub');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// VBA Export (download .bas file)
// ---------------------------------------------------------------------------

/**
 * Export the current project as a CorelDraw VBA macro (.bas file).
 *
 * Collects all page data, generates the VBA macro, and downloads it.
 */
export function exportCorelDrawVBA(
  canvas: Canvas,
  projectId: string,
  pages: Page[],
  currentPageIndex: number,
  docWidthMm: number,
  docHeightMm: number,
  projectName: string,
): void {
  const allPages = collectAllPageData(
    canvas,
    projectId,
    pages,
    currentPageIndex,
  );

  const macro = generateCorelDrawMacro(
    allPages,
    docWidthMm,
    docHeightMm,
  );

  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'export';
  const blob = new Blob([macro], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${safeName}_coreldraw.bas`);
}
