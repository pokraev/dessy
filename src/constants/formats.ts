import { mmToPx } from '@/lib/units';

export interface FormatDefinition {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  pages: number;
  label: string;
}

export const FORMATS: Record<string, FormatDefinition> = {
  A4:      { widthMm: 210, heightMm: 297, bleedMm: 3, pages: 1, label: 'A4 Single' },
  A5:      { widthMm: 148, heightMm: 210, bleedMm: 3, pages: 1, label: 'A5' },
  DL:      { widthMm: 99,  heightMm: 210, bleedMm: 3, pages: 1, label: 'DL' },
  bifold:  { widthMm: 420, heightMm: 297, bleedMm: 3, pages: 2, label: 'A4 Bifold' },
  trifold: { widthMm: 630, heightMm: 297, bleedMm: 3, pages: 3, label: 'A4 Trifold' },
} as const;

export function getFormatPixelDimensions(formatId: string, dpi?: number) {
  const fmt = FORMATS[formatId];
  if (!fmt) throw new Error(`Unknown format: ${formatId}`);
  return {
    widthPx: mmToPx(fmt.widthMm, dpi),
    heightPx: mmToPx(fmt.heightMm, dpi),
    bleedPx: mmToPx(fmt.bleedMm, dpi),
  };
}
