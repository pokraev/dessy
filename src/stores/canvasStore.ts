import { create } from 'zustand';
import type { Canvas } from 'fabric';
import type { GenerationResponse } from '@/types/generation';

export type ToolId = 'select' | 'text' | 'triangle' | 'rect' | 'circle' | 'line' | 'image' | 'hand';

interface CanvasState {
  canvasRef: Canvas | null;
  activeTool: ToolId;
  zoom: number;
  busyMessage: string | null; // non-null = UI locked with overlay showing this message
  selectedObjectIds: string[];
  canUndo: boolean;
  canRedo: boolean;
  viewportTransform: number[];
  // History functions — set by useFabricCanvas after history init (canvas already bound)
  triggerUndo: (() => Promise<void>) | null;
  triggerRedo: (() => Promise<void>) | null;
  // Save callback — set by EditorCanvasInner on mount; called by Header to trigger immediate save
  triggerSave: (() => void) | null;
  // Export callback — set by EditorCanvasInner on mount; called by Header to trigger JSON export
  triggerExport: (() => void) | null;
  // Import callback — opens file picker for JSON import
  triggerImport: (() => void) | null;
  // Load generated callback — set by EditorCanvasInner on mount; calls loadGeneratedLeaflet
  triggerLoadGenerated: ((response: GenerationResponse) => void) | null;
  // Clear canvas callback — resets to 1 empty page
  triggerClearCanvas: (() => void) | null;
  // Switch page callback — saves current page, loads target page
  triggerSwitchPage: ((pageIndex: number) => void) | null;
  // Capture undo checkpoint — call after programmatic property changes (fill, font, text, etc.)
  captureUndoState: (() => void) | null;
  // Actions
  setActiveTool: (tool: ToolId) => void;
  setZoom: (zoom: number) => void;
  setSelection: (ids: string[]) => void;
  setUndoRedo: (canUndo: boolean, canRedo: boolean) => void;
  setViewportTransform: (vt: number[]) => void;
  setHistoryFns: (
    triggerUndo: () => Promise<void>,
    triggerRedo: () => Promise<void>,
    captureUndoState: () => void
  ) => void;
  setPersistFns: (triggerSave: () => void, triggerExport: () => void, triggerImport: () => void) => void;
  setLoadGeneratedFn: (fn: ((response: GenerationResponse) => void) | null) => void;
  setClearCanvasFn: (fn: (() => void) | null) => void;
  setSwitchPageFn: (fn: ((pageIndex: number) => void) | null) => void;
  setCanvasRef: (canvas: Canvas | null) => void;
  setBusyMessage: (msg: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  canvasRef: null,
  activeTool: 'select',
  zoom: 1,
  busyMessage: null,
  selectedObjectIds: [],
  canUndo: false,
  canRedo: false,
  viewportTransform: [1, 0, 0, 1, 0, 0],
  triggerUndo: null,
  triggerRedo: null,
  triggerSave: null,
  triggerExport: null,
  triggerImport: null,
  triggerLoadGenerated: null,
  triggerClearCanvas: null,
  triggerSwitchPage: null,
  captureUndoState: null,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom }),
  setSelection: (ids) => set({ selectedObjectIds: ids }),
  setUndoRedo: (canUndo, canRedo) => set({ canUndo, canRedo }),
  setViewportTransform: (vt) => set({ viewportTransform: vt }),
  setHistoryFns: (triggerUndo, triggerRedo, captureUndoState) => set({ triggerUndo, triggerRedo, captureUndoState }),
  setPersistFns: (triggerSave, triggerExport, triggerImport) => set({ triggerSave, triggerExport, triggerImport }),
  setLoadGeneratedFn: (fn) => set({ triggerLoadGenerated: fn }),
  setClearCanvasFn: (fn: (() => void) | null) => set({ triggerClearCanvas: fn }),
  setSwitchPageFn: (fn: ((pageIndex: number) => void) | null) => set({ triggerSwitchPage: fn }),
  setCanvasRef: (canvas) => set({ canvasRef: canvas }),
  setBusyMessage: (msg) => set({ busyMessage: msg }),
}));
