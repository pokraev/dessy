'use client';

import { useEffect, useState } from 'react';
import { EditorLayout } from '@/components/editor/EditorLayout';
import { Header } from '@/components/editor/ui/Header';
import { BottomBar } from '@/components/editor/ui/BottomBar';
import { LeftPanel } from '@/components/editor/panels/LeftPanel';
import { PropertiesPanel } from '@/components/editor/panels/PropertiesPanel';
import { ToastProvider } from '@/components/ui/Toast';
import { CanvasArea } from '@/components/editor/CanvasArea';
import EditorCanvasClient from '@/components/editor/EditorCanvas.client';
import { useProjectStore } from '@/stores/projectStore';
import { loadProject } from '@/lib/storage/projectStorage';

export default function EditorPage() {
  // Read project ID from URL query param (no useSearchParams to avoid Suspense)
  const [projectId, setProjectId] = useState('default');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') ?? 'default';
    setProjectId(id);

    const saved = loadProject(id);
    if (saved) {
      useProjectStore.getState().setCurrentProject({
        meta: saved.meta,
        pages: (saved.pageData as { pages: never[]; currentPageIndex: number }).pages ?? [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
        currentPageIndex: (saved.pageData as { pages: never[]; currentPageIndex: number }).currentPageIndex ?? 0,
        brandColors: [],
        brandSwatches: [],
        typographyPresets: [],
      });
      sessionStorage.setItem(`dessy-canvas-restore-${id}`, JSON.stringify(saved.canvasJSON));
    } else if (!useProjectStore.getState().currentProject) {
      useProjectStore.getState().setCurrentProject({
        meta: {
          id,
          name: 'Untitled Leaflet',
          format: 'A4',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        pages: [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
        currentPageIndex: 0,
        brandColors: [],
        brandSwatches: [],
        typographyPresets: [],
      });
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <EditorLayout
      header={<Header />}
      leftPanel={<LeftPanel />}
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
