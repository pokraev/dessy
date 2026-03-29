'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, Link, Link2Off } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { NumberInput } from '../NumberInput';
import { mmToPx } from '@/lib/units';
import type { ObjectSnapshot } from '@/hooks/useSelectedObject';

interface PositionSectionProps {
  snapshot: ObjectSnapshot;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export function PositionSection({ snapshot }: PositionSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [aspectLocked, setAspectLocked] = useState(false);

  const isMulti = snapshot.type === null && snapshot.id === '__multi__';
  const isShape = snapshot.type === 'shape';

  const handleX = useCallback((v: number) => {
    updateCanvasObject({ left: mmToPx(v) });
  }, []);

  const handleY = useCallback((v: number) => {
    updateCanvasObject({ top: mmToPx(v) });
  }, []);

  const handleW = useCallback((v: number) => {
    const canvas = useCanvasStore.getState().canvasRef;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = canvas?.getActiveObject() as any;
    if (!obj || !canvas) return;
    const newWPx = mmToPx(v);
    if (aspectLocked && snapshot.w > 0 && snapshot.h > 0) {
      const ratio = snapshot.h / snapshot.w;
      const newHPx = newWPx * ratio;
      const scaleX = newWPx / (obj.width ?? 1);
      const scaleY = newHPx / (obj.height ?? 1);
      obj.set({ scaleX, scaleY });
    } else {
      const scaleX = newWPx / (obj.width ?? 1);
      obj.set({ scaleX });
    }
    obj.setCoords();
    canvas.renderAll();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvas.fire('object:modified', { target: obj } as any);
  }, [aspectLocked, snapshot.w, snapshot.h]);

  const handleH = useCallback((v: number) => {
    const canvas = useCanvasStore.getState().canvasRef;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = canvas?.getActiveObject() as any;
    if (!obj || !canvas) return;
    const newHPx = mmToPx(v);
    if (aspectLocked && snapshot.w > 0 && snapshot.h > 0) {
      const ratio = snapshot.w / snapshot.h;
      const newWPx = newHPx * ratio;
      const scaleX = newWPx / (obj.width ?? 1);
      const scaleY = newHPx / (obj.height ?? 1);
      obj.set({ scaleX, scaleY });
    } else {
      const scaleY = newHPx / (obj.height ?? 1);
      obj.set({ scaleY });
    }
    obj.setCoords();
    canvas.renderAll();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvas.fire('object:modified', { target: obj } as any);
  }, [aspectLocked, snapshot.w, snapshot.h]);

  const handleRotation = useCallback((v: number) => {
    updateCanvasObject({ angle: v });
  }, []);

  const handleOpacity = useCallback((v: number) => {
    updateCanvasObject({ opacity: v / 100 });
  }, []);

  const handleRadius = useCallback((v: number) => {
    updateCanvasObject({ rx: v, ry: v });
  }, []);

  const xVal = isNaN(snapshot.x) ? 0 : Math.round(snapshot.x * 100) / 100;
  const yVal = isNaN(snapshot.y) ? 0 : Math.round(snapshot.y * 100) / 100;
  const wVal = isNaN(snapshot.w) ? 0 : Math.round(snapshot.w * 100) / 100;
  const hVal = isNaN(snapshot.h) ? 0 : Math.round(snapshot.h * 100) / 100;
  const rotVal = isNaN(snapshot.rotation) ? 0 : Math.round(snapshot.rotation);
  const opacVal = isNaN(snapshot.opacity) ? 100 : snapshot.opacity;
  const rxVal = isNaN(snapshot.rx) ? 0 : snapshot.rx;

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
          Position
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
          {/* X / Y row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <NumberInput
                value={xVal}
                onChange={handleX}
                step={0.5}
                suffix="mm"
                label="X"
                disabled={isMulti}
              />
            </div>
            <div style={{ flex: 1 }}>
              <NumberInput
                value={yVal}
                onChange={handleY}
                step={0.5}
                suffix="mm"
                label="Y"
                disabled={isMulti}
              />
            </div>
          </div>

          {/* W / lock / H row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <NumberInput
                value={wVal}
                onChange={handleW}
                step={0.5}
                suffix="mm"
                label="W"
                disabled={isMulti}
                min={0}
              />
            </div>
            <button
              onClick={() => setAspectLocked((v) => !v)}
              title={aspectLocked ? 'Aspect ratio locked' : 'Aspect ratio unlocked — click to lock'}
              style={{
                width: '20px',
                height: '20px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {aspectLocked ? (
                <Link size={14} color="#6366f1" />
              ) : (
                <Link2Off size={14} color="#888888" />
              )}
            </button>
            <div style={{ flex: 1 }}>
              <NumberInput
                value={hVal}
                onChange={handleH}
                step={0.5}
                suffix="mm"
                label="H"
                disabled={isMulti}
                min={0}
              />
            </div>
          </div>

          {/* Rotation row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <div style={{ flex: 1 }}>
              <NumberInput
                value={rotVal}
                onChange={handleRotation}
                step={1}
                min={0}
                max={360}
                suffix="deg"
                label="R"
                disabled={isMulti}
              />
            </div>
            <div style={{ flex: 1 }} />
          </div>

          {/* Opacity row: range slider + number input */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={isNaN(opacVal) ? 100 : opacVal}
              onChange={(e) => handleOpacity(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: '#6366f1',
                cursor: 'pointer',
                height: '4px',
              }}
            />
            <div style={{ width: '72px' }}>
              <NumberInput
                value={isNaN(opacVal) ? 100 : opacVal}
                onChange={handleOpacity}
                step={1}
                min={0}
                max={100}
                suffix="%"
              />
            </div>
          </div>

          {/* Corner radius — shapes only */}
          {isShape && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <NumberInput
                  value={rxVal}
                  onChange={handleRadius}
                  step={1}
                  min={0}
                  suffix="px"
                  label="Radius"
                />
              </div>
              <div style={{ flex: 1 }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
