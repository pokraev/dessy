'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Canvas, FabricObject, Shadow } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';
import { pxToMm } from '@/lib/units';

export interface ObjectSnapshot {
  id: string;
  type: 'text' | 'image' | 'shape' | 'colorBlock' | null;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number; // 0-100 display scale
  fill: string | object | null;
  stroke: string | null;
  strokeWidth: number;
  strokeDashArray: number[] | null;
  shadow: { offsetX: number; offsetY: number; blur: number; color: string } | null;
  rx: number;
  ry: number;
  // text-only properties
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number;
  charSpacing?: number;
  textAlign?: string;
  // image-only
  fitMode?: string;
  // swatch linking
  swatchId?: string | null;
  presetId?: string | null;
}

type FabricObjectWithCustom = FabricObject & {
  id?: string;
  customType?: string;
  fitMode?: string;
  swatchId?: string | null;
  presetId?: string | null;
  // text properties
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number;
  charSpacing?: number;
  textAlign?: string;
  // rect properties
  rx?: number;
  ry?: number;
};

function mapCustomType(customType: string | undefined): ObjectSnapshot['type'] {
  if (customType === 'text') return 'text';
  if (customType === 'image') return 'image';
  if (customType === 'colorBlock') return 'colorBlock';
  if (customType === 'shape') return 'shape';
  return null;
}

function extractSnapshot(obj: FabricObjectWithCustom): ObjectSnapshot {
  const shadow = obj.shadow as Shadow | null;
  const shadowData =
    shadow && typeof shadow === 'object' && 'offsetX' in shadow
      ? {
          offsetX: (shadow as Shadow).offsetX ?? 0,
          offsetY: (shadow as Shadow).offsetY ?? 0,
          blur: (shadow as Shadow).blur ?? 0,
          color: (shadow as Shadow).color ?? 'rgba(0,0,0,0)',
        }
      : null;

  const type = mapCustomType(obj.customType);

  const snapshot: ObjectSnapshot = {
    id: obj.id ?? '',
    type,
    x: pxToMm(obj.left ?? 0),
    y: pxToMm(obj.top ?? 0),
    w: pxToMm((obj.width ?? 0) * (obj.scaleX ?? 1)),
    h: pxToMm((obj.height ?? 0) * (obj.scaleY ?? 1)),
    rotation: obj.angle ?? 0,
    opacity: Math.round((obj.opacity ?? 1) * 100),
    fill: (obj.fill as string | object | null) ?? null,
    stroke: (obj.stroke as string | null) ?? null,
    strokeWidth: obj.strokeWidth ?? 0,
    strokeDashArray: (obj.strokeDashArray as number[] | null) ?? null,
    shadow: shadowData,
    rx: obj.rx ?? 0,
    ry: obj.ry ?? 0,
  };

  if (type === 'text') {
    snapshot.fontFamily = obj.fontFamily;
    snapshot.fontSize = obj.fontSize;
    snapshot.fontWeight = obj.fontWeight;
    snapshot.lineHeight = obj.lineHeight;
    snapshot.charSpacing = obj.charSpacing;
    snapshot.textAlign = obj.textAlign;
  }

  if (type === 'image') {
    snapshot.fitMode = obj.fitMode;
  }

  snapshot.swatchId = obj.swatchId ?? null;
  snapshot.presetId = obj.presetId ?? null;

  return snapshot;
}

function makeMultiSnapshot(): ObjectSnapshot {
  return {
    id: '__multi__',
    type: null,
    x: NaN,
    y: NaN,
    w: NaN,
    h: NaN,
    rotation: NaN,
    opacity: NaN,
    fill: null,
    stroke: null,
    strokeWidth: NaN,
    strokeDashArray: null,
    shadow: null,
    rx: NaN,
    ry: NaN,
  };
}

export function useSelectedObject(): ObjectSnapshot | null {
  const [snapshot, setSnapshot] = useState<ObjectSnapshot | null>(null);

  const syncSnapshot = useCallback(() => {
    const canvas = useCanvasStore.getState().canvasRef as Canvas | null;
    if (!canvas) {
      setSnapshot(null);
      return;
    }

    const active = canvas.getActiveObject() as FabricObjectWithCustom | null;
    if (!active) {
      setSnapshot(null);
      return;
    }

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 1) {
      setSnapshot(makeMultiSnapshot());
      return;
    }

    setSnapshot(extractSnapshot(active));
  }, []);

  useEffect(() => {
    syncSnapshot();

    const unsubStore = useCanvasStore.subscribe((state, prev) => {
      if (state.canvasRef !== prev.canvasRef) {
        if (!state.canvasRef) {
          setSnapshot(null);
          return;
        }
        syncSnapshot();
        attachListeners(state.canvasRef);
      }
    });

    const canvas = useCanvasStore.getState().canvasRef as Canvas | null;
    if (canvas) {
      attachListeners(canvas);
    }

    return () => {
      unsubStore();
      const c = useCanvasStore.getState().canvasRef as Canvas | null;
      if (c) detachListeners(c);
    };
  }, [syncSnapshot]);

  function attachListeners(canvas: Canvas) {
    canvas.on('selection:created', syncSnapshot);
    canvas.on('selection:updated', syncSnapshot);
    canvas.on('object:modified', syncSnapshot);
    canvas.on('selection:cleared', syncSnapshot);
  }

  function detachListeners(canvas: Canvas) {
    canvas.off('selection:created', syncSnapshot);
    canvas.off('selection:updated', syncSnapshot);
    canvas.off('object:modified', syncSnapshot);
    canvas.off('selection:cleared', syncSnapshot);
  }

  return snapshot;
}
