import { mmToPx } from '@/lib/units';
import type { FormatDefinition } from '@/constants/formats';

export function getCanvasOptions(format: FormatDefinition) {
  const docWidthPx = mmToPx(format.widthMm);
  const docHeightPx = mmToPx(format.heightMm);
  const bleedPx = mmToPx(format.bleedMm);
  return {
    width: docWidthPx + bleedPx * 2,   // canvas includes bleed on all sides
    height: docHeightPx + bleedPx * 2,
    preserveObjectStacking: true,
    fireRightClick: true,
    stopContextMenu: true,
    selection: true,
    backgroundColor: '#FFFFFF',
  };
}

// Pasteboard dimensions — extra space around the document
export const PASTEBOARD_PADDING = 200; // px around document
