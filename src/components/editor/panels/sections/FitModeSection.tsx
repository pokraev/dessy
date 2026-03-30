
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ObjectSnapshot } from '@/hooks/useSelectedObject';

interface FitModeSectionProps {
  snapshot: ObjectSnapshot;
}

type FitMode = 'fill' | 'fit' | 'stretch';

function updateCanvasObject(updates: Record<string, unknown>) {
  const canvas = useCanvasStore.getState().canvasRef;
  const obj = canvas?.getActiveObject();
  if (!obj || !canvas) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (obj as any).set(updates);
  obj.setCoords();
  canvas.renderAll();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas.fire('object:modified', { target: obj } as any);
}

export function FitModeSection({ snapshot }: FitModeSectionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  if (snapshot.type !== 'image') return null;

  const activeFitMode = (snapshot.fitMode as FitMode | undefined) ?? 'fill';

  const handleFitMode = (mode: FitMode) => {
    updateCanvasObject({ fitMode: mode });
  };

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    height: '28px',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? '#6366f1' : '#1e1e1e',
    borderTop: `1px solid ${active ? '#6366f1' : '#2a2a2a'}`,
    borderBottom: `1px solid ${active ? '#6366f1' : '#2a2a2a'}`,
    borderLeft: `1px solid ${active ? '#6366f1' : '#2a2a2a'}`,
    borderRight: `1px solid ${active ? '#6366f1' : '#2a2a2a'}`,
    cursor: 'pointer',
    fontSize: '11px',
    color: active ? '#f5f5f5' : '#888888',
    fontFamily: 'Inter, sans-serif',
  });

  return (
    <div style={{ borderBottom: '1px solid #2a2a2a' }}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '32px',
          padding: '0 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#888888',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t('fitMode.title')}
        </span>
        <ChevronDown
          size={16}
          color="#888888"
          style={{
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 150ms ease-in-out',
          }}
        />
      </button>

      {isOpen && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ display: 'flex' }}>
            <button
              style={{ ...buttonStyle(activeFitMode === 'fill'), borderRadius: '4px 0 0 4px' }}
              onClick={() => handleFitMode('fill')}
            >
              {t('fitMode.fill')}
            </button>
            <button
              style={{ ...buttonStyle(activeFitMode === 'fit'), borderRadius: '0', borderLeft: 'none', borderRight: 'none' }}
              onClick={() => handleFitMode('fit')}
            >
              {t('fitMode.fit')}
            </button>
            <button
              style={{ ...buttonStyle(activeFitMode === 'stretch'), borderRadius: '0 4px 4px 0' }}
              onClick={() => handleFitMode('stretch')}
            >
              {t('fitMode.stretch')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
