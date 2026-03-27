import { mmToPx } from '@/lib/units';
import type { FormatDefinition } from '@/constants/formats';

export interface GuideRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface GuideLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Bleed zone: returns bleed dimensions and document size in pixels.
 * The bleed zone is the area outside the document edges (3mm each side).
 */
export function calcBleedGuides(format: FormatDefinition): {
  bleedPx: number;
  docWidthPx: number;
  docHeightPx: number;
} {
  return {
    bleedPx: mmToPx(format.bleedMm),
    docWidthPx: mmToPx(format.widthMm),
    docHeightPx: mmToPx(format.heightMm),
  };
}

/**
 * Margin guides: returns inset positions from document edges in pixels.
 * Default margins: 10mm all sides (configurable in Phase 2).
 */
export function calcMarginGuides(
  format: FormatDefinition,
  marginMm = { top: 10, right: 10, bottom: 10, left: 10 }
): { top: number; right: number; bottom: number; left: number } {
  const docW = mmToPx(format.widthMm);
  const docH = mmToPx(format.heightMm);
  return {
    top: mmToPx(marginMm.top),
    right: docW - mmToPx(marginMm.right),
    bottom: docH - mmToPx(marginMm.bottom),
    left: mmToPx(marginMm.left),
  };
}

/**
 * Fold line positions for bifold/trifold formats.
 * Bifold (pages=2): one vertical fold at center.
 * Trifold (pages=3): two vertical folds at 1/3 and 2/3.
 * Returns empty array when format.pages <= 1.
 */
export function calcFoldGuides(format: FormatDefinition): GuideLine[] {
  const docW = mmToPx(format.widthMm);
  const docH = mmToPx(format.heightMm);
  if (format.pages <= 1) return [];
  const lines: GuideLine[] = [];
  for (let i = 1; i < format.pages; i++) {
    const x = (docW / format.pages) * i;
    lines.push({ x1: x, y1: 0, x2: x, y2: docH });
  }
  return lines;
}
