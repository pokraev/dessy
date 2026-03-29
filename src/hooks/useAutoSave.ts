
import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { saveProject } from '@/lib/storage/projectStorage';
import { useProjectStore } from '@/stores/projectStore';
import { useBrandStore } from '@/stores/brandStore';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';

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
      } else if (result.error === 'quota') {
        toast.error(i18n.t('canvas.storageFull'));
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [canvas, projectId]);
}
