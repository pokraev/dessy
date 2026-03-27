'use client';

import { useEffect } from 'react';
import type { Canvas } from 'fabric';
import { saveProject } from '@/lib/storage/projectStorage';
import { useProjectStore } from '@/stores/projectStore';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import toast from 'react-hot-toast';

export function useAutoSave(canvas: Canvas | null, projectId: string) {
  useEffect(() => {
    if (!canvas) return;

    const interval = setInterval(() => {
      const { currentProject, isDirty } = useProjectStore.getState();
      if (!currentProject || !isDirty) return;

      const canvasJSON = canvas.toDatalessJSON([...CUSTOM_PROPS]);
      const result = saveProject(projectId, {
        meta: currentProject.meta,
        canvasJSON,
        pageData: { pages: currentProject.pages, currentPageIndex: currentProject.currentPageIndex },
      });

      if (result.success) {
        useProjectStore.getState().setLastSaved(new Date());
        toast.success('Project saved');
      } else if (result.error === 'quota') {
        toast.error('Storage full. Export your project to free up space.');
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [canvas, projectId]);
}
