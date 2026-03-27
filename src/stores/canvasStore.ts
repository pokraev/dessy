import { create } from 'zustand';

export type ToolId = 'select' | 'text' | 'rect' | 'circle' | 'line' | 'image' | 'hand';

interface CanvasState {
  activeTool: ToolId;
  zoom: number;
  selectedObjectIds: string[];
  canUndo: boolean;
  canRedo: boolean;
  viewportTransform: number[];
  // History functions — set by useFabricCanvas after history init (canvas already bound)
  triggerUndo: (() => Promise<void>) | null;
  triggerRedo: (() => Promise<void>) | null;
  // Actions
  setActiveTool: (tool: ToolId) => void;
  setZoom: (zoom: number) => void;
  setSelection: (ids: string[]) => void;
  setUndoRedo: (canUndo: boolean, canRedo: boolean) => void;
  setViewportTransform: (vt: number[]) => void;
  setHistoryFns: (
    triggerUndo: () => Promise<void>,
    triggerRedo: () => Promise<void>
  ) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  activeTool: 'select',
  zoom: 1,
  selectedObjectIds: [],
  canUndo: false,
  canRedo: false,
  viewportTransform: [1, 0, 0, 1, 0, 0],
  triggerUndo: null,
  triggerRedo: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom }),
  setSelection: (ids) => set({ selectedObjectIds: ids }),
  setUndoRedo: (canUndo, canRedo) => set({ canUndo, canRedo }),
  setViewportTransform: (vt) => set({ viewportTransform: vt }),
  setHistoryFns: (triggerUndo, triggerRedo) => set({ triggerUndo, triggerRedo }),
}));
