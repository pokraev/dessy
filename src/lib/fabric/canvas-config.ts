import { mmToPx } from '@/lib/units';
import type { FormatDefinition } from '@/constants/formats';

/**
 * Returns Fabric.js canvas constructor options.
 * The canvas fills the viewport — the white document is drawn as a Rect inside.
 * Pass containerWidth/Height so the canvas matches its parent element.
 */
export function getCanvasOptions(
  _format: FormatDefinition,
  containerWidth: number,
  containerHeight: number
) {
  return {
    width: containerWidth,
    height: containerHeight,
    preserveObjectStacking: true,
    fireRightClick: true,
    stopContextMenu: true,
    perPixelTargetFind: true,
    selection: true,
    backgroundColor: '#1a1a1a', // pasteboard color (dark)
  };
}

/**
 * Get document dimensions in pixels (including bleed).
 */
export function getDocDimensions(format: FormatDefinition) {
  const docWidthPx = mmToPx(format.widthMm);
  const docHeightPx = mmToPx(format.heightMm);
  const bleedPx = mmToPx(format.bleedMm);
  return {
    width: docWidthPx + bleedPx * 2,
    height: docHeightPx + bleedPx * 2,
    bleedPx,
    docWidthPx,
    docHeightPx,
  };
}

// Pasteboard dimensions — extra space around the document
export const PASTEBOARD_PADDING = 200; // px around document
