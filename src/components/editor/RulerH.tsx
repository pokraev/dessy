'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { mmToPx } from '@/lib/units';

const RULER_HEIGHT = 20;
const MAJOR_TICK_INTERVAL_MM = 10;
const MINOR_TICK_INTERVAL_MM = 1;
const ONE_MM_PX = mmToPx(1);

/**
 * RulerH — horizontal mm ruler along the top of the canvas area.
 * Uses an HTML canvas (not Fabric.js) drawn via requestAnimationFrame.
 * Subscribes to canvasStore via subscribe() (not useState) to avoid
 * React batching lag on rapid pan/zoom events (Research Pitfall 7).
 */
export default function RulerH() {
  const showRulers = useEditorStore((s) => s.showRulers);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { viewportTransform, zoom } = useCanvasStore.getState();
    const [, , , , tx] = viewportTransform;
    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, width, height);

    // Bottom border
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, height - 1, width, 1);

    const scaledMmPx = ONE_MM_PX * zoom;

    // Calculate the mm value at pixel 0 (left edge of ruler)
    const mmAtLeft = -tx / scaledMmPx;

    // Range of mm values visible
    const mmVisible = (width / dpr) / scaledMmPx;
    const mmStart = Math.floor(mmAtLeft / MAJOR_TICK_INTERVAL_MM) * MAJOR_TICK_INTERVAL_MM - MAJOR_TICK_INTERVAL_MM;
    const mmEnd = mmAtLeft + mmVisible + MAJOR_TICK_INTERVAL_MM;

    // Minor ticks (only when zoom > 0.5 to avoid crowding)
    if (zoom > 0.5) {
      ctx.fillStyle = '#1e1e1e';
      for (let mm = Math.floor(mmAtLeft); mm <= mmEnd; mm += MINOR_TICK_INTERVAL_MM) {
        if (mm % MAJOR_TICK_INTERVAL_MM === 0) continue; // skip major tick positions
        const x = Math.round((mm - mmAtLeft) * scaledMmPx * dpr);
        ctx.fillRect(x, height - 5, 1, 5);
      }
    }

    // Major ticks and labels
    ctx.fillStyle = '#2a2a2a';
    ctx.font = `${9 * dpr}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';

    for (let mm = mmStart; mm <= mmEnd; mm += MAJOR_TICK_INTERVAL_MM) {
      const x = Math.round((mm - mmAtLeft) * scaledMmPx * dpr);
      if (x < 0 || x > width) continue;

      // Tick mark
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(x, height - 10, 1, 10);

      // Label
      if (mm !== 0) {
        ctx.fillStyle = '#888888';
        ctx.fillText(String(mm), x + 2, 2);
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
      canvas.width = rect.width * dpr;
      canvas.height = RULER_HEIGHT * dpr;
      draw();
    });
    observer.observe(canvas);

    // Initial size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = RULER_HEIGHT * dpr;

    return () => observer.disconnect();
  }, [draw]);

  if (!showRulers) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: RULER_HEIGHT,
        cursor: 'default',
      }}
    />
  );
}
