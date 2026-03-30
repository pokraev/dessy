import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { EditorLayout } from '@/components/editor/EditorLayout';
import { Header } from '@/components/editor/ui/Header';
import { BottomBar } from '@/components/editor/ui/BottomBar';
import { LeftPanel } from '@/components/editor/panels/LeftPanel';
import { PropertiesPanel } from '@/components/editor/panels/PropertiesPanel';
import { ToastProvider } from '@/components/ui/Toast';
import { CanvasArea } from '@/components/editor/CanvasArea';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useBrandStore } from '@/stores/brandStore';
import { loadProject } from '@/lib/storage/projectStorage';
import { ensureFormatPageCount } from '@/lib/pages/page-crud';
import { useAppStore } from '@/stores/appStore';
import { Dashboard } from '@/components/dashboard/Dashboard';
import type { LeafletFormatId } from '@/types/project';

import EditorCanvasInner from '@/components/editor/EditorCanvasInner';

const DEFAULT_TYPOGRAPHY_PRESETS = [
  { id: 'preset-headline', name: 'Headline', fontFamily: 'Inter', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0, color: '#000000' },
  { id: 'preset-subhead', name: 'Subhead', fontFamily: 'Inter', fontSize: 22, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0, color: '#333333' },
  { id: 'preset-body', name: 'Body', fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0, color: '#333333' },
  { id: 'preset-caption', name: 'Caption', fontFamily: 'Inter', fontSize: 11, fontWeight: 400, lineHeight: 1.4, letterSpacing: 20, color: '#666666' },
  { id: 'preset-cta', name: 'CTA', fontFamily: 'Inter', fontSize: 16, fontWeight: 700, lineHeight: 1.2, letterSpacing: 40, color: '#6366f1' },
];


function EditorRoot({ projectId }: { projectId: string }) {
  const [formatId, setFormatId] = useState<LeafletFormatId>('A4');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadProject(projectId);
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
      sessionStorage.setItem(`dessy-canvas-restore-${projectId}`, JSON.stringify(saved.canvasJSON));
      setFormatId(saved.meta.format);

      // Restore brand data if saved
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const brandData = (saved as any).brandData;
      if (brandData) {
        if (brandData.brandColors) useBrandStore.getState().setBrandColors(brandData.brandColors);
        if (brandData.typographyPresets) useBrandStore.getState().setTypographyPresets(brandData.typographyPresets);
      } else {
        useBrandStore.getState().setBrandColors(ensured.brandSwatches ?? []);
      }
    } else if (!useProjectStore.getState().currentProject) {
      const baseProject = {
        meta: {
          id: projectId,
          name: i18n.t('app.untitledLeaflet'),
          format: 'A4' as LeafletFormatId,
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

    if (useBrandStore.getState().typographyPresets.length === 0) {
      useBrandStore.getState().setTypographyPresets(DEFAULT_TYPOGRAPHY_PRESETS);
    }

    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const busyMessage = useCanvasStore((s) => s.busyMessage);

  useEffect(() => {
    if (!busyMessage) return;

    const timer = setTimeout(() => {
      useCanvasStore.setState({ busyMessage: null });
    }, 30_000);

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        useCanvasStore.setState({ busyMessage: null });
      }
    }
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [busyMessage]);

  if (!ready) return null;

  return (
    <>
    {busyMessage && (
      <div className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center pointer-events-auto">
        <div className="bg-surface-raised border border-border rounded-xl px-8 py-6 flex items-center gap-3 shadow-2xl">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-text-primary text-sm font-sans">
            {busyMessage}
          </span>
        </div>
      </div>
    )}
    <EditorLayout
      header={<Header />}
      leftPanel={<LeftPanel />}
      canvas={
        <CanvasArea>
          <EditorCanvasInner projectId={projectId} formatId={formatId} />
        </CanvasArea>
      }
      rightPanel={<PropertiesPanel />}
      bottomBar={<BottomBar />}
      toastProvider={<ToastProvider />}
    />
    </>
  );
}

export default function App() {
  const currentView = useAppStore((s) => s.currentView);
  const activeProjectId = useAppStore((s) => s.activeProjectId);

  if (currentView === 'dashboard') {
    return <Dashboard />;
  }

  // Editor view — activeProjectId is guaranteed non-null when view is 'editor'
  return <EditorRoot projectId={activeProjectId!} />;
}
