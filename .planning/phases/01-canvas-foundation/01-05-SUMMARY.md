---
phase: 01-canvas-foundation
plan: 05
subsystem: ui
tags: [fabric.js, keyboard-shortcuts, undo-redo, context-menu, react, zustand]

# Dependency graph
requires:
  - phase: 01-canvas-foundation/01-02
    provides: useFabricCanvas hook, canvas init lifecycle
  - phase: 01-canvas-foundation/01-03
    provides: canvasStore (canUndo/canRedo/setUndoRedo), editorStore (shortcutsModalOpen)

provides:
  - createHistory / useHistory: 50-step undo/redo with toDatalessJSON snapshots
  - useKeyboardShortcuts: global keyboard handler (tool switching, undo/redo, copy/paste, delete, nudge, group)
  - ContextMenu: right-click menu with Bring Forward, Send Backward, Duplicate, Lock/Unlock, Delete
  - KeyboardShortcutsModal: ? key overlay listing all shortcuts grouped by section
  - canvasStore.triggerUndo / triggerRedo: canvas-bound history functions accessible to Header buttons

affects:
  - 01-06-persistence (auto-save will use canvas serialization; Ctrl+S placeholder wired here)
  - 02-panels (keyboard shortcuts system is the global handler for all editor interactions)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - createHistory factory (not useRef-based React hook) — enables unit testing outside React component context
    - canvasStore.triggerUndo/triggerRedo — canvas-bound functions stored in Zustand so sibling components (Header) can trigger canvas operations without direct canvas access
    - useKeyboardShortcuts hook accepts canvas + history functions (stable refs, not recreated per render)

key-files:
  created:
    - src/hooks/useHistory.ts
    - src/hooks/useKeyboardShortcuts.ts
    - src/components/editor/panels/ContextMenu.tsx
    - src/components/editor/ui/KeyboardShortcutsModal.tsx
    - src/hooks/__tests__/useHistory.test.ts
  modified:
    - src/hooks/useFabricCanvas.ts (added bindHistory + setHistoryFns integration)
    - src/stores/canvasStore.ts (added triggerUndo, triggerRedo, setHistoryFns)
    - src/components/editor/ui/Header.tsx (wired undo/redo buttons)
    - src/components/editor/EditorCanvasInner.tsx (mounted keyboard shortcuts, context menu, shortcuts modal)

key-decisions:
  - "createHistory() is a plain factory function (not useRef-wrapped hook) so tests can call it without a React component context"
  - "Canvas-bound undo/redo stored in canvasStore as triggerUndo/triggerRedo so Header (sibling component) can call them without prop drilling"
  - "ContextMenu uses onContextMenu on the canvas wrapper div (not canvas.on) — avoids Fabric.js event system complexity and works with React's event propagation"

patterns-established:
  - "Pattern: Pure factory for imperative state — createHistory() creates isolated state without React hooks so it can be unit-tested and reused across renders"
  - "Pattern: Store cross-component canvas operations — canvas-bound callbacks registered in Zustand store for access by sibling components that don't own the canvas ref"

requirements-completed:
  - CANV-07
  - CANV-08
  - CANV-09
  - CANV-10
  - UXSH-06

# Metrics
duration: 8min
completed: 2026-03-27
---

# Phase 01 Plan 05: Keyboard Interactions & Undo/Redo Summary

**50-step toDatalessJSON undo/redo system, full keyboard shortcut suite (copy/paste/nudge/group), right-click context menu, and keyboard shortcuts overlay modal**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-27T19:09:12Z
- **Completed:** 2026-03-27T19:17:15Z
- **Tasks:** 2 (Task 1 TDD + Task 2)
- **Files modified:** 9

## Accomplishments

