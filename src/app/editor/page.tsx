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
import { useBrandStore } from '@/stores/brandStore';
import { loadProject } from '@/lib/storage/projectStorage';
import { ensureFormatPageCount } from '@/lib/pages/page-crud';
import type { LeafletFormatId } from '@/types/project';

const DEFAULT_TYPOGRAPHY_PRESETS = [
  { id: 'preset-headline', name: 'Headline', fontFamily: 'Inter', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0, color: '#000000' },
  { id: 'preset-subhead', name: 'Subhead', fontFamily: 'Inter', fontSize: 22, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0, color: '#333333' },
  { id: 'preset-body', name: 'Body', fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0, color: '#333333' },
  { id: 'preset-caption', name: 'Caption', fontFamily: 'Inter', fontSize: 11, fontWeight: 400, lineHeight: 1.4, letterSpacing: 20, color: '#666666' },
  { id: 'preset-cta', name: 'CTA', fontFamily: 'Inter', fontSize: 16, fontWeight: 700, lineHeight: 1.2, letterSpacing: 40, color: '#6366f1' },
];

export default function EditorPage() {
  // Read project ID from URL query param (no useSearchParams to avoid Suspense)
  const [projectId, setProjectId] = useState('default');
  const [formatId, setFormatId] = useState<LeafletFormatId>('A4');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') ?? 'default';
    const format = (params.get('format') ?? 'A4') as LeafletFormatId;
    setProjectId(id);
    setFormatId(format);

    const saved = loadProject(id);
    if (saved) {
      const baseProject = {
        meta: saved.meta,
        pages: (saved.pageData as { pages: never[]; currentPageIndex: number }).pages ?? [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
        currentPageIndex: (saved.pageData as { pages: never[]; currentPageIndex: number }).currentPageIndex ?? 0,
        brandColors: [],
        brandSwatches: (saved as unknown as { brandSwatches?: never[] }).brandSwatches ?? [],
        typographyPresets: [],
      };
      const ensured = ensureFormatPageCount(baseProject);
      useProjectStore.getState().setCurrentProject(ensured);
      sessionStorage.setItem(`dessy-canvas-restore-${id}`, JSON.stringify(saved.canvasJSON));

      // Sync brand swatches from project to brand store
      useBrandStore.getState().setBrandColors(ensured.brandSwatches ?? []);
    } else if (!useProjectStore.getState().currentProject) {
      const baseProject = {
        meta: {
          id,
          name: 'Untitled Leaflet',
          format,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        pages: [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
        currentPageIndex: 0,
        brandColors: [],
        brandSwatches: [],
        typographyPresets: [],
      };
      const ensured = ensureFormatPageCount(baseProject);
      useProjectStore.getState().setCurrentProject(ensured);
    }

    // Initialize default typography presets if none are loaded
    if (useBrandStore.getState().typographyPresets.length === 0) {
      useBrandStore.getState().setTypographyPresets(DEFAULT_TYPOGRAPHY_PRESETS);
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
          <EditorCanvasClient projectId={projectId} formatId={formatId} />
        </CanvasArea>
      }
      rightPanel={<PropertiesPanel />}
      bottomBar={<BottomBar />}
      toastProvider={<ToastProvider />}
    />
  );
}
