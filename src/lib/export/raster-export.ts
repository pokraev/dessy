import { Canvas as FabricCanvas } from 'fabric';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import type { Canvas } from 'fabric';
import type { Page } from '@/types/project';
import type { FabricObjectWithCustom } from '@/types/fabric-custom';
import {
  collectAllPageData,
  DPI_MULTIPLIERS,
  type RasterFormat,
  type DpiOption,
  type PageExportData,
} from './export-utils';

/**
 * Render a single page's JSON onto a temporary off-screen Fabric canvas
 * and return a Blob of the rasterized output.
 */
export async function renderPageToBlob(
  pageData: PageExportData,
  docWidth: number,
  docHeight: number,
  format: RasterFormat,
  multiplier: number,
): Promise<Blob> {
  // Create a temporary off-screen canvas
  const tempHtmlCanvas = document.createElement('canvas');
  tempHtmlCanvas.width = docWidth;
  tempHtmlCanvas.height = docHeight;

  const tempCanvas = new FabricCanvas(tempHtmlCanvas, {
    width: docWidth,
    height: docHeight,
    renderOnAddRemove: false,
  });

  try {
    // Load page JSON into the temp canvas
    await tempCanvas.loadFromJSON(pageData.canvasJSON);

    // Strip before:render listeners to avoid AligningGuidelines crash.
    // The plugin hooks into before:render and tries to access an overlay context
    // that doesn't exist on temp canvases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listeners = (tempCanvas as any).__eventListeners?.['before:render'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (listeners) (tempCanvas as any).__eventListeners['before:render'] = [];

    tempCanvas.renderAll();

    // Find the document background rect to get exact document bounds
    const bgRect = tempCanvas.getObjects().find((o) => (o as FabricObjectWithCustom)._isDocBackground);
    const left = bgRect?.left ?? 0;
    const top = bgRect?.top ?? 0;
    const width = (bgRect?.width ?? docWidth) * (bgRect?.scaleX ?? 1);
    const height = (bgRect?.height ?? docHeight) * (bgRect?.scaleY ?? 1);

    // Render to an HTML canvas element with the DPI multiplier
    const outputCanvas = tempCanvas.toCanvasElement(multiplier, {
      left,
      top,
      width,
      height,
    });

    // Convert to Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('toBlob returned null'));
        },
        format === 'jpeg' ? 'image/jpeg' : 'image/png',
        format === 'jpeg' ? 0.92 : undefined,
      );
    });

    return blob;
  } finally {
    // Dispose the temp canvas to free resources
    tempCanvas.dispose();
  }
}

export interface RasterExportOptions {
  canvas: Canvas;
  projectId: string;
  pages: Page[];
  currentPageIndex: number;
  /** Document width in 72-DPI pixels */
  docWidth: number;
  /** Document height in 72-DPI pixels */
  docHeight: number;
  format: RasterFormat;
  dpi: DpiOption;
  projectName: string;
}

/**
 * Export all pages as raster images (PNG or JPEG).
 *
 * - Single page: downloads the image file directly via file-saver.
 * - Multi-page: bundles all images into a ZIP archive.
 */
export async function exportRasterPages(opts: RasterExportOptions): Promise<void> {
  const {
    canvas,
    projectId,
    pages,
    currentPageIndex,
    docWidth,
    docHeight,
    format,
    dpi,
    projectName,
  } = opts;

  const multiplier = DPI_MULTIPLIERS[dpi] ?? 1;
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const allPageData = collectAllPageData(canvas, projectId, pages, currentPageIndex);

  if (allPageData.length === 1) {
    // Single page: direct download
    const blob = await renderPageToBlob(allPageData[0], docWidth, docHeight, format, multiplier);
    saveAs(blob, `${projectName}.${ext}`);
  } else {
    // Multi-page: bundle into ZIP
    const zip = new JSZip();

    for (let i = 0; i < allPageData.length; i++) {
      const blob = await renderPageToBlob(allPageData[i], docWidth, docHeight, format, multiplier);
      const pageName = `${projectName}_page${i + 1}.${ext}`;
      zip.file(pageName, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${projectName}_${format.toUpperCase()}_${dpi}dpi.zip`);
  }
}
