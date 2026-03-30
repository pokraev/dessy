
import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { saveProject } from '@/lib/storage/projectStorage';
import { useProjectStore } from '@/stores/projectStore';
import { useBrandStore } from '@/stores/brandStore';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { captureThumbnail } from '@/lib/thumbnails/capture';

export function useAutoSave(canvas: Canvas | null, projectId: string) {
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!canvas) return;

    const interval = setInterval(async () => {
      if (isSavingRef.current) return;

      const { currentProject, isDirty } = useProjectStore.getState();
      if (!currentProject || !isDirty) return;

      isSavingRef.current = true;
      try {
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

        // Capture thumbnail after successful auto-save
        captureThumbnail(canvas, projectId, currentProject.meta.format).catch(() => {});
      } else if (result.error === 'quota') {
        toast.error(i18n.t('canvas.storageFull'));
      }
      } finally {
        isSavingRef.current = false;
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [canvas, projectId]);
}
