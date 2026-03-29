import {
  ArrowUpToLine,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
  Copy,
  Lock,
  Unlock,
  Trash2,
  Group,
  Ungroup,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore } from '@/stores/canvasStore';
import type { FabricObject } from 'fabric';

export function getSelectedObjects() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return [];
  return canvas.getActiveObjects();
}

export function bringToFront() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  useCanvasStore.getState().captureUndoState?.();
  for (const obj of getSelectedObjects()) canvas.bringObjectToFront(obj);
  canvas.requestRenderAll();
}

export function bringForward() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  useCanvasStore.getState().captureUndoState?.();
  for (const obj of getSelectedObjects()) canvas.bringObjectForward(obj);
  canvas.requestRenderAll();
}

export function sendBackward() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  useCanvasStore.getState().captureUndoState?.();
  for (const obj of [...getSelectedObjects()].reverse()) canvas.sendObjectBackwards(obj);
  canvas.requestRenderAll();
}

export function sendToBack() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  useCanvasStore.getState().captureUndoState?.();
  for (const obj of [...getSelectedObjects()].reverse()) canvas.sendObjectToBack(obj);
  canvas.requestRenderAll();
}

export async function duplicateSelection() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  for (const obj of getSelectedObjects()) {
    const cloned = await obj.clone() as FabricObject;
    cloned.set({ left: (cloned.left ?? 0) + 10, top: (cloned.top ?? 0) + 10 });
    canvas.add(cloned);
  }
  canvas.requestRenderAll();
}

export function toggleLock() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  const objects = getSelectedObjects() as (FabricObject & { locked?: boolean })[];
  if (!objects.length) return;
  const locked = !objects[0].locked;
  for (const obj of objects) {
    obj.set({ selectable: !locked, evented: !locked } as Partial<FabricObject>);
    Object.assign(obj, { locked });
  }
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}

export async function groupSelection() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  const objects = getSelectedObjects();
  if (objects.length < 2) return;
  useCanvasStore.getState().captureUndoState?.();
  const { Group: FabricGroup } = await import('fabric');
  canvas.discardActiveObject();
  objects.forEach((o) => canvas.remove(o));
  const group = new FabricGroup(objects);
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
}

export async function ungroupSelection() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  const active = canvas.getActiveObject();
  if (!active || active.type !== 'Group') return;
  useCanvasStore.getState().captureUndoState?.();
  const { Group: FabricGroup } = await import('fabric');
  const group = active as InstanceType<typeof FabricGroup>;
  const items = group.getObjects();
  canvas.remove(group);
  for (const item of items) {
    // exitGroup handles coordinate transform from group-relative to canvas-absolute
    group.exitGroup(item, false);
    item.setCoords();
    canvas.add(item);
  }
  canvas.requestRenderAll();
}

export function deleteSelection() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  const objects = getSelectedObjects();
  canvas.discardActiveObject();
  for (const obj of objects) canvas.remove(obj);
  canvas.requestRenderAll();
}

interface ActionBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function ActionBtn({ icon, label, onClick, destructive }: ActionBtnProps) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: destructive ? '#ef4444' : '#aaa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#2a2a2a';
        if (!destructive) e.currentTarget.style.color = '#f5f5f5';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        if (!destructive) e.currentTarget.style.color = '#aaa';
      }}
    >
      {icon}
    </button>
  );
}

export function SelectionActions() {
  const selectedCount = useCanvasStore((s) => s.selectedObjectIds.length);
  const isLocked = useCanvasStore((s) => {
    const canvas = s.canvasRef;
    if (!canvas || s.selectedObjectIds.length === 0) return false;
    const obj = canvas.getActiveObject() as FabricObject & { locked?: boolean } | null;
    return obj?.locked === true;
  });
  const isGroup = useCanvasStore((s) => {
    const canvas = s.canvasRef;
    if (!canvas) return false;
    const obj = canvas.getActiveObject();
    return obj?.type === 'Group';
  });

  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '1px solid #2a2a2a',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        flexWrap: 'wrap',
      }}
    >
      <ActionBtn icon={<ArrowUpToLine size={14} />} label={t('actions.bringToFront')} onClick={bringToFront} />
      <ActionBtn icon={<ArrowUp size={14} />} label={t('actions.bringForward')} onClick={bringForward} />
      <ActionBtn icon={<ArrowDown size={14} />} label={t('actions.sendBackward')} onClick={sendBackward} />
      <ActionBtn icon={<ArrowDownToLine size={14} />} label={t('actions.sendToBack')} onClick={sendToBack} />

      <div style={{ width: '1px', height: '20px', background: '#2a2a2a', margin: '0 4px' }} />

      <ActionBtn icon={<Copy size={14} />} label={t('actions.duplicate')} onClick={duplicateSelection} />
      <ActionBtn
        icon={isLocked ? <Unlock size={14} /> : <Lock size={14} />}
        label={isLocked ? t('actions.unlock') : t('actions.lock')}
        onClick={toggleLock}
      />

      <div style={{ width: '1px', height: '20px', background: '#2a2a2a', margin: '0 4px' }} />

      {selectedCount >= 2 && (
        <ActionBtn icon={<Group size={14} />} label={t('actions.group')} onClick={groupSelection} />
      )}
      {isGroup && (
        <ActionBtn icon={<Ungroup size={14} />} label={t('actions.ungroup')} onClick={ungroupSelection} />
      )}

      <div style={{ width: '1px', height: '20px', background: '#2a2a2a', margin: '0 4px' }} />

      <ActionBtn icon={<Trash2 size={14} />} label={t('actions.delete')} onClick={deleteSelection} destructive />
    </div>
  );
}
