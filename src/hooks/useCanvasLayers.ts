
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
  top: number;
  left: number;
}

export interface GroupTreeNode {
  id: string;
  name: string;
  type: 'group' | LayerType;
  children: GroupTreeNode[];
  childCount: number; // total leaf objects (recursive)
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
  const objects = canvas.getObjects() as (FabricObjectWithCustom & { _isDocBackground?: boolean })[];
  // Reverse so top-most object appears first in the list (Figma convention)
  // Filter out the document background rect
  return [...objects]
    .reverse()
    .filter((obj) => !obj._isDocBackground)
    .map((obj) => ({
      id: getObjectId(obj),
      name: obj.name ?? obj.customType ?? 'Layer',
      type: mapCustomType(obj.customType),
      visible: obj.visible !== false,
      locked: obj.locked === true,
      top: obj.top ?? 0,
      left: obj.left ?? 0,
    }));
}

function buildGroupTree(canvas: Canvas): GroupTreeNode[] {
  const objects = canvas.getObjects() as (FabricObjectWithCustom & { _isDocBackground?: boolean; getObjects?: () => FabricObject[] })[];

  function buildNode(obj: FabricObjectWithCustom & { getObjects?: () => FabricObject[] }): GroupTreeNode {
    if (obj.type === 'Group' && obj.getObjects) {
      const groupChildren = obj.getObjects();
      const children = groupChildren.map((child) =>
        buildNode(child as FabricObjectWithCustom & { getObjects?: () => FabricObject[] })
      );
      // Sort children: groups first (by childCount desc), then leaves
      children.sort((a, b) => {
        if (a.type === 'group' && b.type !== 'group') return -1;
        if (a.type !== 'group' && b.type === 'group') return 1;
        return b.childCount - a.childCount;
      });
      const childCount = children.reduce((sum, c) => sum + c.childCount, 0);
      return {
        id: getObjectId(obj),
        name: obj.name ?? 'Group',
        type: 'group',
        children,
        childCount,
      };
    }
    return {
      id: getObjectId(obj),
      name: obj.name ?? obj.customType ?? 'Object',
      type: mapCustomType(obj.customType),
      children: [],
      childCount: 1,
    };
  }

  const nodes = objects
    .filter((o) => !o._isDocBackground)
    .map((o) => buildNode(o));

  // Sort top-level: groups first (most children first), then individual objects
  nodes.sort((a, b) => {
    if (a.type === 'group' && b.type !== 'group') return -1;
    if (a.type !== 'group' && b.type === 'group') return 1;
    return b.childCount - a.childCount;
  });

  return nodes;
}

interface UseCanvasLayersReturn {
  layers: LayerItem[];
  groupTree: GroupTreeNode[];
  moveLayer: (fromIndex: number, toIndex: number) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  renameLayer: (id: string, newName: string) => void;
  selectLayer: (id: string) => void;
}

export function useCanvasLayers(): UseCanvasLayersReturn {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [groupTree, setGroupTree] = useState<GroupTreeNode[]>([]);

  const syncLayers = useCallback(() => {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) {
      setLayers([]);
      setGroupTree([]);
      return;
    }
    setLayers(extractLayers(canvas));
    setGroupTree(buildGroupTree(canvas));
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

  return { layers, groupTree, moveLayer, toggleVisibility, toggleLock, renameLayer, selectLayer };
}
