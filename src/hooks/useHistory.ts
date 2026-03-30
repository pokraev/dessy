
import type { Canvas } from 'fabric';
import { toast } from 'react-hot-toast';
import i18n from '@/i18n';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';
import { loadCanvasJSON } from '@/lib/fabric/load-canvas-json';
import { useCanvasStore } from '@/stores/canvasStore';

const MAX_STEPS = 50;

/**
 * createHistory — undo/redo with toObject snapshots.
 *
 * Returns a history object (not a hook) so it can be created once per canvas
 * and used across multiple React components without violating hooks rules.
 *
 * Architecture:
 * - Two stacks: undoStack (past states) + redoStack (future states)
 * - currentState: the state currently rendered on canvas (string or null before init)
 * - isProcessing: prevents recursive capture during loadFromJSON restore
 * - maxSteps: 50 (CANV-07)
 *
 * Each stack entry is a serialized JSON string produced by toObject.
 * Using toObject with CUSTOM_PROPS ensures all custom properties are preserved in snapshots.
 */
export function createHistory() {
  const undoStack: string[] = [];
  const redoStack: string[] = [];
  let currentState: string | null = null;
  let isProcessing = false;

  /** Serialize canvas to a JSON string using toObject with CUSTOM_PROPS.
   *  toObject captures all registered custom properties alongside standard Fabric.js data,
   *  making snapshots self-contained for undo/redo. */
  function serialize(canvas: Canvas): string {
    return JSON.stringify(
      canvas.toObject(CUSTOM_PROPS as unknown as string[])
    );
  }

  /** Update Zustand canUndo/canRedo flags. */
  function syncStore() {
    useCanvasStore.getState().setUndoRedo(
      undoStack.length > 0,
      redoStack.length > 0
    );
  }

  /**
   * captureState — called after every object:added / object:removed / object:modified.
   * Guards against recursive calls during undo/redo restore.
   */
  function captureState(canvas: Canvas) {
    if (isProcessing) return;

    const snapshot = serialize(canvas);

    // Push current state onto undo stack
    if (currentState !== null) {
      undoStack.push(currentState);
      // Cap at MAX_STEPS — drop oldest
      if (undoStack.length > MAX_STEPS) {
        undoStack.shift();
      }
    }

    // Clear redo stack — a new action invalidates future states
    redoStack.length = 0;

    // Update current state
    currentState = snapshot;

    syncStore();
  }

  /**
   * undo — restore the previous state.
   */
  async function undo(canvas: Canvas) {
    if (undoStack.length === 0) {
      toast.error(i18n.t('canvas.nothingToUndo'));
      return;
    }

    isProcessing = true;

    // Move current state to redo stack
    if (currentState !== null) {
      redoStack.push(currentState);
    }

    // Pop from undo stack → becomes current
    const restoredSnapshot = undoStack.pop()!;
    currentState = restoredSnapshot;

    // Restore canvas — MUST await (Fabric.js 7 async)
    try {
      await loadCanvasJSON(canvas, JSON.parse(restoredSnapshot));
    } catch {
      // Image load failure during undo is non-fatal — canvas renders without that image
    }
    canvas.renderAll();

    isProcessing = false;

    syncStore();
  }

  /**
   * redo — restore the next state (after an undo).
   */
  async function redo(canvas: Canvas) {
    if (redoStack.length === 0) {
      toast.error(i18n.t('canvas.nothingToRedo'));
      return;
    }

    isProcessing = true;

    // Move current state to undo stack
    if (currentState !== null) {
      undoStack.push(currentState);
    }

    // Pop from redo stack → becomes current
    const restoredSnapshot = redoStack.pop()!;
    currentState = restoredSnapshot;

    try {
      await loadCanvasJSON(canvas, JSON.parse(restoredSnapshot));
    } catch {
      // Image load failure during redo is non-fatal
    }
    canvas.renderAll();

    isProcessing = false;

    syncStore();
  }

  /**
   * bindHistory — attach canvas events to captureState.
   * Call once after canvas initialization.
   */
  function bindHistory(canvas: Canvas) {
    // Initialize current state
    currentState = serialize(canvas);

    canvas.on('object:added', () => captureState(canvas));
    canvas.on('object:removed', () => captureState(canvas));
    canvas.on('object:modified', () => captureState(canvas));
  }

  return {
    undo,
    redo,
    captureState,
    bindHistory,
    get canUndo() {
      return undoStack.length > 0;
    },
    get canRedo() {
      return redoStack.length > 0;
    },
  };
}

/**
 * useHistory — React hook wrapper around createHistory.
 * Returns a stable history instance bound to the canvas lifecycle.
 *
 * Note: createHistory() is called directly (not using useRef) because this hook
 * is designed to be called once per canvas instance, and the history object
 * outlives React re-renders via the canvas ref.
 */
export function useHistory() {
  // Delegate to createHistory so both React components and tests can use the logic
  return createHistory();
}
