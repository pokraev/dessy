'use client';

import { useState, useCallback } from 'react';
import { Shadow } from 'fabric';
import { useCanvasStore } from '@/stores/canvasStore';
import { ColorPicker } from '../ColorPicker';
import { NumberInput } from '../NumberInput';
import type { ObjectSnapshot } from '@/hooks/useSelectedObject';

interface ShadowSectionProps {
  snapshot: ObjectSnapshot;
}

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

export function ShadowSection({ snapshot }: ShadowSectionProps) {
  const hasShadow = snapshot.shadow !== null;
  const [isOn, setIsOn] = useState(hasShadow);

  // Shadow controls state — initialize from snapshot or defaults
  const [offsetX, setOffsetX] = useState(snapshot.shadow?.offsetX ?? 4);
  const [offsetY, setOffsetY] = useState(snapshot.shadow?.offsetY ?? 4);
  const [blur, setBlur] = useState(snapshot.shadow?.blur ?? 8);
  const [color, setColor] = useState(snapshot.shadow?.color ?? 'rgba(0,0,0,0.5)');

  const handleToggle = useCallback((on: boolean) => {
    setIsOn(on);
    if (on) {
      updateCanvasObject({
        shadow: new Shadow({ offsetX, offsetY, blur, color }),
      });
    } else {
      updateCanvasObject({ shadow: null });
    }
  }, [offsetX, offsetY, blur, color]);

  const handleOffsetX = useCallback((v: number) => {
    setOffsetX(v);
    updateCanvasObject({ shadow: new Shadow({ offsetX: v, offsetY, blur, color }) });
  }, [offsetY, blur, color]);

  const handleOffsetY = useCallback((v: number) => {
    setOffsetY(v);
    updateCanvasObject({ shadow: new Shadow({ offsetX, offsetY: v, blur, color }) });
  }, [offsetX, blur, color]);

  const handleBlur = useCallback((v: number) => {
    setBlur(v);
    updateCanvasObject({ shadow: new Shadow({ offsetX, offsetY, blur: v, color }) });
  }, [offsetX, offsetY, color]);

  const handleColor = useCallback((hex: string) => {
    setColor(hex);
    updateCanvasObject({ shadow: new Shadow({ offsetX, offsetY, blur, color: hex }) });
  }, [offsetX, offsetY, blur]);

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
          Shadow
        </span>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif' }}>
            Shadow
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
          {/* X / Y offset row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <NumberInput value={offsetX} onChange={handleOffsetX} step={1} suffix="px" label="X" />
            </div>
            <div style={{ flex: 1 }}>
              <NumberInput value={offsetY} onChange={handleOffsetY} step={1} suffix="px" label="Y" />
            </div>
          </div>

          {/* Blur row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <NumberInput value={blur} onChange={handleBlur} step={1} min={0} suffix="px" label="Blur" />
            </div>
            <div style={{ flex: 1 }} />
          </div>

          {/* Color row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif', width: '40px' }}>
              Color
            </span>
            <ColorPicker value={color.startsWith('#') ? color : '#000000'} onChange={handleColor} />
          </div>
        </div>
      )}
    </div>
  );
}
