'use client';

import { useEffect, useRef, useState } from 'react';
import type { Canvas as FabricCanvas, FabricObject } from 'fabric';
import { getCanvasOptions, getDocDimensions } from '@/lib/fabric/canvas-config';
import { FORMATS } from '@/constants/formats';
import { useCanvasStore } from '@/stores/canvasStore';
import { calcBleedGuides, calcMarginGuides } from '@/lib/fabric/guides';
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

      // ────────────────────────────────────────────────────────────
      // Snap alignment guides — manual implementation
      // fabric-guideline-plugin is incompatible with Fabric.js 7 (peer deps: fabric ^5.2.1)
      // so we implement snap directly via object:moving and mouse:up events.
      // Snap threshold: 6px (UI-SPEC Snap Guides section)
      // Guide color: #ec4899 magenta (UI-SPEC)
      // ────────────────────────────────────────────────────────────
      const SNAP_THRESHOLD = 6;
      const GUIDE_COLOR = '#ec4899';

      // Overlay lines drawn on the Fabric.js canvas during drag
      const snapLines: FabricObject[] = [];

      function clearSnapLines() {
        for (const line of snapLines) {
          canvas!.remove(line);
        }
        snapLines.length = 0;
      }

      async function drawSnapLine(
        x1: number, y1: number, x2: number, y2: number
      ) {
        const { Line } = await import('fabric');
        const line = new Line([x1, y1, x2, y2], {
          stroke: GUIDE_COLOR,
          strokeWidth: 1,
          selectable: false,
          evented: false,
          excludeFromExport: true,
          // Type assertion needed because Fabric.js 7 Line constructor
          // does not expose these custom fields in types
        });
        // Mark as snap line so we can identify and remove them
        (line as FabricObject & { _isSnapLine?: boolean })._isSnapLine = true;
        canvas!.add(line);
        snapLines.push(line);
      }

      canvas.on('object:moving', async (e) => {
        const obj = e.target;
        if (!obj) return;

        clearSnapLines();

        const objLeft = obj.left ?? 0;
        const objTop = obj.top ?? 0;
        const objRight = objLeft + (obj.width ?? 0) * (obj.scaleX ?? 1);
        const objBottom = objTop + (obj.height ?? 0) * (obj.scaleY ?? 1);
        const objCenterX = objLeft + ((obj.width ?? 0) * (obj.scaleX ?? 1)) / 2;
        const objCenterY = objTop + ((obj.height ?? 0) * (obj.scaleY ?? 1)) / 2;

        const canvasW = canvas!.width ?? 0;
        const canvasH = canvas!.height ?? 0;

        // Collect snap targets: page edges, page center, margin edges, bleed edges
        const vSnapTargets: number[] = [0, canvasW / 2, canvasW]; // vertical (x) positions
        const hSnapTargets: number[] = [0, canvasH / 2, canvasH]; // horizontal (y) positions

        // Add margin guide positions
        const bleedMargin = calcBleedGuides(format);
        const margins = calcMarginGuides(format);
        vSnapTargets.push(
          bleedMargin.bleedPx, bleedMargin.docWidthPx - bleedMargin.bleedPx,
          margins.left, margins.right
        );
        hSnapTargets.push(
          bleedMargin.bleedPx, bleedMargin.docHeightPx - bleedMargin.bleedPx,
          margins.top, margins.bottom
        );

        // Snap to other objects
        const objects = canvas!.getObjects().filter(
          (o) => o !== obj && !(o as FabricObject & { _isSnapLine?: boolean })._isSnapLine && !(o as FabricObject & { _isDocBackground?: boolean })._isDocBackground
        );
        for (const other of objects) {
          const oLeft = other.left ?? 0;
          const oTop = other.top ?? 0;
          const oRight = oLeft + (other.width ?? 0) * (other.scaleX ?? 1);
          const oBottom = oTop + (other.height ?? 0) * (other.scaleY ?? 1);
          const oCenterX = oLeft + ((other.width ?? 0) * (other.scaleX ?? 1)) / 2;
          const oCenterY = oTop + ((other.height ?? 0) * (other.scaleY ?? 1)) / 2;
          vSnapTargets.push(oLeft, oCenterX, oRight);
          hSnapTargets.push(oTop, oCenterY, oBottom);
        }

        let newLeft = objLeft;
        let newTop = objTop;
        const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
        const h = (obj.height ?? 0) * (obj.scaleY ?? 1);

        // Check vertical (x-axis) snaps — object left, center, right
        for (const target of vSnapTargets) {
          if (Math.abs(objLeft - target) < SNAP_THRESHOLD) {
            newLeft = target;
            await drawSnapLine(target, -canvasH, target, canvasH * 2);
            break;
          }
          if (Math.abs(objCenterX - target) < SNAP_THRESHOLD) {
            newLeft = target - w / 2;
            await drawSnapLine(target, -canvasH, target, canvasH * 2);
            break;
          }
          if (Math.abs(objRight - target) < SNAP_THRESHOLD) {
            newLeft = target - w;
            await drawSnapLine(target, -canvasH, target, canvasH * 2);
            break;
          }
        }

        // Check horizontal (y-axis) snaps — object top, center, bottom
        for (const target of hSnapTargets) {
          if (Math.abs(objTop - target) < SNAP_THRESHOLD) {
            newTop = target;
            await drawSnapLine(-canvasW, target, canvasW * 2, target);
            break;
          }
          if (Math.abs(objCenterY - target) < SNAP_THRESHOLD) {
            newTop = target - h / 2;
            await drawSnapLine(-canvasW, target, canvasW * 2, target);
            break;
          }
          if (Math.abs(objBottom - target) < SNAP_THRESHOLD) {
            newTop = target - h;
            await drawSnapLine(-canvasW, target, canvasW * 2, target);
            break;
          }
        }

        if (newLeft !== objLeft || newTop !== objTop) {
          obj.set({ left: newLeft, top: newTop });
          obj.setCoords();
        }
      });

      canvas.on('mouse:up', () => {
        clearSnapLines();
        canvas!.requestRenderAll();
      });
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
