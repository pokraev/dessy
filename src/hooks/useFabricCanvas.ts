
import { useEffect, useRef, useState } from 'react';
import type { Canvas as FabricCanvas, FabricObject } from 'fabric';
import { getCanvasOptions, getDocDimensions } from '@/lib/fabric/canvas-config';
import { FORMATS } from '@/constants/formats';
import { useCanvasStore } from '@/stores/canvasStore';
import { createHistory } from '@/hooks/useHistory';

export function useFabricCanvas(
  canvasEl: HTMLCanvasElement | null,
  formatId: string
) {
  const canvasRef = useRef<FabricCanvas | null>(null);
  // canvasInstance is null until init completes — triggers re-renders so child hooks see the canvas
  const [canvasInstance, setCanvasInstance] = useState<FabricCanvas | null>(null);
  // Stable history object — created once, persists across re-renders
  const historyRef = useRef(createHistory());

  useEffect(() => {
    if (!canvasEl) return;

    // Dynamically import Fabric to keep it client-side only
    let isMounted = true;
    let canvas: FabricCanvas | null = null;

    async function initCanvas() {
      const { Canvas, Rect } = await import('fabric');
      if (!isMounted || !canvasEl) return;

      const format = FORMATS[formatId] ?? FORMATS['A4'];

      // Canvas fills the viewport container
      const container = canvasEl.parentElement;
      const containerWidth = container?.clientWidth ?? 800;
      const containerHeight = container?.clientHeight ?? 600;

      const options = getCanvasOptions(format, containerWidth, containerHeight);
      canvas = new Canvas(canvasEl, options);

      // Add white document rectangle as the first object (non-selectable background)
      // Position at (-bleedPx, -bleedPx) so the document area starts at (0,0)
      // matching the GuidesOverlay coordinate system
      const doc = getDocDimensions(format);
      const docRect = new Rect({
        left: -doc.bleedPx,
        top: -doc.bleedPx,
        width: doc.width,
        height: doc.height,
        fill: '#FFFFFF',
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
        excludeFromExport: false,
        hoverCursor: 'default',
      });
      (docRect as FabricObject & { _isDocBackground?: boolean })._isDocBackground = true;
      canvas.add(docRect);
      canvas.sendObjectToBack(docRect);


      // Auto-fit: zoom to show the document (without bleed) centered with padding
      const padFactor = 0.85;
      const zoomX = containerWidth / doc.docWidthPx;
      const zoomY = containerHeight / doc.docHeightPx;
      const fitZoom = Math.min(zoomX, zoomY) * padFactor;
      canvas.setZoom(fitZoom);

      // Center the document area in the viewport
      const { Point } = await import('fabric');
      const vpCenterX = containerWidth / 2;
      const vpCenterY = containerHeight / 2;
      const docCenterX = (doc.docWidthPx * fitZoom) / 2;
      const docCenterY = (doc.docHeightPx * fitZoom) / 2;
      canvas.relativePan(new Point(vpCenterX - docCenterX, vpCenterY - docCenterY));

      useCanvasStore.getState().setZoom(fitZoom);
      useCanvasStore.getState().setViewportTransform([...canvas.viewportTransform] as number[]);
      canvasRef.current = canvas;

      // Bind undo/redo history — must be before other event listeners
      historyRef.current.bindHistory(canvas);

      // Register canvas-bound undo/redo in canvasStore so Header buttons can call them
      const history = historyRef.current;
      useCanvasStore.getState().setHistoryFns(
        () => history.undo(canvas!),
        () => history.redo(canvas!),
        () => history.captureState(canvas!)
      );

      setCanvasInstance(canvas);

      // Bridge Fabric.js selection events to Zustand
      // Always use getActiveObjects() to get the full selection (not just e.selected which may be partial)
      function syncSelection() {
        const ids = canvas!.getActiveObjects().map((obj) => (obj as { id?: string }).id ?? '');
        useCanvasStore.getState().setSelection(ids);
      }

      canvas.on('selection:created', syncSelection);
      canvas.on('selection:updated', syncSelection);

      canvas.on('selection:cleared', () => {
        useCanvasStore.getState().setSelection([]);
      });

      // Double-click on image placeholder — trigger file upload
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.on('mouse:dblclick', (opt: any) => {
        const target = opt.target as FabricObject & { customType?: string } | undefined;
        if (target?.customType === 'image') {
          window.dispatchEvent(new CustomEvent('dessy-image-upload', { detail: { targetId: (target as FabricObject & { id?: string }).id } }));
        }
      });

      // Alt+click cycling — select the object below the current one
      canvas.on('mouse:down', (opt) => {
        const e = opt.e as MouseEvent;
        if (e.button !== 0 || !e.altKey) return;

        const point = canvas!.getScenePoint(e);
        const allAtPoint = canvas!.getObjects().filter((obj) => {
          const custom = obj as FabricObject & { _isDocBackground?: boolean };
          if (custom._isDocBackground) return false;
          return obj.containsPoint(point);
        });
        if (allAtPoint.length < 2) return;

        const current = canvas!.getActiveObject();
        const currentIdx = current ? allAtPoint.indexOf(current) : -1;
        // Cycle: go one below, wrap around to top
        const nextIdx = currentIdx <= 0 ? allAtPoint.length - 1 : currentIdx - 1;
        canvas!.setActiveObject(allAtPoint[nextIdx]);
        canvas!.requestRenderAll();
        e.preventDefault();
        e.stopPropagation();
      });

      // Fabric.js 7 built-in AligningGuidelines — handles move + scale snap properly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { AligningGuidelines } = await import('fabric-aligning-guidelines' as any);
      // Constructor already calls initBehavior() — don't call it again
      const guidelines = new AligningGuidelines(canvas, {
        margin: 6,
        color: '#ec4899',
        width: 1,
      });

      // Exclude document background rect from snap targets
      const origGetObjects = guidelines.getObjectsByTarget.bind(guidelines);
      guidelines.getObjectsByTarget = (target: FabricObject) => {
        const objects = origGetObjects(target);
        for (const obj of objects) {
          if ((obj as FabricObject & { _isDocBackground?: boolean })._isDocBackground) {
            objects.delete(obj);
          }
        }
        return objects;
      };
    }

    initCanvas();

    // Resize canvas when container changes size
    const container = canvasEl.parentElement;
    let resizeObserver: ResizeObserver | null = null;
    if (container) {
      resizeObserver = new ResizeObserver((entries) => {
        if (!canvas) return;
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          canvas.setDimensions({ width, height });
          canvas.requestRenderAll();
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver?.disconnect();
      isMounted = false;
      if (canvas) {
        canvas.off('selection:created');
        canvas.off('selection:updated');
        canvas.off('selection:cleared');
        canvas.off('mouse:down');
        canvas.dispose();
        canvasRef.current = null;
        setCanvasInstance(null);
      }
    };
  }, [canvasEl, formatId]);

  return { canvasRef, canvasInstance, historyRef };
}
