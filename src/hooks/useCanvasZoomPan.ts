
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';

const MIN_ZOOM = 0.1;  // 10%
const MAX_ZOOM = 5;    // 500%

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Zoom canvas to fit the document in the viewport.
 */
export function zoomToFit(canvas: Canvas) {
  const canvasEl = canvas.getElement();
  const containerWidth = canvasEl.parentElement?.clientWidth ?? canvasEl.width;
  const containerHeight = canvasEl.parentElement?.clientHeight ?? canvasEl.height;
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;
  const zoom = clamp(Math.min(scaleX, scaleY) * 0.9, MIN_ZOOM, MAX_ZOOM);

  canvas.setZoom(zoom);
  useCanvasStore.getState().setZoom(zoom);
  useCanvasStore.getState().setViewportTransform([...canvas.viewportTransform] as number[]);
}

/**
 * Zoom to a specific level.
 */
export function zoomTo(canvas: Canvas, level: number) {
  const zoom = clamp(level, MIN_ZOOM, MAX_ZOOM);
  canvas.setZoom(zoom);
  useCanvasStore.getState().setZoom(zoom);
  useCanvasStore.getState().setViewportTransform([...canvas.viewportTransform] as number[]);
}

/**
 * Hook: handles scroll-to-zoom and pan (hand tool + alt-drag).
 * Uses getScenePoint for coordinate accuracy (getPointer removed in Fabric.js 7).
 * Zoom range clamped between 0.1 (10%) and 5 (500%).
 */
export function useCanvasZoomPan(canvas: Canvas | null) {
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Subscribe to zoom changes from the Zustand store (e.g. from the BottomBar slider)
  // and apply them to the Fabric.js canvas
  useEffect(() => {
    if (!canvas) return;
    const c = canvas;
    const unsubscribe = useCanvasStore.subscribe((state, prev) => {
      if (state.zoom !== prev.zoom) {
        const currentZoom = c.getZoom();
        if (Math.abs(currentZoom - state.zoom) > 0.001) {
          // Zoom to center of viewport
          const center = c.getCenterPoint();
          c.zoomToPoint(center, state.zoom);
          useCanvasStore.getState().setViewportTransform([...c.viewportTransform] as number[]);
          c.requestRenderAll();
        }
      }
    });
    return () => unsubscribe();
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;
    // Capture non-null alias so TypeScript is satisfied inside closures
    const c = canvas;

    async function onMouseWheel(opt: any) {
      const e = opt.e as WheelEvent;
      e.preventDefault();
      e.stopPropagation();

      let zoom = c.getZoom();

      // Mac trackpad pinch sends ctrlKey + small deltaY (typically -1 to 1)
      // Regular scroll wheel sends larger deltaY (typically ~100)
      if (e.ctrlKey) {
        // Pinch gesture — deltaY is small, use direct multiplier
        const factor = 1 - e.deltaY * 0.01;
        zoom *= clamp(factor, 0.9, 1.1);
      } else {
        // Scroll wheel — normalize and use exponential
        zoom *= 0.999 ** e.deltaY;
      }

      zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);

      // Use screen coordinates for zoom center — getScenePoint gives pre-transform coords
      // which causes drift. We need the pointer position relative to the canvas element.
      const canvasEl = c.getElement();
      const rect = canvasEl.getBoundingClientRect();
      const { Point } = await import('fabric');
      const point = new Point(e.clientX - rect.left, e.clientY - rect.top);
      c.zoomToPoint(point, zoom);

      useCanvasStore.getState().setZoom(zoom);
      useCanvasStore.getState().setViewportTransform([...c.viewportTransform] as number[]);
    }

    function onMouseDown(opt: any) {
      const { activeTool } = useCanvasStore.getState();
      const isHandTool = activeTool === 'hand';
      const isAltDrag = (opt.e as MouseEvent).altKey;

      if (isHandTool || isAltDrag) {
        isDraggingRef.current = true;
        lastPosRef.current = { x: (opt.e as MouseEvent).clientX, y: (opt.e as MouseEvent).clientY };
        c.selection = false;
        c.getElement().style.cursor = 'grabbing';
      }
    }

    async function onMouseMove(opt: any) {
      if (!isDraggingRef.current || !lastPosRef.current) return;

      const dx = (opt.e as MouseEvent).clientX - lastPosRef.current.x;
      const dy = (opt.e as MouseEvent).clientY - lastPosRef.current.y;

      const { Point } = await import('fabric');
      c.relativePan(new Point(dx, dy));
      lastPosRef.current = { x: (opt.e as MouseEvent).clientX, y: (opt.e as MouseEvent).clientY };

      useCanvasStore.getState().setViewportTransform([...c.viewportTransform] as number[]);
    }

    function onMouseUp() {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      lastPosRef.current = null;

      const { activeTool } = useCanvasStore.getState();
      if (activeTool !== 'hand') {
        c.selection = true;
      }
      c.getElement().style.cursor = activeTool === 'hand' ? 'grab' : '';
    }

    c.on('mouse:wheel', onMouseWheel);
    c.on('mouse:down', onMouseDown);
    c.on('mouse:move', onMouseMove);
    c.on('mouse:up', onMouseUp);

    return () => {
      c.off('mouse:wheel', onMouseWheel);
      c.off('mouse:down', onMouseDown);
      c.off('mouse:move', onMouseMove);
      c.off('mouse:up', onMouseUp);
    };
  }, [canvas]);
}
