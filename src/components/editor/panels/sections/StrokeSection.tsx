'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { ColorPicker } from '../ColorPicker';
import { NumberInput } from '../NumberInput';
import type { ObjectSnapshot } from '@/hooks/useSelectedObject';

interface StrokeSectionProps {
  snapshot: ObjectSnapshot;
}

type StrokeStyle = 'solid' | 'dashed' | 'dotted';

const DASH_ARRAYS: Record<StrokeStyle, number[] | null> = {
  solid: null,
  dashed: [8, 4],
  dotted: [2, 2],
};

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

function styleButtonStyle(active: boolean): React.CSSProperties {
  return {
    height: '28px',
    width: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? '#6366f1' : '#1e1e1e',
    border: `1px solid ${active ? '#6366f1' : '#2a2a2a'}`,
    cursor: 'pointer',
    fontSize: '11px',
    color: active ? '#f5f5f5' : '#888888',
    fontFamily: 'Inter, sans-serif',
  };
}

export function StrokeSection({ snapshot }: StrokeSectionProps) {
  const [isOn, setIsOn] = useState(snapshot.strokeWidth > 0);
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>('solid');

  const strokeColor = snapshot.stroke ?? '#000000';
  const strokeWidth = isNaN(snapshot.strokeWidth) ? 1 : snapshot.strokeWidth;

  const handleToggle = useCallback((on: boolean) => {
    setIsOn(on);
    if (!on) {
      updateCanvasObject({ stroke: null, strokeWidth: 0, strokeDashArray: null });
    } else {
      updateCanvasObject({ stroke: '#000000', strokeWidth: 1, strokeDashArray: null });
    }
  }, []);

  const handleColorChange = useCallback((hex: string) => {
    updateCanvasObject({ stroke: hex });
  }, []);

  const handleWidthChange = useCallback((v: number) => {
    updateCanvasObject({ strokeWidth: v });
  }, []);

  const handleStyleChange = useCallback((style: StrokeStyle) => {
    setStrokeStyle(style);
    updateCanvasObject({ strokeDashArray: DASH_ARRAYS[style] });
  }, []);

  return (
    <div style={{ borderBottom: '1px solid #2a2a2a' }}>
      {/* Section Header with toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '32px',
          padding: '0 16px',
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
          Stroke
        </span>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          title="Stroke"
        >
          <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif' }}>
            Stroke
          </span>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              type="checkbox"
              checked={isOn}
              onChange={(e) => handleToggle(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
            />
            <div
              onClick={() => handleToggle(!isOn)}
              style={{
                width: '28px',
                height: '16px',
                background: isOn ? '#6366f1' : '#2a2a2a',
                borderRadius: '8px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: isOn ? '14px' : '2px',
                  width: '12px',
                  height: '12px',
                  background: '#f5f5f5',
                  borderRadius: '50%',
                  transition: 'left 150ms',
                }}
              />
            </div>
          </div>
        </label>
      </div>

      {isOn && (
        <div style={{ padding: '0 16px 12px' }}>
          {/* Color row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif', width: '40px' }}>
              Color
            </span>
            <ColorPicker value={strokeColor} onChange={handleColorChange} />
          </div>

          {/* Width row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif', width: '40px' }}>
              Width
            </span>
            <div style={{ flex: 1 }}>
              <NumberInput
                value={strokeWidth}
                onChange={handleWidthChange}
                step={0.5}
                min={0}
                suffix="px"
              />
            </div>
          </div>

          {/* Style buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif', width: '40px', marginRight: '8px' }}>
              Style
            </span>
            <div style={{ display: 'flex' }}>
              <button
                style={{ ...styleButtonStyle(strokeStyle === 'solid'), borderRadius: '4px 0 0 4px' }}
                onClick={() => handleStyleChange('solid')}
              >
                Solid
              </button>
              <button
                style={{ ...styleButtonStyle(strokeStyle === 'dashed'), borderRadius: '0', borderLeft: 'none', borderRight: 'none' }}
                onClick={() => handleStyleChange('dashed')}
              >
                Dashed
              </button>
              <button
                style={{ ...styleButtonStyle(strokeStyle === 'dotted'), borderRadius: '0 4px 4px 0' }}
                onClick={() => handleStyleChange('dotted')}
              >
                Dotted
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
