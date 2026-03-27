/**
 * Tests for useHistory — undo/redo with toDatalessJSON snapshots
 * TDD: These tests are written before the implementation.
 */

import { createHistory } from '../useHistory';

// ─── Mock Canvas Factory ─────────────────────────────────────────────────────

function makeMockCanvas() {
  const listeners: Record<string, Array<() => void>> = {};

  const canvas = {
    _renderCount: 0,
    toDatalessJSON: jest.fn(() => ({ objects: [] })),
    loadFromJSON: jest.fn(async (_json: unknown) => {
      // no-op by default
    }),
    renderAll: jest.fn(() => {
      canvas._renderCount += 1;
    }),
    on: jest.fn((event: string, fn: () => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    }),
    _trigger: (event: string) => {
      (listeners[event] ?? []).forEach((fn) => fn());
    },
  };

  return canvas;
}

// ─── Mock Zustand canvasStore ────────────────────────────────────────────────

jest.mock('@/stores/canvasStore', () => ({
  useCanvasStore: {
    getState: () => ({
      setUndoRedo: jest.fn(),
    }),
  },
}));

// ─── Mock react-hot-toast ────────────────────────────────────────────────────

jest.mock('react-hot-toast', () => ({
  toast: { error: jest.fn() },
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Test 1: Undo returns to previous states ────────────────────────────

  it('Test 1: after 3 state captures, undo returns to state 2 then state 1', async () => {
    const { captureState, undo } = createHistory();
    const canvas = makeMockCanvas();

    // Capture 3 distinct states
    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 1 } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 2 } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 3 } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    // Undo should restore to state 2
    await undo(canvas as unknown as import('fabric').Canvas);
    expect(canvas.loadFromJSON).toHaveBeenCalledWith(
      expect.objectContaining({ state: 2 })
    );

    // Undo again should restore to state 1
    await undo(canvas as unknown as import('fabric').Canvas);
    expect(canvas.loadFromJSON).toHaveBeenCalledWith(
      expect.objectContaining({ state: 1 })
    );
  });

  // ─── Test 2: Redo restores the undone state ─────────────────────────────

  it('Test 2: after undo, redo restores the undone state', async () => {
    const { captureState, undo, redo } = createHistory();
    const canvas = makeMockCanvas();

    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 'A' } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 'B' } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    // Undo to state A
    await undo(canvas as unknown as import('fabric').Canvas);
    expect(canvas.loadFromJSON).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: 'A' })
    );

    // Redo should restore B
    await redo(canvas as unknown as import('fabric').Canvas);
    expect(canvas.loadFromJSON).toHaveBeenLastCalledWith(
      expect.objectContaining({ state: 'B' })
    );
  });

  // ─── Test 3: Undo stack capped at 50 ────────────────────────────────────

  it('Test 3: undo stack is capped at 50 — adding 51st state drops the oldest', async () => {
    const { captureState, undo } = createHistory();
    const canvas = makeMockCanvas();

    // Capture 52 states (only 50 fit in the undo stack)
    for (let i = 0; i < 52; i++) {
      canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], stateIndex: i } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
      captureState(canvas as unknown as import('fabric').Canvas);
    }

    // Undo 50 times — all should succeed (no toast)
    const { toast } = await import('react-hot-toast');
    for (let i = 0; i < 50; i++) {
      await undo(canvas as unknown as import('fabric').Canvas);
    }
    expect(toast.error).not.toHaveBeenCalled();

    // 51st undo should hit empty stack — show toast
    await undo(canvas as unknown as import('fabric').Canvas);
    expect(toast.error).toHaveBeenCalledWith('Nothing left to undo');
  });

  // ─── Test 4: New capture after undo clears redo stack ───────────────────

  it('Test 4: new capture after undo clears redo stack', async () => {
    const { captureState, undo, redo } = createHistory();
    const canvas = makeMockCanvas();

    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 'A' } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 'B' } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    // Undo to A
    await undo(canvas as unknown as import('fabric').Canvas);

    // Capture new state C — this should clear redo stack
    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 'C' } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    // Redo stack is empty — show toast
    await redo(canvas as unknown as import('fabric').Canvas);
    const { toast } = await import('react-hot-toast');
    expect(toast.error).toHaveBeenCalledWith('Nothing left to redo');
  });

  // ─── Test 5: isProcessing guard prevents recursive capture ──────────────

  it('Test 5: isProcessing flag prevents recursive capture during restore', async () => {
    const { captureState, undo, bindHistory } = createHistory();
    const canvas = makeMockCanvas();

    // Bind history
    bindHistory(canvas as unknown as import('fabric').Canvas);

    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 'A' } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    canvas.toDatalessJSON.mockReturnValueOnce({ objects: [], state: 'B' } as unknown as ReturnType<typeof canvas.toDatalessJSON>);
    captureState(canvas as unknown as import('fabric').Canvas);

    const callsBefore = canvas.toDatalessJSON.mock.calls.length;

    // During undo, object:added fires (simulating Fabric.js behavior during loadFromJSON)
    canvas.loadFromJSON.mockImplementationOnce(async () => {
      // Trigger object:added during restore — should NOT capture a new state
      canvas._trigger('object:added');
    });

    await undo(canvas as unknown as import('fabric').Canvas);

    // toDatalessJSON should NOT have been called during restore
    expect(canvas.toDatalessJSON.mock.calls.length).toBe(callsBefore);
  });
});