- Undo/redo with 50-step cap using toDatalessJSON snapshots — isProcessing guard prevents recursive capture during loadFromJSON restore
- Global keyboard shortcut handler: tool switching (v/t/r/c/l/i/h), Ctrl+Z/Shift+Z undo/redo, Ctrl+C/V copy/paste (+10px offset), Delete/Backspace remove, arrow key nudge (1px/10px), Ctrl+G group, Ctrl+Shift+G ungroup
- Right-click context menu styled per UI-SPEC: Bring Forward, Send Backward, Duplicate, Lock/Unlock, Delete (red #ef4444), 8px radius, 0 8px 24px shadow
- Keyboard shortcuts overlay modal: 600px, grouped by Tools/Canvas/Edit/File, Escape to close, scale+fade entrance animation

## Task Commits

1. **Test RED phase: failing tests for useHistory** - `b241dd5` (test)
2. **Task 1: Undo/redo history system** - `747c7a8` (feat)
3. **Task 2: Keyboard shortcuts, context menu, shortcuts modal** - `7a41848` (feat)

## Files Created/Modified

- `src/hooks/useHistory.ts` - createHistory factory with 50-step undo/redo stack, toDatalessJSON snapshots, isProcessing guard
- `src/hooks/__tests__/useHistory.test.ts` - 5 tests covering undo/redo order, redo restore, 50-step cap, new-capture clears redo, isProcessing guard
- `src/hooks/useKeyboardShortcuts.ts` - Global keyboard handler for all Phase 1 shortcuts
- `src/components/editor/panels/ContextMenu.tsx` - Right-click context menu with 5 actions
- `src/components/editor/ui/KeyboardShortcutsModal.tsx` - Shortcut overlay modal importing SHORTCUTS from constants
- `src/hooks/useFabricCanvas.ts` - Added createHistory integration + setHistoryFns registration
- `src/stores/canvasStore.ts` - Added triggerUndo, triggerRedo, setHistoryFns
- `src/components/editor/ui/Header.tsx` - Wired undo/redo buttons via triggerUndo/triggerRedo
- `src/components/editor/EditorCanvasInner.tsx` - Mounted all three new components/hooks

## Decisions Made

- `createHistory()` is a plain factory (not a React hook with `useRef`) so it can be unit-tested without a component wrapper — the returned object holds its own closure-based state
- Canvas-bound `triggerUndo`/`triggerRedo` stored in `canvasStore` so `Header` (sibling of canvas component) can call them without prop drilling through `EditorLayout`
- `ContextMenu` attaches via `onContextMenu` on the canvas wrapper div, calling `canvas.findTarget()` to find the right-clicked object — avoids Fabric.js event system complexity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced `useRef`-based hook with plain factory for testability**
- **Found during:** Task 1 (TDD RED/GREEN cycle)
- **Issue:** `useHistory()` using `useRef` threw "Invalid hook call" when called directly in Jest tests (outside React component context). Tests were written first (TDD RED) before this was discovered in GREEN phase.
- **Fix:** Refactored to `createHistory()` factory using closure-based state (plain arrays + booleans) instead of React refs. `useHistory()` now delegates to `createHistory()` for backward compatibility. Tests import `createHistory` directly.
- **Files modified:** src/hooks/useHistory.ts, src/hooks/__tests__/useHistory.test.ts
- **Verification:** All 5 tests pass, TypeScript passes, build passes
- **Committed in:** 747c7a8 (Task 1 feat commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix was essential for testability. The factory pattern is also architecturally superior since history outlives React re-renders.

## Issues Encountered

- Jest mock hoisting: `const mockToastError = jest.fn()` can't be referenced inside `jest.mock()` factory due to hoisting. Fixed by importing the mocked module inside each test to access mock functions.
- TypeScript: `mockReturnValueOnce` inferred strict return type from `toDatalessJSON` — fixed with `as unknown as ReturnType<typeof canvas.toDatalessJSON>` casts.

## Next Phase Readiness

- Undo/redo system ready for Plan 06 (persistence/auto-save — will use the same canvas serialization)
- Keyboard shortcuts system is the global handler; Plan 06 Ctrl+S save and future phase shortcuts can register additional keys
- Context menu ready for extension with Phase 2 panel operations (bring-to-front, send-to-back absolute)

## Self-Check: PASSED

Files exist:
- src/hooks/useHistory.ts: FOUND
- src/hooks/useKeyboardShortcuts.ts: FOUND
- src/components/editor/panels/ContextMenu.tsx: FOUND
- src/components/editor/ui/KeyboardShortcutsModal.tsx: FOUND
- src/hooks/__tests__/useHistory.test.ts: FOUND

Commits exist:
- b241dd5: FOUND (test RED)
- 747c7a8: FOUND (feat Task 1)
- 7a41848: FOUND (feat Task 2)

---
*Phase: 01-canvas-foundation*
*Completed: 2026-03-27*
