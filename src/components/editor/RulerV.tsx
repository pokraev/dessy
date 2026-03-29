
import { useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { mmToPx } from '@/lib/units';

const RULER_WIDTH = 20;
const MAJOR_TICK_INTERVAL_MM = 10;
const MINOR_TICK_INTERVAL_MM = 1;
const ONE_MM_PX = mmToPx(1);

/**
 * RulerV — vertical mm ruler along the left edge of the canvas area.
 * Uses an HTML canvas (not Fabric.js) drawn via requestAnimationFrame.
 * Subscribes to canvasStore via subscribe() (not useState) to avoid
 * React batching lag on rapid pan/zoom events (Research Pitfall 7).
 */
export default function RulerV() {
  const showRulers = useEditorStore((s) => s.showRulers);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { viewportTransform, zoom } = useCanvasStore.getState();
    const [, , , , , ty] = viewportTransform;
    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, width, height);

    // Right border
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(width - 1, 0, 1, height);

    const scaledMmPx = ONE_MM_PX * zoom;

    // Calculate the mm value at pixel 0 (top edge of ruler)
    const mmAtTop = -ty / scaledMmPx;

    // Range of mm values visible
    const mmVisible = (height / dpr) / scaledMmPx;
    const mmStart = Math.floor(mmAtTop / MAJOR_TICK_INTERVAL_MM) * MAJOR_TICK_INTERVAL_MM - MAJOR_TICK_INTERVAL_MM;
    const mmEnd = mmAtTop + mmVisible + MAJOR_TICK_INTERVAL_MM;

    // Minor ticks (only when zoom > 0.5 to avoid crowding)
    if (zoom > 0.5) {
      ctx.fillStyle = '#1e1e1e';
      for (let mm = Math.floor(mmAtTop); mm <= mmEnd; mm += MINOR_TICK_INTERVAL_MM) {
        if (mm % MAJOR_TICK_INTERVAL_MM === 0) continue;
        const y = Math.round((mm - mmAtTop) * scaledMmPx * dpr);
        ctx.fillRect(width - 5, y, 5, 1);
      }
    }

    // Major ticks and labels
    for (let mm = mmStart; mm <= mmEnd; mm += MAJOR_TICK_INTERVAL_MM) {
      const y = Math.round((mm - mmAtTop) * scaledMmPx * dpr);
      if (y < 0 || y > height) continue;

      // Tick mark
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(width - 10, y, 10, 1);

      // Label — rotated -90 degrees
      if (mm !== 0) {
        ctx.save();
        ctx.translate(width - 2, y - 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#888888';
        ctx.font = `${9 * dpr}px "JetBrains Mono", monospace`;
        ctx.textBaseline = 'top';
        ctx.fillText(String(mm), 0, 0);
        ctx.restore();
      }
    }
  }, []);

  useEffect(() => {
    // Subscribe to canvasStore without useState — avoids React batching lag
    const unsubscribe = useCanvasStore.subscribe(() => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    });

    // Initial draw
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      unsubscribe();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = RULER_WIDTH * dpr;
      canvas.height = rect.height * dpr;
      draw();
    });
    observer.observe(canvas);

    // Initial size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = RULER_WIDTH * dpr;
    canvas.height = rect.height * dpr;

    return () => observer.disconnect();
  }, [draw]);

  if (!showRulers) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: RULER_WIDTH,
        height: '100%',
        cursor: 'default',
      }}
    />
  );
}
