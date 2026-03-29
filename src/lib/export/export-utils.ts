import type { Canvas } from 'fabric';
import type { Page } from '@/types/project';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';

/**
 * DPI multipliers relative to 72 DPI (screen).
 * multiplier = targetDPI / 72
 */
export const DPI_MULTIPLIERS: Record<number, number> = {
  72: 1,
  150: 150 / 72,   // ~2.08
  300: 300 / 72,   // ~4.17
};

export type RasterFormat = 'png' | 'jpeg';
export type DpiOption = 72 | 150 | 300;

/**
 * Data collected for a single page ready for export.
 */
export interface PageExportData {
  pageIndex: number;
  canvasJSON: Record<string, unknown>;
  pageId: string;
  background: string;
}

/**
 * Collect canvas JSON for all pages.
 *
 * - The current page is serialized live from the active canvas.
 * - Other pages are read from sessionStorage (key pattern: dessy-generated-page-{projectId}-{index}).
 */
export function collectAllPageData(
  canvas: Canvas,
  projectId: string,
  pages: Page[],
  currentPageIndex: number,
): PageExportData[] {
  const result: PageExportData[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    let canvasJSON: Record<string, unknown>;

    if (i === currentPageIndex) {
      // Serialize the live canvas
      canvasJSON = canvas.toDatalessJSON([...CUSTOM_PROPS] as string[]);
    } else {
      // Read from sessionStorage
      const key = `dessy-generated-page-${projectId}-${i}`;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        try {
          canvasJSON = JSON.parse(stored);
        } catch {
          // Fallback to empty canvas
          canvasJSON = { version: '6.0.0', objects: [] };
        }
      } else {
        canvasJSON = { version: '6.0.0', objects: [] };
      }
    }

    result.push({
      pageIndex: i,
      canvasJSON,
      pageId: page.id,
      background: page.background,
    });
  }

  return result;
}

/**
 * Convert a hex color string to an RGB tuple [0-255].
 * Supports 3-char (#abc) and 6-char (#aabbcc) hex.
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
  }
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Convert 72-DPI pixels to millimeters.
 */
export function pxToMm(px: number): number {
  return (px * 25.4) / 72;
}

/**
 * Convert millimeters to 72-DPI pixels.
 */
export function mmToPx(mm: number): number {
  return (mm * 72) / 25.4;
}
