'use client';

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

      // Wait for layout to settle before measuring container
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!isMounted) return;

      const format = FORMATS[formatId] ?? FORMATS['A4'];

      // Canvas fills the viewport container
      const container = canvasEl.parentElement;
      const containerWidth = container?.clientWidth ?? 800;
      const containerHeight = container?.clientHeight ?? 600;
      const options = getCanvasOptions(format, containerWidth, containerHeight);

      canvas = new Canvas(canvasEl, options);

      // Add white document rectangle as the first object (non-selectable background)
      const doc = getDocDimensions(format);
      const docRect = new Rect({
        left: 0,
        top: 0,
        width: doc.width,
        height: doc.height,
        fill: '#FFFFFF',
        selectable: false,
        evented: false,
        excludeFromExport: false,
        hoverCursor: 'default',
      });
      (docRect as FabricObject & { _isDocBackground?: boolean })._isDocBackground = true;
      canvas.add(docRect);
      canvas.sendObjectToBack(docRect);

      // Auto-fit: zoom to show the document centered with padding
      const padFactor = 0.85;
      const zoomX = containerWidth / doc.width;
      const zoomY = containerHeight / doc.height;
      const fitZoom = Math.min(zoomX, zoomY) * padFactor;
      canvas.setZoom(fitZoom);

      // Center the document in the viewport
      const { Point } = await import('fabric');
      const vpCenterX = containerWidth / 2;
      const vpCenterY = containerHeight / 2;
      const docCenterX = (doc.width * fitZoom) / 2;
      const docCenterY = (doc.height * fitZoom) / 2;
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
        () => history.redo(canvas!)
      );

      setCanvasInstance(canvas);

      // Bridge Fabric.js selection events to Zustand
      canvas.on('selection:created', (e) => {
        const ids = (e.selected ?? []).map((obj) => (obj as { id?: string }).id ?? '');
        useCanvasStore.getState().setSelection(ids);
      });

      canvas.on('selection:updated', (e) => {
        const ids = (e.selected ?? []).map((obj) => (obj as { id?: string }).id ?? '');
        useCanvasStore.getState().setSelection(ids);
      });

      canvas.on('selection:cleared', () => {
        useCanvasStore.getState().setSelection([]);
      });

      // Track right-click context position using getScenePoint (not getPointer — removed in Fabric.js 7)
      canvas.on('mouse:down', (opt) => {
        if ((opt.e as MouseEvent).button === 2) {
          // Scene coordinates for context menu positioning
          const _point = canvas!.getScenePoint(opt.e as MouseEvent);
          void _point; // Available for future context menu use
        }
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

    return () => {
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
