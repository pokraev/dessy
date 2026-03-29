import type { Canvas } from 'fabric';

/**
 * Propagate a brand swatch color change across the current canvas and all other pages in sessionStorage.
 */
export function propagateSwatchChange(
  swatchId: string,
  newHex: string,
  canvasRef: Canvas | null,
  projectId: string,
  currentPageIndex: number,
  totalPages: number
): void {
  // Step 1: Update current page canvas live
  if (canvasRef) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasRef.getObjects().forEach((obj: any) => {
      if (obj.swatchId === swatchId) {
        obj.set({ fill: newHex });
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
        if (obj.swatchId === swatchId) {
          obj.fill = newHex;
          changed = true;
        }
      });
      if (changed) {
        sessionStorage.setItem(key, JSON.stringify(json));
      }
    } catch { /* ignore parse errors */ }
  }
}
