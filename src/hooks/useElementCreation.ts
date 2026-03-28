'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';
import {
  createTextFrame,
  createImageFrame,
  createShape,
  createColorBlock,
} from '@/lib/fabric/element-factory';

/**
 * Minimum drag size (px) to commit a new element.
 * Smaller gestures are treated as accidental clicks and discarded.
 */
const MIN_SIZE = 5;

type CreationTool = 'text' | 'triangle' | 'rect' | 'circle' | 'line' | 'image';

const CREATION_TOOLS: ReadonlySet<string> = new Set<CreationTool>(['text', 'triangle', 'rect', 'circle', 'line', 'image']);

/**
 * Handles InDesign-style click-drag element creation for all tool types.
 * When a creation tool is active, mouse:down starts a preview, mouse:move
 * resizes it, and mouse:up commits the final element.
 */
export function useElementCreation(canvas: Canvas | null) {
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const previewObjRef = useRef<any | null>(null);

  useEffect(() => {
    if (!canvas) return;
    // Capture non-null alias so TypeScript is satisfied inside closures
    const c = canvas;

    function onMouseDown(opt: any) {
      const { activeTool } = useCanvasStore.getState();

      // Only handle creation tools; ignore right-click; ignore clicks on existing objects
      if (!CREATION_TOOLS.has(activeTool)) return;
      if ((opt.e as MouseEvent).button !== 0) return;
      if (opt.target) return; // clicked on an existing object — let selection handle it

      // CRITICAL: use getScenePoint (getPointer was removed in Fabric.js 7)
      const point = c.getScenePoint(opt.e as MouseEvent);
      startPointRef.current = { x: point.x, y: point.y };
      isDrawingRef.current = true;

      // Disable group selection while drawing
      c.selection = false;

      // Create a semi-transparent preview object
      let preview: any;
      if (activeTool === 'text') {
        preview = createTextFrame({ left: point.x, top: point.y, width: 1, height: 1 });
      } else if (activeTool === 'image') {
        preview = createImageFrame({ left: point.x, top: point.y, width: 1, height: 1 });
      } else {
        // triangle, rect, circle, line
        preview = createShape(activeTool as 'triangle' | 'rect' | 'circle' | 'line', {
          left: point.x,
          top: point.y,
          width: 1,
          height: 1,
        });
      }

      // Mark as preview: non-selectable, semi-transparent
      preview.opacity = 0.5;
      preview.selectable = false;
      preview.evented = false;

      c.add(preview);
      previewObjRef.current = preview;
    }

    function onMouseMove(opt: any) {
      if (!isDrawingRef.current || !startPointRef.current || !previewObjRef.current) return;

      const current = c.getScenePoint(opt.e as MouseEvent);
      const start = startPointRef.current;
      const isShift = (opt.e as MouseEvent).shiftKey;
      const { activeTool } = useCanvasStore.getState();

      const preview = previewObjRef.current;
      if (typeof preview.set !== 'function') return;

      if (activeTool === 'line') {
        // Line tool: update endpoints directly
        let endX = current.x;
        let endY = current.y;

        if (isShift) {
          // Shift: constrain to horizontal, vertical, or 45°
          const dx = current.x - start.x;
          const dy = current.y - start.y;
          const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);

          if (angle < 22.5 || angle > 157.5) {
            // Horizontal
            endY = start.y;
          } else if (angle > 67.5 && angle < 112.5) {
            // Vertical
            endX = start.x;
          } else {
            // 45° diagonal
            const dist = Math.max(Math.abs(dx), Math.abs(dy));
            endX = start.x + dist * Math.sign(dx);
            endY = start.y + dist * Math.sign(dy);
          }
        }

        preview.set({ x1: start.x, y1: start.y, x2: endX, y2: endY });
      } else if (activeTool === 'circle') {
        const left = Math.min(start.x, current.x);
        const top = Math.min(start.y, current.y);
        const size = Math.max(Math.abs(current.x - start.x), Math.abs(current.y - start.y));
        preview.set({ left, top, width: size, height: size, rx: size / 2, ry: size / 2 });
      } else {
        const left = Math.min(start.x, current.x);
        const top = Math.min(start.y, current.y);
        const width = Math.abs(current.x - start.x);
        const height = Math.abs(current.y - start.y);

        if (isShift) {
          // Shift: constrain to square
          const size = Math.max(width, height);
          preview.set({ left, top, width: size, height: size });
        } else {
          preview.set({ left, top, width, height });
        }
      }

      if (typeof preview.setCoords === 'function') {
        preview.setCoords();
      }
      c.requestRenderAll();
    }

    function onMouseUp(opt: any) {
      if (!isDrawingRef.current || !startPointRef.current) return;
      isDrawingRef.current = false;

      const { activeTool } = useCanvasStore.getState();
      const current = c.getScenePoint(opt.e as MouseEvent);
      const start = startPointRef.current;
      const isShift = (opt.e as MouseEvent).shiftKey;

      let left = Math.min(start.x, current.x);
      let top = Math.min(start.y, current.y);
      let width = Math.abs(current.x - start.x);
      let height = Math.abs(current.y - start.y);

      // Remove preview
      if (previewObjRef.current) {
        c.remove(previewObjRef.current);
        previewObjRef.current = null;
      }

      // Re-enable selection
      c.selection = true;

      // Apply shift constraints
      if (activeTool === 'circle') {
        const size = Math.max(width, height);
        width = size;
        height = size;
      } else if (isShift && activeTool !== 'line') {
        const size = Math.max(width, height);
        width = size;
        height = size;
      }

      // For line with shift: compute constrained endpoints
      let lineEndX = current.x;
      let lineEndY = current.y;
      if (activeTool === 'line' && isShift) {
        const dx = current.x - start.x;
        const dy = current.y - start.y;
        const angle = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
        if (angle < 22.5 || angle > 157.5) {
          lineEndY = start.y;
        } else if (angle > 67.5 && angle < 112.5) {
          lineEndX = start.x;
        } else {
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          lineEndX = start.x + dist * Math.sign(dx);
          lineEndY = start.y + dist * Math.sign(dy);
        }
        // Recalculate bounding box for line
        left = Math.min(start.x, lineEndX);
        top = Math.min(start.y, lineEndY);
        width = Math.abs(lineEndX - start.x);
        height = Math.abs(lineEndY - start.y);
      }

      // Discard if too small (accidental click)
      const minDim = activeTool === 'line' ? Math.max(width, height) : Math.min(width, height);
      if (minDim < MIN_SIZE) {
        startPointRef.current = null;
        c.requestRenderAll();
        return;
      }

      // Create the final committed element
      let finalObj: any;

      if (activeTool === 'text') {
        finalObj = createTextFrame({ left, top, width, height });
      } else if (activeTool === 'image') {
        finalObj = createImageFrame({ left, top, width, height });
      } else if (CREATION_TOOLS.has(activeTool)) {
        finalObj = createShape(activeTool as 'triangle' | 'rect' | 'circle' | 'line', {
          left,
          top,
          width,
          height,
        });
      } else {
        finalObj = createColorBlock({ left, top, width, height });
      }

      // Make it fully visible and selectable
      finalObj.opacity = 1;
      finalObj.selectable = true;
      finalObj.evented = true;

      c.add(finalObj);
      c.setActiveObject(finalObj);

      // For text frames: auto-enter editing mode after creation
      if (activeTool === 'text' && typeof finalObj.enterEditing === 'function') {
        finalObj.enterEditing();
      }

      // InDesign behavior: switch back to select tool after creation
      useCanvasStore.getState().setActiveTool('select');

      c.requestRenderAll();
      startPointRef.current = null;
    }

    c.on('mouse:down', onMouseDown);
    c.on('mouse:move', onMouseMove);
    c.on('mouse:up', onMouseUp);

    return () => {
      c.off('mouse:down', onMouseDown);
      c.off('mouse:move', onMouseMove);
      c.off('mouse:up', onMouseUp);
    };
  }, [canvas]);
}
