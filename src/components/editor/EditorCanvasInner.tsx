
import { useRef, useState, useCallback, useEffect, type RefCallback } from 'react';
import i18n from '@/i18n';
import { useFabricCanvas } from '@/hooks/useFabricCanvas';
import { useElementCreation } from '@/hooks/useElementCreation';
import { useCanvasZoomPan } from '@/hooks/useCanvasZoomPan';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutoSave } from '@/hooks/useAutoSave';
import { createImageFrame, CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { saveProject } from '@/lib/storage/projectStorage';
import { exportProjectJSON, importProjectJSON } from '@/lib/fabric/serialization';
import { loadGeneratedLeaflet } from '@/lib/ai/canvas-loader';
import type { GenerationResponse } from '@/types/generation';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useBrandStore } from '@/stores/brandStore';
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
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number; _t?: number } | null>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

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

  // Double-click on image placeholder — open file picker
  useEffect(() => {
    function onImageUpload() {
      imageUploadRef.current?.click();
    }
    window.addEventListener('dessy-image-upload', onImageUpload);
    return () => window.removeEventListener('dessy-image-upload', onImageUpload);
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvasInstance) return;

    const obj = canvasInstance.getActiveObject();
    if (!obj) return;

    useCanvasStore.getState().captureUndoState?.();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const { FabricImage } = await import('fabric');
    const img = await FabricImage.fromURL(dataUrl);
    const targetW = (obj.width ?? 100) * (obj.scaleX ?? 1);
    const targetH = (obj.height ?? 100) * (obj.scaleY ?? 1);
    img.set({
      left: obj.left, top: obj.top,
      originX: 'left', originY: 'top',
      scaleX: targetW / (img.width || 1),
      scaleY: targetH / (img.height || 1),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const custom = obj as any;
    Object.assign(img, {
      customType: 'image', name: custom.name || 'Image',
      id: custom.id || crypto.randomUUID(), locked: false,
      visible: true, imageId: 'uploaded', fitMode: custom.fitMode || 'fill',
    });
    const prev = canvasInstance.renderOnAddRemove;
    canvasInstance.renderOnAddRemove = false;
    const idx = canvasInstance.getObjects().indexOf(obj);
    canvasInstance.insertAt(idx, img as unknown as FabricObject);
    canvasInstance.remove(obj);
    canvasInstance.renderOnAddRemove = prev;
    canvasInstance.setActiveObject(img as unknown as FabricObject);
    canvasInstance.requestRenderAll();
    if (imageUploadRef.current) imageUploadRef.current.value = '';
  }, [canvasInstance]);

  // Register triggerSave and triggerExport callbacks in canvasStore so Header can call them
  useEffect(() => {
    const canvas = canvasInstance;
    if (!canvas) return;

    const triggerSave = () => {
      const { currentProject } = useProjectStore.getState();
      if (!currentProject) return;
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
    };

    const triggerExport = () => {
      const { currentProject } = useProjectStore.getState();
      if (!currentProject) return;
      exportProjectJSON(canvas, currentProject.meta);
      toast.success(i18n.t('canvas.projectExported'));
    };

    const triggerImport = () => {
      importFileRef.current?.click();
    };

    useCanvasStore.getState().setPersistFns(triggerSave, triggerExport, triggerImport);
    useCanvasStore.getState().setCanvasRef(canvas);

    const triggerLoadGenerated = (response: GenerationResponse) => {
      loadGeneratedLeaflet(response, canvas, projectId);
    };
    useCanvasStore.getState().setLoadGeneratedFn(triggerLoadGenerated);

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
      useCanvasStore.getState().setPersistFns(() => {}, () => {}, () => {});
      useCanvasStore.getState().setCanvasRef(null);
      useCanvasStore.getState().setLoadGeneratedFn(null);
      useCanvasStore.getState().setClearCanvasFn(null);
      useCanvasStore.getState().setSwitchPageFn(null);
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
      }).catch(() => { /* corrupt canvas data — keep default */ });
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
          brandSwatches: [],
          typographyPresets: [],
        });
        setHasElements(canvasInstance.getObjects().length > 0);
        toast.success(i18n.t('canvas.projectLoaded'));
      } catch {
        toast.error(i18n.t('canvas.projectLoadError'));
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
    setContextMenuPos({ x: e.clientX, y: e.clientY, _t: Date.now() });
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={handleContextMenu}
    >
      {/* Hidden file input for image upload — triggered by double-click on image placeholder */}
      <input
        ref={imageUploadRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
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
