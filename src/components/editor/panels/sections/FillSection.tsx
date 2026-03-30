
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Gradient } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';
import { ColorPicker } from '../ColorPicker';
import type { ObjectSnapshot } from '@/hooks/useSelectedObject';

interface FillSectionProps {
  snapshot: ObjectSnapshot;
}

type FillMode = 'solid' | 'gradient' | 'none';

function updateCanvasObject(updates: Record<string, unknown>) {
  const canvas = useCanvasStore.getState().canvasRef;
  const obj = canvas?.getActiveObject();
  if (!obj || !canvas) return;
  // For text objects in editing mode: exit editing first so fill applies to the whole object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textObj = obj as any;
  if (textObj.isEditing && typeof textObj.exitEditing === 'function') {
    textObj.exitEditing();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (obj as any).set(updates);
  obj.setCoords();
  canvas.renderAll();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas.fire('object:modified', { target: obj } as any);
}

/** Compute gradient coords from angle (degrees) in percentage units. */
function angleToCoordsPercent(angleDeg: number): { x1: number; y1: number; x2: number; y2: number } {
  const rad = (angleDeg * Math.PI) / 180;
  // center is 0.5,0.5; compute direction from center along unit circle
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  // Clamp so that start/end stay in [0,1]
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const scale = absX > 0 || absY > 0 ? Math.max(absX, absY) * 2 : 1;
  return {
    x1: 0.5 - dx / scale,
    y1: 0.5 - dy / scale,
    x2: 0.5 + dx / scale,
    y2: 0.5 + dy / scale,
  };
}

const GRADIENT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/** Simple arrow SVG rotated to indicate direction. */
function AngleArrow({ angle }: { angle: number }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      style={{ transform: `rotate(${angle}deg)`, display: 'block' }}
    >
      <line x1="6" y1="10" x2="6" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <polyline points="3,5 6,2 9,5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FillSection({ snapshot }: FillSectionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [fillMode, setFillMode] = useState<FillMode>('solid');
  const [gradStop1, setGradStop1] = useState('#6366f1');
  const [gradStop2, setGradStop2] = useState('#a855f7');
  const [gradAngle, setGradAngle] = useState(0);

  const canGradient = snapshot.type === 'shape' || snapshot.type === 'colorBlock';

  // Derive current solid color safely
  const solidColor =
    snapshot.fill && typeof snapshot.fill === 'string' && snapshot.fill.startsWith('#')
      ? snapshot.fill
      : '#000000';

  const handleSolidChange = useCallback((hex: string) => {
    updateCanvasObject({ fill: hex });
  }, []);

  const handleSwatchApply = useCallback((swatchId: string, hex: string) => {
    updateCanvasObject({ fill: hex, swatchId });
  }, []);

  const handleGradientChange = useCallback(
    (stop1: string, stop2: string, angle: number) => {
      const coords = angleToCoordsPercent(angle);
      const gradient = new Gradient({
        type: 'linear',
        gradientUnits: 'percentage',
        coords: { x1: coords.x1, y1: coords.y1, x2: coords.x2, y2: coords.y2 },
        colorStops: [
          { offset: 0, color: stop1 },
          { offset: 1, color: stop2 },
        ],
      });
      updateCanvasObject({ fill: gradient });
    },
    []
  );

  const handleClearFill = useCallback(() => {
    updateCanvasObject({ fill: 'transparent' });
  }, []);

  const modeButtonStyle = (active: boolean): React.CSSProperties => ({
    height: '22px',
    padding: '0 8px',
    background: active ? '#6366f1' : '#1e1e1e',
    border: `1px solid ${active ? '#6366f1' : '#2a2a2a'}`,
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
    color: active ? '#f5f5f5' : '#888888',
    fontFamily: 'Inter, sans-serif',
  });

  return (
    <div style={{ borderBottom: '1px solid #2a2a2a' }}>
      {/* Section Header */}
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
          {t('fill.title')}
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
          {/* Fill type toggle row */}
          {canGradient && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <button style={modeButtonStyle(fillMode === 'solid')} onClick={() => { setFillMode('solid'); updateCanvasObject({ fill: solidColor }); }}>
                {t('fill.solid')}
              </button>
              <button style={modeButtonStyle(fillMode === 'gradient')} onClick={() => setFillMode('gradient')}>
                {t('fill.gradient')}
              </button>
              <button style={modeButtonStyle(fillMode === 'none')} onClick={() => { setFillMode('none'); handleClearFill(); }}>
                {t('fill.none')}
              </button>
            </div>
          )}

          {!canGradient && (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <button style={modeButtonStyle(fillMode !== 'none')} onClick={() => { setFillMode('solid'); updateCanvasObject({ fill: solidColor }); }}>
                {t('fill.solid')}
              </button>
              <button style={modeButtonStyle(fillMode === 'none')} onClick={() => { setFillMode('none'); handleClearFill(); }}>
                {t('fill.none')}
              </button>
            </div>
          )}

          {/* Solid fill */}
          {fillMode === 'solid' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ColorPicker
                value={solidColor}
                onChange={handleSolidChange}
                onSwatchApply={handleSwatchApply}
              />
              <span style={{ fontSize: '13px', color: '#f5f5f5', fontFamily: "'JetBrains Mono', monospace" }}>
                {solidColor.toUpperCase()}
              </span>
            </div>
          )}

          {/* Gradient fill */}
          {fillMode === 'gradient' && canGradient && (
            <div>
              {/* Stop colors */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif' }}>{t('fill.from')}</span>
                  <ColorPicker
                    value={gradStop1}
                    onChange={(hex) => {
                      setGradStop1(hex);
                      handleGradientChange(hex, gradStop2, gradAngle);
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif' }}>{t('fill.to')}</span>
                  <ColorPicker
                    value={gradStop2}
                    onChange={(hex) => {
                      setGradStop2(hex);
                      handleGradientChange(gradStop1, hex, gradAngle);
                    }}
                  />
                </div>
              </div>

              {/* Direction picker — 8 angles in 2x4 grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 24px)',
                  gap: '4px',
                }}
              >
                {GRADIENT_ANGLES.map((angle) => (
                  <button
                    key={angle}
                    onClick={() => {
                      setGradAngle(angle);
                      handleGradientChange(gradStop1, gradStop2, angle);
                    }}
                    title={`${angle}°`}
                    style={{
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: gradAngle === angle ? '#6366f1' : '#1e1e1e',
                      border: `1px solid ${gradAngle === angle ? '#6366f1' : '#2a2a2a'}`,
                      borderRadius: '3px',
                      cursor: 'pointer',
                      color: gradAngle === angle ? '#f5f5f5' : '#888888',
                    }}
                  >
                    <AngleArrow angle={angle} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
