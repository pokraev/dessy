'use client';

import { useEffect, useRef } from 'react';
import type { Canvas, FabricObject, Group } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';

interface HistoryFns {
  undo: (canvas: Canvas) => Promise<void>;
  redo: (canvas: Canvas) => Promise<void>;
}

/**
 * useKeyboardShortcuts — global keyboard handler for all Phase 1 shortcuts.
 *
 * Shortcuts handled:
 * - Tool switching: v, t, r, c, l, i, h (skipped when editing text)
 * - Undo/Redo: Ctrl+Z, Ctrl+Shift+Z
 * - Copy/Paste: Ctrl+C, Ctrl+V (paste offsets +10px)
 * - Delete: Delete, Backspace (skipped when editing text)
 * - Nudge: Arrow keys (1px), Shift+Arrow (10px)
 * - Group/Ungroup: Ctrl+G, Ctrl+Shift+G
 * - Save: Ctrl+S
 * - Help: ? key opens shortcuts overlay
 */
export function useKeyboardShortcuts(
  canvas: Canvas | null,
  history: HistoryFns
) {
  // Clipboard buffer for copy/paste
  const clipboardRef = useRef<FabricObject | null>(null);

  useEffect(() => {
    if (!canvas) return;

    async function handleKeyDown(e: KeyboardEvent) {
      if (!canvas) return;

      const key = e.key;
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      // Check if user is currently editing text — skip most shortcuts
      const activeObj = canvas.getActiveObject() as (FabricObject & { isEditing?: boolean }) | undefined;
      const isEditingText = activeObj?.isEditing === true;

      // ── Tool shortcuts (single key, no modifier, not when editing text) ────

      if (!isCtrl && !isEditingText) {
        switch (key) {
          case 'v':
            useCanvasStore.getState().setActiveTool('select');
            return;
          case 't':
            useCanvasStore.getState().setActiveTool('text');
            return;
          case 'g':
            useCanvasStore.getState().setActiveTool('triangle');
            return;
          case 'r':
            useCanvasStore.getState().setActiveTool('rect');
            return;
          case 'c':
            useCanvasStore.getState().setActiveTool('circle');
            return;
          case 'l':
            useCanvasStore.getState().setActiveTool('line');
            return;
          case 'i':
            useCanvasStore.getState().setActiveTool('image');
            return;
          case 'h':
            useCanvasStore.getState().setActiveTool('hand');
            return;
          case '?':
            useEditorStore.getState().setShortcutsModalOpen(true);
            return;
        }
      }

      // ── Edit shortcuts (with Ctrl/Cmd) ────────────────────────────────────

      if (isCtrl) {
        switch (key) {
          // Undo
          case 'z':
            if (!isShift) {
              e.preventDefault();
              await history.undo(canvas);
              return;
            }
            break;

          // Redo (Ctrl+Shift+Z)
          case 'Z':
            if (isShift) {
              e.preventDefault();
              await history.redo(canvas);
              return;
            }
            break;
        }

        // Handle Ctrl+Shift+Z (browser sends key 'Z' on shift, but some send 'z')
        if (key === 'z' && isShift) {
          e.preventDefault();
          await history.redo(canvas);
          return;
        }

        // Copy
        if (key === 'c') {
          e.preventDefault();
          const obj = canvas.getActiveObject();
          if (obj) {
            const cloned = await obj.clone();
            clipboardRef.current = cloned as FabricObject;
          }
          return;
        }

        // Paste
        if (key === 'v') {
          e.preventDefault();
          if (clipboardRef.current) {
            const pasted = await clipboardRef.current.clone() as FabricObject;
            pasted.set({
              left: (pasted.left ?? 0) + 10,
              top: (pasted.top ?? 0) + 10,
            });
            canvas.add(pasted);
            canvas.setActiveObject(pasted);
            canvas.requestRenderAll();
          }
          return;
        }

        // Save (Ctrl+S)
        if (key === 's') {
          e.preventDefault();
          useCanvasStore.getState().triggerSave?.();
          return;
        }

        // Group (Ctrl+G)
        if (key === 'g' && !isShift) {
          e.preventDefault();
          const objs = canvas.getActiveObjects();
          if (objs.length >= 2) {
            // Dynamically import Group to keep client-only
            const { Group: FabricGroup } = await import('fabric');
            canvas.discardActiveObject();
            objs.forEach((o) => canvas.remove(o));
            const group = new FabricGroup(objs);
            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.requestRenderAll();
          }
          return;
        }

        // Ungroup (Ctrl+Shift+G)
        if (key === 'g' && isShift) {
          e.preventDefault();
          const obj = canvas.getActiveObject() as Group & { _objects?: FabricObject[] };
          if (obj && obj.type === 'group') {
            // toActiveSelection() ungroups to individual objects
            (obj as Group & { toActiveSelection: () => void }).toActiveSelection();
            canvas.requestRenderAll();
          }
          return;
        }

        return; // Handled or unrecognized Ctrl+key
      }

      // ── Delete ────────────────────────────────────────────────────────────

      if ((key === 'Delete' || key === 'Backspace') && !isEditingText) {
        e.preventDefault();
        const objects = canvas.getActiveObjects();
        if (objects.length) {
          canvas.discardActiveObject();
          objects.forEach((obj) => canvas.remove(obj));
          canvas.requestRenderAll();
        }
        return;
      }

      // ── Arrow key nudge ───────────────────────────────────────────────────

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        const obj = canvas.getActiveObject();
        if (!obj) return;

        e.preventDefault();
        const step = isShift ? 10 : 1;

        switch (key) {
          case 'ArrowUp':
            obj.set({ top: (obj.top ?? 0) - step });
            break;
          case 'ArrowDown':
            obj.set({ top: (obj.top ?? 0) + step });
            break;
          case 'ArrowLeft':
            obj.set({ left: (obj.left ?? 0) - step });
            break;
          case 'ArrowRight':
            obj.set({ left: (obj.left ?? 0) + step });
            break;
        }

        obj.setCoords();
        canvas.requestRenderAll();
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvas, history]);
}
