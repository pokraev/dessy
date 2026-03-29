'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Canvas, FabricObject } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';

export type LayerType = 'text' | 'image' | 'shape' | 'colorBlock';

export interface LayerItem {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
}

type FabricObjectWithCustom = FabricObject & {
  id?: string;
  name?: string;
  customType?: string;
  locked?: boolean;
  __layerId?: string;
};

function mapCustomType(customType: string | undefined): LayerType {
  if (customType === 'text') return 'text';
  if (customType === 'image') return 'image';
  if (customType === 'colorBlock') return 'colorBlock';
  return 'shape';
}

function getObjectId(obj: FabricObjectWithCustom): string {
  if (obj.id) return obj.id;
  // Assign a stable layer ID if none exists
  if (!obj.__layerId) {
    obj.__layerId = crypto.randomUUID();
  }
  return obj.__layerId;
}

function extractLayers(canvas: Canvas): LayerItem[] {
  const objects = canvas.getObjects() as FabricObjectWithCustom[];
  // Reverse so top-most object appears first in the list (Figma convention)
  return [...objects].reverse().map((obj) => ({
    id: getObjectId(obj),
    name: obj.name ?? obj.customType ?? 'Layer',
    type: mapCustomType(obj.customType),
    visible: obj.visible !== false,
    locked: obj.locked === true,
  }));
}

interface UseCanvasLayersReturn {
  layers: LayerItem[];
  moveLayer: (fromIndex: number, toIndex: number) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
  selectLayer: (id: string) => void;
}

export function useCanvasLayers(): UseCanvasLayersReturn {
  const [layers, setLayers] = useState<LayerItem[]>([]);

  const syncLayers = useCallback(() => {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) {
      setLayers([]);
      return;
    }
    setLayers(extractLayers(canvas));
  }, []);

  useEffect(() => {
    // Sync on first render
    syncLayers();

    // Subscribe to canvasStore for canvasRef changes
    const unsubStore = useCanvasStore.subscribe((state, prev) => {
      if (state.canvasRef !== prev.canvasRef) {
        if (!state.canvasRef) {
          setLayers([]);
          return;
        }
        syncLayers();
        attachCanvasListeners(state.canvasRef);
      }
    });

    // Attach listeners to currently available canvas
    const canvas = useCanvasStore.getState().canvasRef;
    if (canvas) {
      attachCanvasListeners(canvas);
    }

    return () => {
      unsubStore();
      const canvas = useCanvasStore.getState().canvasRef;
      if (canvas) {
        detachCanvasListeners(canvas);
      }
    };
  }, [syncLayers]);

  function attachCanvasListeners(canvas: Canvas) {
    canvas.on('object:added', syncLayers);
    canvas.on('object:removed', syncLayers);
    canvas.on('object:modified', syncLayers);
  }

  function detachCanvasListeners(canvas: Canvas) {
    canvas.off('object:added', syncLayers);
    canvas.off('object:removed', syncLayers);
    canvas.off('object:modified', syncLayers);
  }

  const moveLayer = useCallback((fromIndex: number, toIndex: number) => {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;

    const objects = canvas.getObjects() as FabricObjectWithCustom[];
    // Layers are displayed in reverse order (top = index 0 in layers array = last in objects array)
    const fromObjectIndex = objects.length - 1 - fromIndex;
    const toObjectIndex = objects.length - 1 - toIndex;

    const obj = objects[fromObjectIndex];
    if (!obj) return;

    canvas.moveObjectTo(obj, toObjectIndex);
    canvas.requestRenderAll();
    syncLayers();
  }, [syncLayers]);

  const toggleVisibility = useCallback((id: string) => {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;

    const objects = canvas.getObjects() as FabricObjectWithCustom[];
    const obj = objects.find((o) => getObjectId(o) === id);
    if (!obj) return;

    obj.set({ visible: !obj.visible });
    canvas.requestRenderAll();
    syncLayers();
  }, [syncLayers]);

  const toggleLock = useCallback((id: string) => {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;

    const objects = canvas.getObjects() as FabricObjectWithCustom[];
    const obj = objects.find((o) => getObjectId(o) === id);
    if (!obj) return;

    const locked = !obj.locked;
    obj.set({
      selectable: !locked,
      evented: !locked,
    } as Partial<FabricObject>);
    (obj as FabricObjectWithCustom).locked = locked;
    canvas.requestRenderAll();
    syncLayers();
  }, [syncLayers]);

  const renameLayer = useCallback((id: string, newName: string) => {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;

    const objects = canvas.getObjects() as FabricObjectWithCustom[];
    const obj = objects.find((o) => getObjectId(o) === id);
    if (!obj) return;

    (obj as FabricObjectWithCustom).name = newName.trim() || 'Layer';
    syncLayers();
  }, [syncLayers]);

  const selectLayer = useCallback((id: string) => {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;

    const objects = canvas.getObjects() as FabricObjectWithCustom[];
    const obj = objects.find((o) => getObjectId(o) === id);
    if (!obj) return;

    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    useCanvasStore.getState().setActiveTool('select');
  }, []);

  return { layers, moveLayer, toggleVisibility, toggleLock, renameLayer, selectLayer };
}
