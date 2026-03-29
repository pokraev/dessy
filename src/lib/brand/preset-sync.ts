import type { Canvas } from 'fabric';

interface PresetProperties {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
}

/**
 * Propagate a typography preset change across the current canvas and all other pages in sessionStorage.
 */
export function propagatePresetChange(
  presetId: string,
  preset: PresetProperties,
  canvasRef: Canvas | null,
  projectId: string,
  currentPageIndex: number,
  totalPages: number
): void {
  // Step 1: Update current page canvas live
  if (canvasRef) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasRef.getObjects().forEach((obj: any) => {
      if (obj.presetId === presetId && obj.customType === 'text') {
        obj.set({
          fontFamily: preset.fontFamily,
          fontSize: preset.fontSize,
          fontWeight: preset.fontWeight,
          lineHeight: preset.lineHeight,
          charSpacing: preset.letterSpacing,
          fill: preset.color,
        });
      }
    });
    canvasRef.renderAll();
  }

  // Step 2: Update other pages in sessionStorage
  for (let i = 0; i < totalPages; i++) {
    if (i === currentPageIndex) continue;
    const key = `dessy-generated-page-${projectId}-${i}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) continue;
    try {
      const json = JSON.parse(stored);
      let changed = false;
      (json.objects ?? []).forEach((obj: Record<string, unknown>) => {
        if (obj.presetId === presetId && obj.customType === 'text') {
          obj.fontFamily = preset.fontFamily;
          obj.fontSize = preset.fontSize;
          obj.fontWeight = preset.fontWeight;
          obj.lineHeight = preset.lineHeight;
          obj.charSpacing = preset.letterSpacing;
          obj.fill = preset.color;
          changed = true;
        }
      });
      if (changed) {
        sessionStorage.setItem(key, JSON.stringify(json));
      }
    } catch { /* ignore */ }
  }
}
