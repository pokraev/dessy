'use client';

import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { useCanvasStore, type ToolId } from '@/stores/canvasStore';

interface ToolItem {
  id: ToolId;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  ariaLabel: string;
}

const TOOLS: ToolItem[] = [
  {
    id: 'select',
    icon: <MousePointer2 size={16} />,
    label: 'Select',
    shortcut: 'V',
    ariaLabel: 'Select tool (V)',
  },
  {
    id: 'text',
    icon: <Type size={16} />,
    label: 'Text',
    shortcut: 'T',
    ariaLabel: 'Text tool (T)',
  },
  {
    id: 'triangle',
    icon: <Triangle size={16} />,
    label: 'Triangle',
    shortcut: 'G',
    ariaLabel: 'Triangle tool (G)',
  },
  {
    id: 'rect',
    icon: <Square size={16} />,
    label: 'Rectangle',
    shortcut: 'R',
    ariaLabel: 'Rectangle tool (R)',
  },
  {
    id: 'circle',
    icon: <Circle size={16} />,
    label: 'Circle',
    shortcut: 'C',
    ariaLabel: 'Circle tool (C)',
  },
  {
    id: 'line',
    icon: <Minus size={16} />,
    label: 'Line',
    shortcut: 'L',
    ariaLabel: 'Line tool (L)',
  },
  {
    id: 'image',
    icon: <Image size={16} />,
    label: 'Image',
    shortcut: 'I',
    ariaLabel: 'Image tool (I)',
  },
  {
    id: 'hand',
    icon: <Hand size={16} />,
    label: 'Pan',
    shortcut: 'H',
    ariaLabel: 'Pan tool (H)',
  },
];

interface ToolButtonProps {
  tool: ToolItem;
  isActive: boolean;
  onSelect: (id: ToolId) => void;
}

function ToolButton({ tool, isActive, onSelect }: ToolButtonProps) {
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
        aria-label={tool.ariaLabel}
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
          {tool.label} {tool.shortcut}
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

export function ToolBar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const selectedCount = useCanvasStore((s) => s.selectedObjectIds.length);

  function handleSelect(id: ToolId) {
    useCanvasStore.getState().setActiveTool(id);
  }

  return (
    <div
      className="flex flex-col items-center bg-surface"
      style={{
        padding: '8px',
        gap: '8px',
        height: '100%',
        width: '280px',
      }}
    >
      {/* Drawing tools */}
      {TOOLS.map((tool) => (
        <ToolButton
          key={tool.id}
          tool={tool}
          isActive={activeTool === tool.id}
          onSelect={handleSelect}
        />
      ))}

      {/* Separator */}
      <div style={{ width: '24px', height: '1px', background: '#2a2a2a', margin: '4px 0' }} />

      {/* Arrangement actions */}
      <ActionButton
        icon={<AlignHorizontalDistributeCenter size={16} />}
        label="Distribute Horizontally"
        disabled={selectedCount < 3}
        onClick={distributeHorizontally}
      />
      <ActionButton
        icon={<AlignVerticalDistributeCenter size={16} />}
        label="Distribute Vertically"
        disabled={selectedCount < 3}
        onClick={distributeVertically}
      />
      <ActionButton
        icon={<RectangleHorizontal size={16} />}
        label="Make Same Size"
        disabled={selectedCount < 2}
        onClick={makeSameSize}
      />
    </div>
  );
}
