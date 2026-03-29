import { useEffect, useState, lazy, Suspense } from 'react';
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
import { saveThumbnail } from '@/lib/storage/thumbnailDb';
import { useAppStore } from '@/stores/appStore';
import { Dashboard } from '@/components/dashboard/Dashboard';
import type { LeafletFormatId } from '@/types/project';

const EditorCanvasInner = lazy(() => import('@/components/editor/EditorCanvasInner'));

const DEFAULT_TYPOGRAPHY_PRESETS = [
  { id: 'preset-headline', name: 'Headline', fontFamily: 'Inter', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0, color: '#000000' },
  { id: 'preset-subhead', name: 'Subhead', fontFamily: 'Inter', fontSize: 22, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0, color: '#333333' },
  { id: 'preset-body', name: 'Body', fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0, color: '#333333' },
  { id: 'preset-caption', name: 'Caption', fontFamily: 'Inter', fontSize: 11, fontWeight: 400, lineHeight: 1.4, letterSpacing: 20, color: '#666666' },
  { id: 'preset-cta', name: 'CTA', fontFamily: 'Inter', fontSize: 16, fontWeight: 700, lineHeight: 1.2, letterSpacing: 40, color: '#6366f1' },
];

export async function captureThumbnail(projectId: string) {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;

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
  let dataUrl: string;
  try {
    dataUrl = canvas.toDataURL({
      left, top, width, height,
      multiplier: 0.15,
      format: 'jpeg',
      quality: 0.6,
    });
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (listeners) (canvas as any).__eventListeners['before:render'] = listeners;
  }

  await saveThumbnail(projectId, dataUrl);
}

function CanvasLoading() {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-bg flex items-center justify-center">
      <p className="text-text-secondary text-[13px]">{t('app.loadingCanvas')}</p>
    </div>
  );
}

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

    // Subscribe to triggerSave being set by EditorCanvasInner and wrap it with thumbnail capture
    const unsubscribe = useCanvasStore.subscribe((state, prevState) => {
      if (state.triggerSave !== prevState.triggerSave && state.triggerSave) {
        const originalTriggerSave = state.triggerSave;
        useCanvasStore.setState({
          triggerSave: () => {
            originalTriggerSave();
            captureThumbnail(projectId).catch(() => {
              // Thumbnail capture failure should not break manual save
            });
          },
        });
        unsubscribe();
      }
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const busyMessage = useCanvasStore((s) => s.busyMessage);

  if (!ready) return null;

  return (
    <>
    {busyMessage && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'all',
        }}
      >
        <div style={{
          background: '#1e1e1e',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #6366f1',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: '#f5f5f5', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
            {busyMessage}
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )}
    <EditorLayout
      header={<Header />}
      leftPanel={<LeftPanel />}
      canvas={
        <CanvasArea>
          <Suspense fallback={<CanvasLoading />}>
            <EditorCanvasInner projectId={projectId} formatId={formatId} />
          </Suspense>
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
