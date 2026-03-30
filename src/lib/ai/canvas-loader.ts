import type { Canvas, FabricObject } from 'fabric';
import type { GenerationResponse } from '@/types/generation';
import type { Page } from '@/types/project';
import { loadCanvasJSON } from '@/lib/fabric/load-canvas-json';
import { useProjectStore } from '@/stores/projectStore';
import { captureThumbnail } from '@/lib/thumbnails/capture';

const PLACEHOLDER_SRC = `${import.meta.env.BASE_URL}image-placeholder.svg`;

export function loadGeneratedLeaflet(
  response: GenerationResponse,
  canvas: Canvas,
  projectId: string
): void {
  const { pages, formatId, suggestedName } = response;
  if (!pages.length) throw new Error('No pages in generation response');

  // Build Page[] entries for projectStore
  // Each generated page gets a UUID, empty elements array (canvas manages objects), white background
  const projectPages: Page[] = pages.map(() => ({
    id: crypto.randomUUID(),
    elements: [],  // element tracking is via canvas objects, not this array (matches existing pattern)
    background: '#FFFFFF',
  }));

  // Store page canvasJSONs in sessionStorage keyed by page index
  // so that page switching can load them (same pattern as existing restore)
  pages.forEach((p, i) => {
    sessionStorage.setItem(
      `dessy-generated-page-${projectId}-${i}`,
      JSON.stringify(p.canvasJSON)
    );
  });

  // Update projectStore with new project structure
  const now = new Date().toISOString();
  useProjectStore.getState().setCurrentProject({
    meta: {
      id: projectId,
      name: suggestedName || 'AI Generated Leaflet',
      format: formatId as 'A4' | 'A5' | 'DL' | 'bifold' | 'trifold' | 'custom',
      createdAt: now,
      updatedAt: now,
    },
    pages: projectPages,
    currentPageIndex: 0,
    brandColors: useProjectStore.getState().currentProject?.brandColors ?? [],
    brandSwatches: useProjectStore.getState().currentProject?.brandSwatches ?? [],
    typographyPresets: useProjectStore.getState().currentProject?.typographyPresets ?? [],
  });

  // Load first page canvasJSON onto the active canvas
  const firstPageJSON = pages[0].canvasJSON;
  loadCanvasJSON(canvas, firstPageJSON).then(async () => {
    // Replace image placeholder rects with actual Image objects showing the placeholder SVG
    await replaceImagePlaceholders(canvas);
    canvas.renderAll();
    useProjectStore.getState().markDirty();
    // Capture thumbnail after a short delay to ensure all objects (including async SVG placeholders) are rendered
    setTimeout(() => {
      captureThumbnail(canvas, projectId, formatId as import('@/types/project').LeafletFormatId).catch(() => {});
    }, 500);
    // Notify PagesPanel to recapture thumbnail
    window.dispatchEvent(new Event('dessy-canvas-loaded'));
  });
}

async function replaceImagePlaceholders(canvas: Canvas) {
  const { FabricImage } = await import('fabric');
  const objects = canvas.getObjects() as (FabricObject & Record<string, unknown>)[];
  // After loadFromJSON, check both customType and imageId to find image placeholders
  const placeholders = objects.filter((o) => {
    const isRect = o.type === 'Rect' || o.type === 'rect';
    const isImageType = o.customType === 'image';
    const hasImageId = 'imageId' in o;
    return isRect && (isImageType || hasImageId);
  });

  for (const rect of placeholders) {
    try {
      const img = await FabricImage.fromURL(PLACEHOLDER_SRC);
      const w = (rect.width ?? 100) * (rect.scaleX ?? 1);
      const h = (rect.height ?? 100) * (rect.scaleY ?? 1);
      img.set({
        left: rect.left,
        top: rect.top,
        originX: 'left',
        originY: 'top',
        scaleX: w / (img.width || 1),
        scaleY: h / (img.height || 1),
      });
      Object.assign(img, {
        customType: 'image',
        name: rect.name || 'Image Placeholder',
        id: rect.id || crypto.randomUUID(),
        locked: rect.locked ?? false,
        visible: true,
        imageId: null,
        fitMode: rect.fitMode || 'fill',
      });
      const prev = canvas.renderOnAddRemove;
      canvas.renderOnAddRemove = false;
      canvas.insertAt(canvas.getObjects().indexOf(rect as FabricObject), img);
      canvas.remove(rect as FabricObject);
      canvas.renderOnAddRemove = prev;
    } catch (err) {
      console.warn('Failed to replace image placeholder:', err);
    }
  }
}
