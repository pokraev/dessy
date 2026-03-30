
import { useRef, useCallback, useEffect } from 'react';
import type { Canvas } from 'fabric';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { loadCanvasJSON } from '@/lib/fabric/load-canvas-json';
import { saveProject } from '@/lib/storage/projectStorage';
import { exportProjectJSON, importProjectJSON } from '@/lib/fabric/serialization';
import { loadGeneratedLeaflet } from '@/lib/ai/canvas-loader';
import { captureThumbnail } from '@/lib/thumbnails/capture';
import type { GenerationResponse } from '@/types/generation';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useBrandStore } from '@/stores/brandStore';

/**
 * Centralises all project save / export / import / restore logic.
 *
 * Registers `triggerSave`, `triggerExport`, `triggerImport`, and
 * `triggerLoadGenerated` callbacks on the canvas store so that the
 * Header and other consumers can invoke them.
 *
 * Also handles restoring canvas state from sessionStorage on mount
 * and wrapping `triggerSave` with thumbnail capture (previously in App.tsx).
 */
export function useProjectIO(
  canvas: Canvas | null,
  projectId: string,
  formatId: string,
  onHasElements?: (has: boolean) => void,
): {
  importFileRef: React.RefObject<HTMLInputElement | null>;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
} {
  const importFileRef = useRef<HTMLInputElement | null>(null);

  // Register persist / export / import / load-generated callbacks on canvasStore
  useEffect(() => {
    if (!canvas) return;

    const triggerSave = () => {
      const { currentProject } = useProjectStore.getState();
      if (!currentProject) return;
      const canvasJSON = canvas.toObject([...CUSTOM_PROPS]);
      const brandState = useBrandStore.getState();
      const result = saveProject(projectId, {
        meta: currentProject.meta,
        canvasJSON,
        pageData: { pages: currentProject.pages, currentPageIndex: currentProject.currentPageIndex },
        brandData: {
          brandColors: brandState.brandColors,
          typographyPresets: brandState.typographyPresets,
          recentColors: brandState.recentColors,
        },
      });
      if (result.success) {
        useProjectStore.getState().setLastSaved(new Date());
        toast.success(i18n.t('canvas.projectSaved'));

        // Capture thumbnail after successful manual save
        captureThumbnail(canvas, projectId, formatId).catch(() => {
          // Thumbnail capture failure should not break manual save
        });
      } else if (result.error === 'quota') {
        toast.error(i18n.t('canvas.storageFull'));
      }
    };

    const triggerExport = () => {
      const { currentProject } = useProjectStore.getState();
      if (!currentProject) return;
      exportProjectJSON(canvas, currentProject.meta);
      toast.success(i18n.t('canvas.projectExported'));
    };

    const triggerImport = () => {
      importFileRef.current?.click();
    };

    useCanvasStore.getState().setPersistFns(triggerSave, triggerExport, triggerImport);
    useCanvasStore.getState().setCanvasRef(canvas);

    const triggerLoadGenerated = (response: GenerationResponse) => {
      loadGeneratedLeaflet(response, canvas, projectId);
    };
    useCanvasStore.getState().setLoadGeneratedFn(triggerLoadGenerated);

    return () => {
      useCanvasStore.getState().setPersistFns(() => {}, () => {}, () => {});
      useCanvasStore.getState().setCanvasRef(null);
      useCanvasStore.getState().setLoadGeneratedFn(null);
    };
  }, [canvas, projectId, formatId]);

  // Restore canvas from sessionStorage on first canvas mount
  useEffect(() => {
    if (!canvas) return;

    const stored = sessionStorage.getItem(`dessy-canvas-restore-${projectId}`);
    if (!stored) return;

    sessionStorage.removeItem(`dessy-canvas-restore-${projectId}`);

    try {
      const canvasJSON = JSON.parse(stored);
      // toJSON embeds image data as base64 — no stale blob URLs
      loadCanvasJSON(canvas, canvasJSON).then(() => {
        canvas.renderAll();
        onHasElements?.(canvas.getObjects().length > 0);
      }).catch((err) => { console.error('[RESTORE] loadFromJSON failed:', err); });
    } catch {
      // Ignore corrupt restore data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  // Handle JSON import from file
  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !canvas) return;
      // Reset input so same file can be re-selected
      e.target.value = '';
      try {
        const meta = await importProjectJSON(canvas, file);
        useProjectStore.getState().setCurrentProject({
          meta,
          pages: useProjectStore.getState().currentProject?.pages ?? [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
          currentPageIndex: 0,
          brandColors: [],
          brandSwatches: [],
          typographyPresets: [],
        });
        onHasElements?.(canvas.getObjects().length > 0);
        toast.success(i18n.t('canvas.projectLoaded'));
      } catch {
        toast.error(i18n.t('canvas.projectLoadError'));
      }
    },
    [canvas, onHasElements],
  );

  return { importFileRef, handleImportFile };
}
