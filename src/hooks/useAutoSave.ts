
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { saveProject } from '@/lib/storage/projectStorage';
import { useProjectStore } from '@/stores/projectStore';
import { useBrandStore } from '@/stores/brandStore';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { saveThumbnail } from '@/lib/storage/thumbnailDb';

async function captureThumbnailForAutoSave(canvas: Canvas, projectId: string) {
  // Find the document background rect for crop bounds
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgRect = canvas.getObjects().find((o: any) => o._isDocBackground);
  const left = bgRect?.left ?? 0;
  const top = bgRect?.top ?? 0;
  const width = (bgRect?.width ?? 595) * (bgRect?.scaleX ?? 1);
  const height = (bgRect?.height ?? 842) * (bgRect?.scaleY ?? 1);

  // AligningGuidelines hooks into 'before:render' and tries to access an overlay context
  // that doesn't exist on the temp canvas created by toDataURL/toCanvasElement.
  // Temporarily remove the listener to prevent the crash.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listeners = (canvas as any).__eventListeners?.['before:render'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (listeners) (canvas as any).__eventListeners['before:render'] = [];
  try {
    const dataUrl = canvas.toDataURL({
      left, top, width, height,
      multiplier: 0.15,
      format: 'jpeg',
      quality: 0.6,
    });
    await saveThumbnail(projectId, dataUrl);
  } catch {
    // Thumbnail capture failure should not break auto-save
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (listeners) (canvas as any).__eventListeners['before:render'] = listeners;
  }
}

export function useAutoSave(canvas: Canvas | null, projectId: string) {
  useEffect(() => {
    if (!canvas) return;

    const interval = setInterval(() => {
      const { currentProject, isDirty } = useProjectStore.getState();
      if (!currentProject || !isDirty) return;

      const canvasJSON = canvas.toDatalessJSON([...CUSTOM_PROPS]);
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

        // Capture thumbnail after successful auto-save
        captureThumbnailForAutoSave(canvas, projectId);
      } else if (result.error === 'quota') {
        toast.error(i18n.t('canvas.storageFull'));
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [canvas, projectId]);
}
