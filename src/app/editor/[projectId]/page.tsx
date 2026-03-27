'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { EditorLayout } from '@/components/editor/EditorLayout';
import { Header } from '@/components/editor/ui/Header';
import { BottomBar } from '@/components/editor/ui/BottomBar';
import { ToolBar } from '@/components/editor/panels/ToolBar';
import { PropertiesPanel } from '@/components/editor/panels/PropertiesPanel';
import { ToastProvider } from '@/components/ui/Toast';
import { CanvasArea } from '@/components/editor/CanvasArea';
import EditorCanvasClient from '@/components/editor/EditorCanvas.client';
import { useProjectStore } from '@/stores/projectStore';
import { loadProject } from '@/lib/storage/projectStorage';

export default function EditorPage() {
  const params = useParams();
  const projectId = typeof params.projectId === 'string' ? params.projectId : 'default';

  useEffect(() => {
    // Attempt to restore previously saved project from localStorage
    const saved = loadProject(projectId);
    if (saved) {
      useProjectStore.getState().setCurrentProject({
        meta: saved.meta,
        pages: (saved.pageData as { pages: never[]; currentPageIndex: number }).pages ?? [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
        currentPageIndex: (saved.pageData as { pages: never[]; currentPageIndex: number }).currentPageIndex ?? 0,
        brandColors: [],
      });
      // canvasJSON is passed via sessionStorage so EditorCanvasInner can load it after canvas init
      sessionStorage.setItem(`dessy-canvas-restore-${projectId}`, JSON.stringify(saved.canvasJSON));
    } else if (!useProjectStore.getState().currentProject) {
      useProjectStore.getState().setCurrentProject({
        meta: {
          id: projectId,
          name: 'Untitled Leaflet',
          format: 'A4',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        pages: [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
        currentPageIndex: 0,
        brandColors: [],
      });
    }
  }, [projectId]);

  return (
    <EditorLayout
      header={<Header />}
      leftPanel={<ToolBar />}
      canvas={
        <CanvasArea>
          <EditorCanvasClient projectId={projectId} formatId="A4" />
        </CanvasArea>
      }
      rightPanel={<PropertiesPanel />}
      bottomBar={<BottomBar />}
      toastProvider={<ToastProvider />}
    />
  );
}
