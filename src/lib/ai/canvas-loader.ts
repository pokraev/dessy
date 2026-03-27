import type { Canvas } from 'fabric';
import type { GenerationResponse } from '@/types/generation';
import type { Page } from '@/types/project';
import { useProjectStore } from '@/stores/projectStore';

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
  });

  // Load first page canvasJSON onto the active canvas
  const firstPageJSON = pages[0].canvasJSON;
  canvas.loadFromJSON(firstPageJSON).then(() => {
    canvas.renderAll();
    useProjectStore.getState().markDirty();
  });
}
