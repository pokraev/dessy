export const SCREEN_DPI = 72;

export const mmToPx = (mm: number, dpi = SCREEN_DPI): number =>
  (mm * dpi) / 25.4;

export const pxToMm = (px: number, dpi = SCREEN_DPI): number =>
  (px * 25.4) / dpi;
