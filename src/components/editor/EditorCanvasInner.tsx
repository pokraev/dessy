
import { useState, useCallback, useEffect, type RefCallback } from 'react';
import i18n from '@/i18n';
import { useFabricCanvas } from '@/hooks/useFabricCanvas';
import { useElementCreation } from '@/hooks/useElementCreation';
import { useCanvasZoomPan } from '@/hooks/useCanvasZoomPan';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useProjectIO } from '@/hooks/useProjectIO';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import GuidesOverlay from '@/components/editor/GuidesOverlay';
import { ContextMenu } from '@/components/editor/panels/ContextMenu';
import { KeyboardShortcutsModal } from '@/components/editor/ui/KeyboardShortcutsModal';

interface EditorCanvasInnerProps {
  projectId: string;
  formatId: string;
}

export default function EditorCanvasInner({ projectId, formatId }: EditorCanvasInnerProps) {
  // Use state for the canvas element so that when the ref attaches, it triggers a re-render
  // and useFabricCanvas receives the actual element (not null)
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const canvasElRef: RefCallback<HTMLCanvasElement> = useCallback((el: HTMLCanvasElement | null) => {
    setCanvasEl(el);
  }, []);
  const [hasElements, setHasElements] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number; _t?: number } | null>(null);

  // Mount Fabric.js canvas — canvasInstance becomes non-null once async init completes
  const { canvasRef, canvasInstance, historyRef } = useFabricCanvas(canvasEl, formatId);

  // Image upload and drag-drop handling
  const {
    imageUploadRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleImageInputChange,
  } = useImageUpload(canvasInstance);

  // Wire element creation and zoom/pan hooks — these re-run when canvasInstance becomes available
  useElementCreation(canvasInstance);
  useCanvasZoomPan(canvasInstance);

  // Wire keyboard shortcuts — passes history functions from historyRef
  useKeyboardShortcuts(canvasInstance, {
    undo: (canvas) => historyRef.current.undo(canvas),
    redo: (canvas) => historyRef.current.redo(canvas),
    captureState: (canvas) => historyRef.current.captureState(canvas),
  });

  // Wire auto-save — runs every 30s when canvas is dirty
  useAutoSave(canvasInstance, projectId);

  // Wire project IO — save, export, import, restore, load-generated
  const { importFileRef, handleImportFile } = useProjectIO(
    canvasInstance, projectId, formatId, setHasElements,
  );

  // Mark project dirty on any canvas change; track first element for hint
  useEffect(() => {
    const canvas = canvasInstance;
    if (!canvas) return;

    const markDirty = () => useProjectStore.getState().markDirty();
    const onObjectAdded = () => { setHasElements(true); markDirty(); };
    canvas.on('object:added', onObjectAdded);
    canvas.on('object:modified', markDirty);
    canvas.on('object:removed', markDirty);
    return () => {
      canvas.off('object:added', onObjectAdded);
      canvas.off('object:modified', markDirty);
      canvas.off('object:removed', markDirty);
    };
  }, [canvasInstance]);

  // Register triggerClearCanvas and triggerSwitchPage callbacks in canvasStore
  useEffect(() => {
    const canvas = canvasInstance;
    if (!canvas) return;

    const triggerClearCanvas = () => {
      // Remove all objects from canvas
      canvas.clear();
      // Reset project to single empty page
      const now = new Date().toISOString();
      useProjectStore.getState().setCurrentProject({
        meta: {
          id: projectId,
          name: i18n.t('app.untitledLeaflet'),
          format: 'A4',
          createdAt: now,
          updatedAt: now,
        },
        pages: [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
        currentPageIndex: 0,
        brandColors: [],
        brandSwatches: [],
        typographyPresets: [],
      });
      // Clear any generated page data from sessionStorage
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(`dessy-generated-page-${projectId}`)) {
          sessionStorage.removeItem(key);
        }
      }
      canvas.renderAll();
    };
    useCanvasStore.getState().setClearCanvasFn(triggerClearCanvas);

    const triggerSwitchPage = (pageIndex: number) => {
      const project = useProjectStore.getState().currentProject;
      if (!project || pageIndex < 0 || pageIndex >= project.pages.length) return;
      const currentIdx = project.currentPageIndex;
      if (pageIndex === currentIdx) return;

      // Save current page canvas JSON to sessionStorage
      const currentJSON = canvas.toDatalessJSON([...CUSTOM_PROPS]);
      sessionStorage.setItem(
        `dessy-generated-page-${projectId}-${currentIdx}`,
        JSON.stringify(currentJSON)
      );

      // Update page index in store
      useProjectStore.getState().setCurrentPageIndex(pageIndex);

      // Load target page from sessionStorage
      const targetKey = `dessy-generated-page-${projectId}-${pageIndex}`;
      const stored = sessionStorage.getItem(targetKey);
      if (stored) {
        try {
          const json = JSON.parse(stored);
          canvas.loadFromJSON(json).then(() => {
            canvas.renderAll();
          }).catch(() => {
            canvas.clear();
            canvas.renderAll();
          });
        } catch {
          canvas.clear();
          canvas.renderAll();
        }
      } else {
        canvas.clear();
        canvas.renderAll();
      }
    };
    useCanvasStore.getState().setSwitchPageFn(triggerSwitchPage);

    return () => {
      useCanvasStore.getState().setClearCanvasFn(null);
      useCanvasStore.getState().setSwitchPageFn(null);
    };
  }, [canvasInstance, projectId]);

  // Suppress unused warning for canvasRef — used by future canvas-dependent features
  void canvasRef;

  // Prevent default browser context menu on the canvas area
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY, _t: Date.now() });
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onContextMenu={handleContextMenu}
    >
      {/* Hidden file input for image upload — triggered by double-click on image placeholder */}
      <input
        ref={imageUploadRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageInputChange}
      />
      {/* Hidden file input for JSON import — triggered via triggerImport callback */}
      <input
        ref={importFileRef}
        type="file"
        accept=".json,.dessy.json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {/* Canvas container — Fabric.js wraps the <canvas> in its own div */}
      <div className="absolute inset-0">
        <canvas ref={canvasElRef} />
      </div>
      <GuidesOverlay formatId={formatId} />

      {/* First-open hint — disappears after first element is placed */}
      {!hasElements && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            color: '#555555',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          {i18n.t('canvas.canvasReady')}
        </div>
      )}

      {/* Right-click context menu — mounted here to access canvas instance */}
      <ContextMenu canvas={canvasInstance} />

      {/* Keyboard shortcuts overlay modal — reads state from editorStore */}
      <KeyboardShortcutsModal />
    </div>
  );
}
