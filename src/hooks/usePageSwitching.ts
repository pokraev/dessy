
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import i18n from '@/i18n';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';

export function usePageSwitching(
  canvas: Canvas | null,
  projectId: string
): void {
  useEffect(() => {
    if (!canvas) return;

    const triggerClearCanvas = () => {
      // Remove all objects from canvas
      canvas.clear();
      // Reset project to single empty page
      const now = new Date().toISOString();
      useProjectStore.getState().setCurrentProject({
        meta: {
          id: projectId,
          name: i18n.t('app.untitledLeaflet'),
          format: 'A4',
          createdAt: now,
          updatedAt: now,
        },
        pages: [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
        currentPageIndex: 0,
        brandColors: [],
        brandSwatches: [],
        typographyPresets: [],
      });
      // Clear any generated page data from sessionStorage
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(`dessy-generated-page-${projectId}`)) {
          sessionStorage.removeItem(key);
        }
      }
      canvas.renderAll();
    };
    useCanvasStore.getState().setClearCanvasFn(triggerClearCanvas);

    const triggerSwitchPage = (pageIndex: number) => {
      const project = useProjectStore.getState().currentProject;
      if (!project || pageIndex < 0 || pageIndex >= project.pages.length) return;
      const currentIdx = project.currentPageIndex;
      if (pageIndex === currentIdx) return;

      // Save current page canvas JSON to sessionStorage
      const currentJSON = canvas.toDatalessJSON([...CUSTOM_PROPS]);
      sessionStorage.setItem(
        `dessy-generated-page-${projectId}-${currentIdx}`,
        JSON.stringify(currentJSON)
      );

      // Update page index in store
      useProjectStore.getState().setCurrentPageIndex(pageIndex);

      // Load target page from sessionStorage
      const targetKey = `dessy-generated-page-${projectId}-${pageIndex}`;
      const stored = sessionStorage.getItem(targetKey);
      if (stored) {
        try {
          const json = JSON.parse(stored);
          canvas.loadFromJSON(json).then(() => {
            canvas.renderAll();
          }).catch(() => {
            canvas.clear();
            canvas.renderAll();
          });
        } catch {
          canvas.clear();
          canvas.renderAll();
        }
      } else {
        canvas.clear();
        canvas.renderAll();
      }
    };
    useCanvasStore.getState().setSwitchPageFn(triggerSwitchPage);

    return () => {
      useCanvasStore.getState().setClearCanvasFn(null);
      useCanvasStore.getState().setSwitchPageFn(null);
    };
  }, [canvas, projectId]);
}
