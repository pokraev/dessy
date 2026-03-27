'use client';

import { useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';

export function BottomBar() {
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInput, setZoomInput] = useState('');

  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const currentProject = useProjectStore((s) => s.currentProject);

  const currentPageIndex = currentProject?.currentPageIndex ?? 0;
  const totalPages = currentProject?.pages.length ?? 1;

  const zoomPct = Math.round(zoom * 100);

  function handleZoomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setZoom(value / 100);
    }
  }

  function handleZoomLabelClick() {
    setZoomInput(String(zoomPct));
    setIsEditingZoom(true);
  }

  function handleZoomInputSave() {
    const value = parseInt(zoomInput, 10);
    if (!isNaN(value)) {
      const clamped = Math.min(500, Math.max(10, value));
      setZoom(clamped / 100);
    }
    setIsEditingZoom(false);
  }

  function handleZoomInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleZoomInputSave();
    } else if (e.key === 'Escape') {
      setIsEditingZoom(false);
    }
  }

  return (
    <div
      className="flex items-center justify-between px-4 bg-surface border-t border-border"
      style={{ height: '36px', minHeight: '36px' }}
    >
      {/* Left: Zoom slider + percentage */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={10}
          max={500}
          step={1}
          value={zoomPct}
          onChange={handleZoomChange}
          className="cursor-pointer"
          style={{
            width: '160px',
            accentColor: '#6366f1',
          }}
          aria-label="Zoom level"
        />
        {isEditingZoom ? (
          <input
            type="number"
            min={10}
            max={500}
            value={zoomInput}
            onChange={(e) => setZoomInput(e.target.value)}
            onBlur={handleZoomInputSave}
            onKeyDown={handleZoomInputKeyDown}
            className="bg-surface-raised border border-accent rounded px-1 outline-none text-text-primary"
            style={{
              width: '52px',
              fontSize: '13px',
              fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
              height: '24px',
            }}
            autoFocus
          />
        ) : (
          <span
            className="text-text-primary cursor-pointer hover:text-accent select-none"
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
              minWidth: '44px',
            }}
            onClick={handleZoomLabelClick}
            title="Click to set zoom level"
          >
            {zoomPct}%
          </span>
        )}
      </div>

      {/* Center: Page indicator */}
      <div
        className="text-text-secondary select-none"
        style={{ fontSize: '12px' }}
      >
        Page {currentPageIndex + 1} of {totalPages}
      </div>

      {/* Right: Grid toggle */}
      <button
        aria-label="Toggle grid"
        onClick={toggleGrid}
        className="flex items-center justify-center transition-colors"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          background: showGrid ? '#6366f1' : 'transparent',
          cursor: 'pointer',
        }}
      >
        <Grid3x3
          size={16}
          style={{ color: showGrid ? '#f5f5f5' : '#888888' }}
        />
      </button>
    </div>
  );
}
