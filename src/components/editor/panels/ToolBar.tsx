
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MousePointer2,
  Type,
  Triangle,
  Square,
  Circle,
  Minus,
  Image,
  Hand,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  RectangleHorizontal,
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
import { useCanvasStore, type ToolId } from '@/stores/canvasStore';
import {
  bringToFront, bringForward, sendBackward, sendToBack,
  duplicateSelection, toggleLock, groupSelection, ungroupSelection, deleteSelection,
} from './SelectionActions';

interface ToolItem {
  id: ToolId;
  icon: React.ReactNode;
  labelKey: string;
  shortcut: string;
}

const TOOLS: ToolItem[] = [
  {
    id: 'select',
    icon: <MousePointer2 size={16} />,
    labelKey: 'tools.select',
    shortcut: 'V',
  },
  {
    id: 'text',
    icon: <Type size={16} />,
    labelKey: 'tools.text',
    shortcut: 'T',
  },
  {
    id: 'triangle',
    icon: <Triangle size={16} />,
    labelKey: 'tools.triangle',
    shortcut: 'G',
  },
  {
    id: 'rect',
    icon: <Square size={16} />,
    labelKey: 'tools.rect',
    shortcut: 'R',
  },
  {
    id: 'circle',
    icon: <Circle size={16} />,
    labelKey: 'tools.circle',
    shortcut: 'C',
  },
  {
    id: 'line',
    icon: <Minus size={16} />,
    labelKey: 'tools.line',
    shortcut: 'L',
  },
  {
    id: 'image',
    icon: <Image size={16} />,
    labelKey: 'tools.image',
    shortcut: 'I',
  },
  {
    id: 'hand',
    icon: <Hand size={16} />,
    labelKey: 'tools.pan',
    shortcut: 'H',
  },
];

interface ToolButtonProps {
  tool: ToolItem;
  isActive: boolean;
  onSelect: (id: ToolId) => void;
}

function ToolButton({ tool, isActive, onSelect }: ToolButtonProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    setIsHovered(true);
    tooltipTimerRef.current = setTimeout(() => {
      setTooltipVisible(true);
    }, 600);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setTooltipVisible(false);
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  const bgColor = isActive ? '#6366f1' : isHovered ? '#1e1e1e' : 'transparent';
  const iconColor = isActive || isHovered ? '#f5f5f5' : '#888888';

  return (
    <div className="relative">
      <button
        aria-label={`${t(tool.labelKey)} (${tool.shortcut})`}
        aria-pressed={isActive}
        onClick={() => onSelect(tool.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-center justify-center transition-colors"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: bgColor,
          border: 'none',
          cursor: 'pointer',
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {tool.icon}
      </button>

      {/* Tooltip */}
      {tooltipVisible && (
        <div
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none z-50"
          style={{
            background: '#141414',
            color: '#f5f5f5',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            padding: '4px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            border: '1px solid #2a2a2a',
            opacity: tooltipVisible ? 1 : 0,
            transition: 'opacity 0.1s ease-in',
          }}
        >
          {t(tool.labelKey)} {tool.shortcut}
        </div>
      )}
    </div>
  );
}

// ── Arrangement actions ───────────────────────────────────────────────────────

function distributeHorizontally() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  const objects = canvas.getActiveObjects();
  if (objects.length < 3) return;

  objects.sort((a, b) => (a.left ?? 0) - (b.left ?? 0));
  const first = objects[0];
  const last = objects[objects.length - 1];
  const totalSpan = ((last.left ?? 0) + (last.width ?? 0) * (last.scaleX ?? 1)) - (first.left ?? 0);
  const totalObjWidth = objects.reduce((sum, o) => sum + (o.width ?? 0) * (o.scaleX ?? 1), 0);
  const gap = (totalSpan - totalObjWidth) / (objects.length - 1);

  let x = first.left ?? 0;
  for (const obj of objects) {
    obj.set({ left: x });
    obj.setCoords();
    x += (obj.width ?? 0) * (obj.scaleX ?? 1) + gap;
  }
  canvas.requestRenderAll();
}

function distributeVertically() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  const objects = canvas.getActiveObjects();
  if (objects.length < 3) return;

  objects.sort((a, b) => (a.top ?? 0) - (b.top ?? 0));
  const first = objects[0];
  const last = objects[objects.length - 1];
  const totalSpan = ((last.top ?? 0) + (last.height ?? 0) * (last.scaleY ?? 1)) - (first.top ?? 0);
  const totalObjHeight = objects.reduce((sum, o) => sum + (o.height ?? 0) * (o.scaleY ?? 1), 0);
  const gap = (totalSpan - totalObjHeight) / (objects.length - 1);

  let y = first.top ?? 0;
  for (const obj of objects) {
    obj.set({ top: y });
    obj.setCoords();
    y += (obj.height ?? 0) * (obj.scaleY ?? 1) + gap;
  }
  canvas.requestRenderAll();
}

function makeSameSize() {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  const objects = canvas.getActiveObjects();
  if (objects.length < 2) return;

  const ref = objects[0];
  const targetW = (ref.width ?? 0) * (ref.scaleX ?? 1);
  const targetH = (ref.height ?? 0) * (ref.scaleY ?? 1);

  for (let i = 1; i < objects.length; i++) {
    const obj = objects[i];
    const w = obj.width ?? 1;
    const h = obj.height ?? 1;
    obj.set({
      scaleX: targetW / w,
      scaleY: targetH / h,
    });
    obj.setCoords();
  }
  canvas.requestRenderAll();
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}

