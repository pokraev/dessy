
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Canvas, FabricObject } from 'fabric';
import { CUSTOM_PROPS } from '@/lib/fabric/element-factory';

interface ContextMenuProps {
  canvas: Canvas | null;
}

interface MenuState {
  visible: boolean;
  x: number;
  y: number;
  targets: (FabricObject & { locked?: boolean })[];
}

export function ContextMenu({ canvas }: ContextMenuProps) {
  const { t } = useTranslation();
  const [menu, setMenu] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
    targets: [],
  });

  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setMenu((m) => ({ ...m, visible: false, targets: [] }));
  }, []);

  // Use Fabric's built-in right-click support (fireRightClick: true, stopContextMenu: true)
  useEffect(() => {
    if (!canvas) return;

    function onMouseDown(opt: { e: MouseEvent; target?: FabricObject }) {
      // DOM button 2 = right click
      if (opt.e.button !== 2) return;

      const activeObjects = canvas!.getActiveObjects() as (FabricObject & { locked?: boolean })[];

      if (activeObjects.length > 0) {
        setMenu({
          visible: true,
          x: opt.e.clientX,
          y: opt.e.clientY,
          targets: activeObjects,
        });
      } else if (opt.target) {
        canvas!.setActiveObject(opt.target);
        canvas!.requestRenderAll();
        setMenu({
          visible: true,
          x: opt.e.clientX,
          y: opt.e.clientY,
          targets: [opt.target as FabricObject & { locked?: boolean }],
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvas.on('mouse:down', onMouseDown as any);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.off('mouse:down', onMouseDown as any);
    };
  }, [canvas]);

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

  // ── Menu actions ──────────────────────────────────────────────────────────

  function handleBringToFront() {
    if (!canvas || !menu.targets.length) return;
    for (const obj of menu.targets) canvas.bringObjectToFront(obj);
    canvas.requestRenderAll();
    close();
  }

  function handleBringForward() {
    if (!canvas || !menu.targets.length) return;
    for (const obj of menu.targets) canvas.bringObjectForward(obj);
    canvas.requestRenderAll();
    close();
  }

  function handleSendBackward() {
    if (!canvas || !menu.targets.length) return;
    for (const obj of [...menu.targets].reverse()) canvas.sendObjectBackwards(obj);
    canvas.requestRenderAll();
    close();
  }

  function handleSendToBack() {
    if (!canvas || !menu.targets.length) return;
    for (const obj of [...menu.targets].reverse()) canvas.sendObjectToBack(obj);
    canvas.requestRenderAll();
    close();
  }

  async function handleDuplicate() {
    if (!canvas || !menu.targets.length) return;
    const clones: FabricObject[] = [];
    for (const obj of menu.targets) {
      const cloned = await obj.clone([...CUSTOM_PROPS]) as FabricObject;
      (cloned as any).id = crypto.randomUUID();
      cloned.set({
        left: (cloned.left ?? 0) + 10,
        top: (cloned.top ?? 0) + 10,
      });
      canvas.add(cloned);
      clones.push(cloned);
    }
    if (clones.length === 1) {
      canvas.setActiveObject(clones[0]);
    }
    canvas.requestRenderAll();
    close();
  }

  function handleLockUnlock() {
    if (!canvas || !menu.targets.length) return;
    const locked = !menu.targets[0]?.locked;
    for (const obj of menu.targets) {
      obj.set({
        selectable: !locked,
        evented: !locked,
        locked: locked,
      } as Partial<FabricObject>);
    }
    canvas.requestRenderAll();
    close();
  }

  function handleConvertToImage() {
    if (!canvas || !menu.targets.length) return;
    const obj = menu.targets[0] as FabricObject & { customType?: string; shapeKind?: string };
    obj.set({
      fill: '#1e1e1e',
      stroke: '#2a2a2a',
      strokeWidth: 1,
      strokeDashArray: [6, 4],
    } as Partial<FabricObject>);
    Object.assign(obj, {
      customType: 'image',
      imageId: null,
      fitMode: 'fill',
      name: 'Image Frame',
    });
    delete obj.shapeKind;
    canvas.requestRenderAll();
    close();
  }

  function handleDelete() {
    if (!canvas || !menu.targets.length) return;
    canvas.discardActiveObject();
    for (const obj of menu.targets) canvas.remove(obj);
    canvas.requestRenderAll();
    close();
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  if (!menu.visible) return null;

  const isMulti = menu.targets.length > 1;
  const isLocked = menu.targets[0]?.locked === true;
  const targetCustomType = (menu.targets[0] as FabricObject & { customType?: string })?.customType;
  const canConvertToImage = !isMulti && (targetCustomType === 'shape' || targetCustomType === 'colorBlock');

  return (
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
      <MenuItem label={t('actions.bringToFront')} onClick={handleBringToFront} />
      <MenuItem label={t('actions.bringForward')} onClick={handleBringForward} />
      <MenuItem label={t('actions.sendBackward')} onClick={handleSendBackward} />
      <MenuItem label={t('actions.sendToBack')} onClick={handleSendToBack} />

      <Separator />

      <MenuItem label={t('actions.duplicate')} shortcut="Ctrl D" onClick={handleDuplicate} />

      <Separator />

      <MenuItem
        label={isLocked ? t('actions.unlock') : t('actions.lock')}
        onClick={handleLockUnlock}
      />

      {canConvertToImage && (
        <>
          <Separator />
          <MenuItem label={t('actions.convertToImage')} onClick={handleConvertToImage} />
        </>
      )}

      <Separator />

      <MenuItem
        label={isMulti ? t('actions.deleteCount', { count: menu.targets.length }) : t('actions.delete')}
        shortcut="Del"
        onClick={handleDelete}
        destructive
      />
    </div>
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
