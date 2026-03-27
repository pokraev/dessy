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
      const { Canvas, Rect, Line: FabricLine } = await import('fabric');
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

      function drawSnapLine(
        x1: number, y1: number, x2: number, y2: number
      ) {
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

      // Collect all snap targets for a given object (excludes that object)
      function getSnapTargets(excludeObj: FabricObject | null) {
        const docDims = getDocDimensions(format);
        const docW = docDims.width;
        const docH = docDims.height;

        const vTargets: number[] = [0, docW / 2, docW];
        const hTargets: number[] = [0, docH / 2, docH];

        const bleed = calcBleedGuides(format);
        const margins = calcMarginGuides(format);
        vTargets.push(bleed.bleedPx, docW - bleed.bleedPx, margins.left, margins.right);
        hTargets.push(bleed.bleedPx, docH - bleed.bleedPx, margins.top, margins.bottom);

        const objects = canvas!.getObjects().filter(
          (o) => o !== excludeObj
            && !(o as FabricObject & { _isSnapLine?: boolean })._isSnapLine
            && !(o as FabricObject & { _isDocBackground?: boolean })._isDocBackground
        );
        for (const other of objects) {
          const oL = other.left ?? 0;
          const oT = other.top ?? 0;
          const oW = (other.width ?? 0) * (other.scaleX ?? 1);
          const oH = (other.height ?? 0) * (other.scaleY ?? 1);
          vTargets.push(oL, oL + oW / 2, oL + oW);
          hTargets.push(oT, oT + oH / 2, oT + oH);
        }

        return { vTargets, hTargets, docW, docH };
      }

      // Snap an object's position (move snap)
      function snapMove(obj: FabricObject) {
        clearSnapLines();
        const snapThresh = SNAP_THRESHOLD / canvas!.getZoom();
        const { vTargets, hTargets, docW, docH } = getSnapTargets(obj);

        const oL = obj.left ?? 0;
        const oT = obj.top ?? 0;
        const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
        const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
        const oR = oL + w;
        const oB = oT + h;
        const oCX = oL + w / 2;
        const oCY = oT + h / 2;

        let newLeft = oL;
        let newTop = oT;

        // Vertical snap (x-axis)
        let bestV = snapThresh, bestVT = -1, bestVO = 0;
        for (const t of vTargets) {
          const dL = Math.abs(oL - t); if (dL < bestV) { bestV = dL; bestVT = t; bestVO = 0; }
          const dC = Math.abs(oCX - t); if (dC < bestV) { bestV = dC; bestVT = t; bestVO = -w / 2; }
          const dR = Math.abs(oR - t); if (dR < bestV) { bestV = dR; bestVT = t; bestVO = -w; }
        }
        if (bestVT >= 0) { newLeft = bestVT + bestVO; drawSnapLine(bestVT, -docH, bestVT, docH * 2); }

        // Horizontal snap (y-axis)
        let bestH = snapThresh, bestHT = -1, bestHO = 0;
        for (const t of hTargets) {
          const dT = Math.abs(oT - t); if (dT < bestH) { bestH = dT; bestHT = t; bestHO = 0; }
          const dC = Math.abs(oCY - t); if (dC < bestH) { bestH = dC; bestHT = t; bestHO = -h / 2; }
          const dB = Math.abs(oB - t); if (dB < bestH) { bestH = dB; bestHT = t; bestHO = -h; }
        }
        if (bestHT >= 0) { newTop = bestHT + bestHO; drawSnapLine(-docW, bestHT, docW * 2, bestHT); }

        if (newLeft !== oL || newTop !== oT) {
          obj.set({ left: newLeft, top: newTop });
          obj.setCoords();
        }
      }

      // Snap only the edge being dragged during resize
      function snapScale(obj: FabricObject) {
        clearSnapLines();
        const snapThresh = SNAP_THRESHOLD / canvas!.getZoom();
        const { vTargets, hTargets, docW, docH } = getSnapTargets(obj);

        // Detect which handle is being dragged
        // __corner values: 'tl','tr','bl','br','ml','mr','mt','mb'
        const corner = (obj as FabricObject & { __corner?: string }).__corner ?? '';
        const snapRight = corner.includes('r');
        const snapLeft = corner.includes('l') && !corner.includes('r');
        const snapBottom = corner.includes('b');
        const snapTop = corner.includes('t') && !corner.includes('b');

        // Use object properties directly (scene coords)
        const bL = obj.left ?? 0;
        const bT = obj.top ?? 0;
        const bR = bL + (obj.width ?? 0) * (obj.scaleX ?? 1);
        const bB = bT + (obj.height ?? 0) * (obj.scaleY ?? 1);

        if (snapRight) {
          let best = snapThresh, target = -1;
          for (const t of vTargets) { const d = Math.abs(bR - t); if (d < best) { best = d; target = t; } }
          if (target >= 0) drawSnapLine(target, -docH, target, docH * 2);
        }

        if (snapLeft) {
          let best = snapThresh, target = -1;
          for (const t of vTargets) { const d = Math.abs(bL - t); if (d < best) { best = d; target = t; } }
          if (target >= 0) drawSnapLine(target, -docH, target, docH * 2);
        }

        if (snapBottom) {
          let best = snapThresh, target = -1;
          for (const t of hTargets) { const d = Math.abs(bB - t); if (d < best) { best = d; target = t; } }
          if (target >= 0) drawSnapLine(-docW, target, docW * 2, target);
        }

        if (snapTop) {
          let best = snapThresh, target = -1;
          for (const t of hTargets) { const d = Math.abs(bT - t); if (d < best) { best = d; target = t; } }
          if (target >= 0) drawSnapLine(-docW, target, docW * 2, target);
        }
      }

      canvas.on('object:moving', (e) => { if (e.target) snapMove(e.target); });
      canvas.on('object:scaling', (e) => { if (e.target) snapScale(e.target); });

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