function ActionButton({ icon, label, disabled, onClick }: ActionButtonProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleEnter() {
    timerRef.current = setTimeout(() => setTooltipVisible(true), 600);
  }
  function handleLeave() {
    setTooltipVisible(false);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="relative">
      <button
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: 'transparent',
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          color: disabled ? '#555' : '#aaa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
          transition: 'color 0.15s',
        }}
      >
        {icon}
      </button>
      {tooltipVisible && !disabled && (
        <div
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none z-50"
          style={{
            background: '#141414',
            color: '#f5f5f5',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            border: '1px solid #2a2a2a',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function AccordionGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #2a2a2a' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '6px 4px',
          fontSize: '10px',
          fontWeight: 600,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'Inter, sans-serif',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          textAlign: 'left',
        }}
      >
        <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', fontSize: '8px' }}>&#9654;</span>
        {title}
      </button>
      {open && <div style={{ padding: '0 4px 6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>{children}</div>}
    </div>
  );
}

export function ToolBar() {
  const { t } = useTranslation();
  const activeTool = useCanvasStore((s) => s.activeTool);
  const selectedCount = useCanvasStore((s) => s.selectedObjectIds.length);
  const isLocked = useCanvasStore((s) => {
    const c = s.canvasRef;
    if (!c || s.selectedObjectIds.length === 0) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (c.getActiveObject() as any)?.locked === true;
  });
  const isGroup = useCanvasStore((s) => {
    const c = s.canvasRef;
    return c?.getActiveObject()?.type === 'group';
  });

  function handleSelect(id: ToolId) {
    useCanvasStore.getState().setActiveTool(id);
  }

  const pointerGroup = TOOLS.filter((t) => t.id === 'select' || t.id === 'hand');
  const shapeGroup = TOOLS.filter((t) => ['rect', 'circle', 'triangle', 'line'].includes(t.id));
  const contentGroup = TOOLS.filter((t) => t.id === 'text' || t.id === 'image');

  return (
    <div
      className="bg-surface"
      style={{
        padding: '4px',
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AccordionGroup title={t('toolGroups.pointer')}>
        {pointerGroup.map((tool) => (
          <ToolButton key={tool.id} tool={tool} isActive={activeTool === tool.id} onSelect={handleSelect} />
        ))}
      </AccordionGroup>

      <AccordionGroup title={t('toolGroups.shapes')}>
        {shapeGroup.map((tool) => (
          <ToolButton key={tool.id} tool={tool} isActive={activeTool === tool.id} onSelect={handleSelect} />
        ))}
      </AccordionGroup>

      <AccordionGroup title={t('toolGroups.content')}>
        {contentGroup.map((tool) => (
          <ToolButton key={tool.id} tool={tool} isActive={activeTool === tool.id} onSelect={handleSelect} />
        ))}
      </AccordionGroup>

      <AccordionGroup title={t('toolGroups.arrange')}>
        <ActionButton
          icon={<AlignHorizontalDistributeCenter size={16} />}
          label={t('tools.distributeH')}
          disabled={selectedCount < 3}
          onClick={distributeHorizontally}
        />
        <ActionButton
          icon={<AlignVerticalDistributeCenter size={16} />}
          label={t('tools.distributeV')}
          disabled={selectedCount < 3}
          onClick={distributeVertically}
        />
        <ActionButton
          icon={<RectangleHorizontal size={16} />}
          label={t('tools.sameSize')}
          disabled={selectedCount < 2}
          onClick={makeSameSize}
        />
      </AccordionGroup>

      <AccordionGroup title={t('toolGroups.zOrder')}>
        <ActionButton icon={<ArrowUpToLine size={16} />} label={t('actions.bringToFront')} disabled={selectedCount === 0} onClick={bringToFront} />
        <ActionButton icon={<ArrowUp size={16} />} label={t('actions.bringForward')} disabled={selectedCount === 0} onClick={bringForward} />
        <ActionButton icon={<ArrowDown size={16} />} label={t('actions.sendBackward')} disabled={selectedCount === 0} onClick={sendBackward} />
        <ActionButton icon={<ArrowDownToLine size={16} />} label={t('actions.sendToBack')} disabled={selectedCount === 0} onClick={sendToBack} />
      </AccordionGroup>

      <AccordionGroup title={t('toolGroups.edit')}>
        <ActionButton icon={<Copy size={16} />} label={t('actions.duplicate')} disabled={selectedCount === 0} onClick={() => duplicateSelection()} />
        <ActionButton icon={isLocked ? <Unlock size={16} /> : <Lock size={16} />} label={isLocked ? t('actions.unlock') : t('actions.lock')} disabled={selectedCount === 0} onClick={toggleLock} />
        <ActionButton icon={<Group size={16} />} label={t('actions.group')} disabled={selectedCount < 2} onClick={() => groupSelection()} />
        <ActionButton icon={<Ungroup size={16} />} label={t('actions.ungroup')} disabled={!isGroup} onClick={() => ungroupSelection()} />
        <ActionButton icon={<Trash2 size={16} />} label={t('actions.delete')} disabled={selectedCount === 0} onClick={deleteSelection} />
      </AccordionGroup>
    </div>
  );
}
