import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore } from '@/stores/canvasStore';
import type { ObjectSnapshot } from '@/hooks/useSelectedObject';
import type { FabricObject } from 'fabric';

interface Props {
  snapshot: ObjectSnapshot;
}

export function TextContentSection({ snapshot }: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState(snapshot.text ?? '');

  // Sync from snapshot when selection changes
  useEffect(() => {
    setValue(snapshot.text ?? '');
  }, [snapshot.id, snapshot.text]);

  const capturedRef = useRef(false);

  function handleChange(newText: string) {
    // Capture undo state on first edit
    if (!capturedRef.current) {
      useCanvasStore.getState().captureUndoState?.();
      capturedRef.current = true;
    }
    setValue(newText);
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;
    const obj = canvas.getActiveObject() as FabricObject & { set: (props: Record<string, unknown>) => void } | null;
    if (!obj) return;
    obj.set({ text: newText });
    canvas.requestRenderAll();
  }

  // Reset capture flag when selection changes
  useEffect(() => {
    capturedRef.current = false;
  }, [snapshot.id]);

  return (
    <div style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a2a' }}>
      <label
        style={{
          display: 'block',
          fontSize: '10px',
          fontWeight: 600,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '6px',
        }}
      >
        {t('textContent.title')}
      </label>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        rows={4}
        style={{
          width: '100%',
          resize: 'vertical',
          background: '#0a0a0a',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          color: '#f5f5f5',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          padding: '8px',
          outline: 'none',
          lineHeight: 1.5,
        }}
      />
    </div>
  );
}
