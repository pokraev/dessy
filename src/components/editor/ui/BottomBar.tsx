
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid3x3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { useProjectStore } from '@/stores/projectStore';

export function BottomBar() {
  const { t } = useTranslation();
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
          aria-label={t('bottomBar.zoomLevel')}
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
            title={t('bottomBar.clickToSetZoom')}
          >
            {zoomPct}%
          </span>
        )}
      </div>

      {/* Center: Page navigator */}
      <div className="flex items-center gap-1 select-none">
        <button
          aria-label={t('bottomBar.previousPage')}
          disabled={currentPageIndex === 0}
          onClick={() => {
            const fn = useCanvasStore.getState().triggerSwitchPage;
            if (fn) fn(currentPageIndex - 1);
          }}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            border: 'none',
            background: 'transparent',
            cursor: currentPageIndex === 0 ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={14} style={{ color: currentPageIndex === 0 ? '#333' : '#888' }} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => {
              const fn = useCanvasStore.getState().triggerSwitchPage;
              if (fn) fn(i);
            }}
            style={{
              minWidth: '24px',
              height: '24px',
              borderRadius: '4px',
              border: i === currentPageIndex ? '1px solid #6366f1' : '1px solid transparent',
              background: i === currentPageIndex ? '#1a1a2e' : 'transparent',
              color: i === currentPageIndex ? '#818cf8' : '#888',
              fontSize: '11px',
              fontWeight: i === currentPageIndex ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {i + 1}
          </button>
        ))}
        <button
          aria-label={t('bottomBar.nextPage')}
          disabled={currentPageIndex >= totalPages - 1}
          onClick={() => {
            const fn = useCanvasStore.getState().triggerSwitchPage;
            if (fn) fn(currentPageIndex + 1);
          }}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            border: 'none',
            background: 'transparent',
            cursor: currentPageIndex >= totalPages - 1 ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight size={14} style={{ color: currentPageIndex >= totalPages - 1 ? '#333' : '#888' }} />
        </button>
      </div>

      {/* Right: Grid toggle */}
      <button
        aria-label={t('bottomBar.toggleGrid')}
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
