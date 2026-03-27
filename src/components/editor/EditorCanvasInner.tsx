'use client';

import { useRef, useState, useCallback, useEffect, type RefCallback } from 'react';
import { useFabricCanvas } from '@/hooks/useFabricCanvas';
import { useElementCreation } from '@/hooks/useElementCreation';
import { useCanvasZoomPan } from '@/hooks/useCanvasZoomPan';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutoSave } from '@/hooks/useAutoSave';
import { createImageFrame, CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { saveProject } from '@/lib/storage/projectStorage';
import { exportProjectJSON, importProjectJSON } from '@/lib/fabric/serialization';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import GuidesOverlay from '@/components/editor/GuidesOverlay';
import { ContextMenu } from '@/components/editor/panels/ContextMenu';
import { KeyboardShortcutsModal } from '@/components/editor/ui/KeyboardShortcutsModal';
import toast from 'react-hot-toast';

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
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Mount Fabric.js canvas — canvasInstance becomes non-null once async init completes
  const { canvasRef, canvasInstance, historyRef } = useFabricCanvas(canvasEl, formatId);

  // Wire element creation and zoom/pan hooks — these re-run when canvasInstance becomes available
  useElementCreation(canvasInstance);
  useCanvasZoomPan(canvasInstance);

  // Wire keyboard shortcuts — passes history functions from historyRef
  useKeyboardShortcuts(canvasInstance, {
    undo: (canvas) => historyRef.current.undo(canvas),
    redo: (canvas) => historyRef.current.redo(canvas),
  });

  // Wire auto-save — runs every 30s when canvas is dirty
  useAutoSave(canvasInstance, projectId);

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

  // Register triggerSave and triggerExport callbacks in canvasStore so Header can call them
  useEffect(() => {
    const canvas = canvasInstance;
    if (!canvas) return;

    const triggerSave = () => {
      const { currentProject } = useProjectStore.getState();
      if (!currentProject) return;
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
    };

    const triggerExport = () => {
      const { currentProject } = useProjectStore.getState();
      if (!currentProject) return;
      exportProjectJSON(canvas, currentProject.meta);
      toast.success('Project exported');
    };

    const triggerImport = () => {
      importFileRef.current?.click();
    };

    useCanvasStore.getState().setPersistFns(triggerSave, triggerExport, triggerImport);

    return () => {
      useCanvasStore.getState().setPersistFns(() => {}, () => {}, () => {});
    };
  }, [canvasInstance, projectId]);

  // Restore canvas from sessionStorage on first canvas mount (set by EditorPage on load)
  useEffect(() => {
    const canvas = canvasInstance;
    if (!canvas) return;

    const stored = sessionStorage.getItem(`dessy-canvas-restore-${projectId}`);
    if (!stored) return;

    sessionStorage.removeItem(`dessy-canvas-restore-${projectId}`);
    try {
      const canvasJSON = JSON.parse(stored);
      canvas.loadFromJSON(canvasJSON).then(() => {
        canvas.renderAll();
        setHasElements(canvas.getObjects().length > 0);
      });
    } catch {
      // Ignore corrupt restore data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasInstance]);

  // Suppress unused warning for canvasRef — used by future canvas-dependent features
  void canvasRef;

  // Hidden file input ref for JSON import
  const importFileRef = useRef<HTMLInputElement | null>(null);

  // Handle JSON import from file
  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !canvasInstance) return;
      // Reset input so same file can be re-selected
      e.target.value = '';
      try {
        const meta = await importProjectJSON(canvasInstance, file);
        useProjectStore.getState().setCurrentProject({
          meta,
          pages: useProjectStore.getState().currentProject?.pages ?? [{ id: crypto.randomUUID(), elements: [], background: '#FFFFFF' }],
          currentPageIndex: 0,
          brandColors: [],
        });
        setHasElements(canvasInstance.getObjects().length > 0);
        toast.success('Project loaded');
      } catch {
        toast.error('Could not load project. Make sure the file is a valid Leaflet Factory JSON.');
      }
    },
    [canvasInstance]
  );

  // Handle image file drops onto the canvas
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const canvas = canvasInstance;
      if (!canvas) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (!files.length) return;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          if (!dataUrl) return;

          // Determine drop position relative to canvas
          const canvasEl = canvas.getElement();
          const rect = canvasEl.getBoundingClientRect();
          const dropX = e.clientX - rect.left;
          const dropY = e.clientY - rect.top;

          // Create image frame placeholder at drop position
          const frame = createImageFrame({
            left: dropX - 100,
            top: dropY - 75,
            width: 200,
            height: 150,
          });

          // Load image into frame using FabricImage.fromURL
          const { FabricImage } = await import('fabric');
          FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' }).then((img) => {
            // Scale image to fit within the frame
            const scaleX = 200 / (img.width ?? 200);
            const scaleY = 150 / (img.height ?? 150);
            const scale = Math.min(scaleX, scaleY);
            img.set({
              left: dropX - 100,
              top: dropY - 75,
              scaleX: scale,
              scaleY: scale,
              originX: 'left',
              originY: 'top',
            });

            // Replace frame placeholder with actual image
            canvas.remove(frame as Parameters<typeof canvas.add>[0]);
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();
          });

          canvas.add(frame as Parameters<typeof canvas.add>[0]);
          canvas.requestRenderAll();
        };
        reader.readAsDataURL(file);
      });
    },
    [canvasInstance]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Prevent default browser context menu on the canvas area
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={handleContextMenu}
    >
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
          Your canvas is ready &mdash; select a tool to start designing
        </div>
      )}

      {/* Right-click context menu — mounted here to access canvas instance */}
      <ContextMenu canvas={canvasInstance} />

      {/* Keyboard shortcuts overlay modal — reads state from editorStore */}
      <KeyboardShortcutsModal />
    </div>
  );
}
