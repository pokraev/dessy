'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  Image,
  Hand,
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

export function ToolBar() {
  const activeTool = useCanvasStore((s) => s.activeTool);

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
      {TOOLS.map((tool) => (
        <ToolButton
          key={tool.id}
          tool={tool}
          isActive={activeTool === tool.id}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
