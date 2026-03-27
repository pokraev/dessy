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

      // Pre-import Line class so drawSnapLine can be synchronous
      let FabricLine: typeof import('fabric').Line | null = null;
      import('fabric').then(m => { FabricLine = m.Line; });

      function drawSnapLine(
        x1: number, y1: number, x2: number, y2: number
      ) {
        if (!FabricLine) return;
        const line = new FabricLine([x1, y1, x2, y2], {
          stroke: GUIDE_COLOR,
          strokeWidth: 1 / (canvas!.getZoom()),
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        (line as FabricObject & { _isSnapLine?: boolean })._isSnapLine = true;
        canvas!.add(line);
        snapLines.push(line);
      }

      canvas.on('object:moving', (e) => {
        const obj = e.target;
        if (!obj) return;

        clearSnapLines();

        // Scale snap threshold by zoom so it feels consistent at any zoom level
        const snapThresh = SNAP_THRESHOLD / canvas!.getZoom();

        const objLeft = obj.left ?? 0;
        const objTop = obj.top ?? 0;
        const objRight = objLeft + (obj.width ?? 0) * (obj.scaleX ?? 1);
        const objBottom = objTop + (obj.height ?? 0) * (obj.scaleY ?? 1);
        const objCenterX = objLeft + ((obj.width ?? 0) * (obj.scaleX ?? 1)) / 2;
        const objCenterY = objTop + ((obj.height ?? 0) * (obj.scaleY ?? 1)) / 2;

        // Use document dimensions for snap targets (not viewport)
        const docDims = getDocDimensions(format);
        const docW = docDims.width;
        const docH = docDims.height;

        // Collect snap targets: document edges, document center, margin edges, bleed edges
        const vSnapTargets: number[] = [0, docW / 2, docW];
        const hSnapTargets: number[] = [0, docH / 2, docH];

        // Add margin guide positions
        const bleedMargin = calcBleedGuides(format);
        const margins = calcMarginGuides(format);
        vSnapTargets.push(
          bleedMargin.bleedPx, docW - bleedMargin.bleedPx,
          margins.left, margins.right
        );
        hSnapTargets.push(
          bleedMargin.bleedPx, docH - bleedMargin.bleedPx,
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

        // Find closest vertical (x-axis) snap across left, center, and right edges
        let bestVDist = snapThresh;
        let bestVTarget = -1;
        let bestVOffset = 0;

        for (const target of vSnapTargets) {
          const dLeft = Math.abs(objLeft - target);
          if (dLeft < bestVDist) { bestVDist = dLeft; bestVTarget = target; bestVOffset = 0; }
          const dCenter = Math.abs(objCenterX - target);
          if (dCenter < bestVDist) { bestVDist = dCenter; bestVTarget = target; bestVOffset = -w / 2; }
          const dRight = Math.abs(objRight - target);
          if (dRight < bestVDist) { bestVDist = dRight; bestVTarget = target; bestVOffset = -w; }
        }
        if (bestVTarget >= 0) {
          newLeft = bestVTarget + bestVOffset;
          drawSnapLine(bestVTarget, -docH, bestVTarget, docH * 2);
        }

        // Find closest horizontal (y-axis) snap across top, center, and bottom edges
        let bestHDist = snapThresh;
        let bestHTarget = -1;
        let bestHOffset = 0;

        for (const target of hSnapTargets) {
          const dTop = Math.abs(objTop - target);
          if (dTop < bestHDist) { bestHDist = dTop; bestHTarget = target; bestHOffset = 0; }
          const dCenter = Math.abs(objCenterY - target);
          if (dCenter < bestHDist) { bestHDist = dCenter; bestHTarget = target; bestHOffset = -h / 2; }
          const dBottom = Math.abs(objBottom - target);
          if (dBottom < bestHDist) { bestHDist = dBottom; bestHTarget = target; bestHOffset = -h; }
        }
        if (bestHTarget >= 0) {
          newTop = bestHTarget + bestHOffset;
          drawSnapLine(-docW, bestHTarget, docW * 2, bestHTarget);
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
