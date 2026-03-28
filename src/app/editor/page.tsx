'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

function EditorInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id') ?? 'default';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadProject(projectId);
    if (saved) {
      useProjectStore.getState().setCurrentProject({
        meta: saved.meta,
        pages: (saved.pageData as { pages: never[]; currentPageIndex: number }).pages ?? [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
        currentPageIndex: (saved.pageData as { pages: never[]; currentPageIndex: number }).currentPageIndex ?? 0,
        brandColors: [],
      });
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
    setReady(true);
  }, [projectId]);

  if (!ready) return null;

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

export default function EditorPage() {
  return (
    <Suspense>
      <EditorInner />
    </Suspense>
  );
}
