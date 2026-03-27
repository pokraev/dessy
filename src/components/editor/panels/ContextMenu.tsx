'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Canvas, FabricObject } from 'fabric';

interface ContextMenuProps {
  canvas: Canvas | null;
}

interface MenuState {
  visible: boolean;
  x: number;
  y: number;
  target: (FabricObject & { locked?: boolean }) | null;
}

/**
 * ContextMenu — right-click context menu for canvas elements.
 *
 * Attaches to the canvas wrapper via onContextMenu and shows a styled menu.
 *
 * Menu items (per UI-SPEC):
 *   Bring Forward
 *   Send Backward
 *   ───────────────────
 *   Duplicate               Ctrl D
 *   ───────────────────
 *   Lock / Unlock
 *   ───────────────────
 *   Delete                  Del     (red text)
 *
 * Styling (per UI-SPEC Context Menu section):
 *   Background: #1e1e1e, border-radius 8px, border 1px #2a2a2a
 *   Shadow: 0 8px 24px rgba(0,0,0,0.5)
 *   Item height: 32px, padding-x: 16px
 *   Font: 13px Inter, #f5f5f5
 *   Destructive (Delete): #ef4444
 *   Shortcut hint: right-aligned, 12px, #888888
 */
export function ContextMenu({ canvas }: ContextMenuProps) {
  const [menu, setMenu] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
    target: null,
  });

  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setMenu((m) => ({ ...m, visible: false, target: null }));
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    if (!menu.visible) return;

    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menu.visible, close]);

  // Handle right-click on canvas wrapper
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canvas) return;

      e.preventDefault();

      // Find the object at the click point
      const canvasEl = canvas.getElement();
      const rect = canvasEl.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const target = canvas.findTarget({
        clientX: e.clientX,
        clientY: e.clientY,
      } as MouseEvent) as unknown as (FabricObject & { locked?: boolean }) | undefined;

      if (!target) {
        close();
        return;
      }

      // Select the target if not already selected
      canvas.setActiveObject(target);
      canvas.requestRenderAll();
      void canvasX; // suppress unused warning

      setMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        target: target,
      });
    },
    [canvas, close]
  );

  // ── Menu actions ──────────────────────────────────────────────────────────

  function handleBringForward() {
    if (!canvas || !menu.target) return;
    canvas.bringObjectForward(menu.target);
    canvas.requestRenderAll();
    close();
  }

  function handleSendBackward() {
    if (!canvas || !menu.target) return;
    canvas.sendObjectBackwards(menu.target);
    canvas.requestRenderAll();
    close();
  }

  async function handleDuplicate() {
    if (!canvas || !menu.target) return;
    const cloned = await menu.target.clone() as FabricObject;
    cloned.set({
      left: (cloned.left ?? 0) + 10,
      top: (cloned.top ?? 0) + 10,
    });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.requestRenderAll();
    close();
  }

  function handleLockUnlock() {
    if (!canvas || !menu.target) return;
    const obj = menu.target as FabricObject & { locked?: boolean };
    const locked = !obj.locked;
    obj.set({
      selectable: !locked,
      evented: !locked,
      locked: locked,
    } as Partial<FabricObject>);
    canvas.requestRenderAll();
    close();
  }

  function handleDelete() {
    if (!canvas || !menu.target) return;
    canvas.remove(menu.target);
    canvas.requestRenderAll();
    close();
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  const isLocked = menu.target?.locked === true;

  if (!menu.visible) {
    return (
      <div
        className="absolute inset-0"
        onContextMenu={handleContextMenu}
        style={{ pointerEvents: 'none' }}
      />
    );
  }

  return (
    <>
      {/* Invisible overlay to capture context menu events on canvas */}
      <div
        className="absolute inset-0"
        onContextMenu={handleContextMenu}
        style={{ pointerEvents: 'none' }}
      />

      {/* Context menu */}
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-50 py-1"
        style={{
          left: menu.x,
          top: menu.y,
          background: '#1e1e1e',
          borderRadius: '8px',
          border: '1px solid #2a2a2a',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          minWidth: '200px',
          userSelect: 'none',
        }}
      >
        <MenuItem label="Bring Forward" onClick={handleBringForward} />
        <MenuItem label="Send Backward" onClick={handleSendBackward} />

        <Separator />

        <MenuItem label="Duplicate" shortcut="Ctrl D" onClick={handleDuplicate} />

        <Separator />

        <MenuItem
          label={isLocked ? 'Unlock' : 'Lock'}
          onClick={handleLockUnlock}
        />

        <Separator />

        <MenuItem
          label="Delete"
          shortcut="Del"
          onClick={handleDelete}
          destructive
        />
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MenuItemProps {
  label: string;
  shortcut?: string;
  onClick: () => void;
  destructive?: boolean;
}

function MenuItem({ label, shortcut, onClick, destructive }: MenuItemProps) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 transition-colors"
      style={{
        height: '32px',
        paddingLeft: '16px',
        paddingRight: '16px',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        color: destructive ? '#ef4444' : '#f5f5f5',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      <span>{label}</span>
      {shortcut && (
        <span
          style={{
            fontSize: '12px',
            color: '#888888',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {shortcut}
        </span>
      )}
    </button>
  );
}

function Separator() {
  return (
    <div
      style={{
        height: '1px',
        background: '#2a2a2a',
        marginTop: '2px',
        marginBottom: '2px',
      }}
    />
  );
}
