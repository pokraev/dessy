'use client';

import { useMemo } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { FORMATS } from '@/constants/formats';
import { mmToPx } from '@/lib/units';
import {
  calcBleedGuides,
  calcMarginGuides,
  calcFoldGuides,
} from '@/lib/fabric/guides';

interface GuidesOverlayProps {
  formatId: string;
}

/**
 * GuidesOverlay renders bleed zone (red tint), margin guides (cyan),
 * fold lines (indigo dashed), and optional dot grid as HTML overlaid
 * above the Fabric.js canvas. Uses pointer-events: none so it does not
 * intercept canvas mouse events.
 *
 * The overlay applies the same viewportTransform as Fabric.js so guides
 * stay in sync during zoom and pan.
 */
export default function GuidesOverlay({ formatId }: GuidesOverlayProps) {
  const viewportTransform = useCanvasStore((s) => s.viewportTransform);
  const zoom = useCanvasStore((s) => s.zoom);
  const showGuides = useEditorStore((s) => s.showGuides);
  const showGrid = useEditorStore((s) => s.showGrid);

  const format = FORMATS[formatId] ?? FORMATS['A4'];

  const { bleedPx, docWidthPx, docHeightPx } = useMemo(
    () => calcBleedGuides(format),
    [format]
  );

  const margins = useMemo(() => calcMarginGuides(format), [format]);

  const foldLines = useMemo(() => calcFoldGuides(format), [format]);

  // Grid dot spacing: 5mm converted to px, scaled by zoom
  const gridSpacePx = mmToPx(5) * zoom;

  // viewportTransform: [scaleX, skewY, skewX, scaleY, translateX, translateY]
  const [sx, , , sy, tx, ty] = viewportTransform;
  const transform = `matrix(${sx}, 0, 0, ${sy}, ${tx}, ${ty})`;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 10 }}
    >
      {/* Grid dots (behind guides) */}
      {showGrid && (
        <div
          className="absolute inset-0"
          style={{
            transform,
            transformOrigin: '0 0',
            backgroundImage: 'radial-gradient(circle, #2a2a2a 0.5px, transparent 0.5px)',
            backgroundSize: `${gridSpacePx}px ${gridSpacePx}px`,
            width: docWidthPx,
            height: docHeightPx,
          }}
        />
      )}

      {showGuides && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: docWidthPx,
            height: docHeightPx,
            transform,
            transformOrigin: '0 0',
          }}
        >
          {/* Bleed zone overlay — four strips around document edges */}
          {/* Top bleed strip */}
          <div
            style={{
              position: 'absolute',
              left: -bleedPx,
              top: -bleedPx,
              width: docWidthPx + bleedPx * 2,
              height: bleedPx,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderBottom: '1px solid #ef4444',
            }}
          />
          {/* Bottom bleed strip */}
          <div
            style={{
              position: 'absolute',
              left: -bleedPx,
              top: docHeightPx,
              width: docWidthPx + bleedPx * 2,
              height: bleedPx,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderTop: '1px solid #ef4444',
            }}
          />
          {/* Left bleed strip */}
          <div
            style={{
              position: 'absolute',
              left: -bleedPx,
              top: 0,
              width: bleedPx,
              height: docHeightPx,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderRight: '1px solid #ef4444',
            }}
          />
          {/* Right bleed strip */}
          <div
            style={{
              position: 'absolute',
              left: docWidthPx,
              top: 0,
              width: bleedPx,
              height: docHeightPx,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderLeft: '1px solid #ef4444',
            }}
          />

          {/* Margin guides — cyan horizontal and vertical lines */}
          {/* Top margin */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: margins.top,
              width: docWidthPx,
              height: 1,
              backgroundColor: '#06b6d4',
              opacity: 0.5,
            }}
          />
          {/* Bottom margin */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: margins.bottom,
              width: docWidthPx,
              height: 1,
              backgroundColor: '#06b6d4',
              opacity: 0.5,
            }}
          />
          {/* Left margin */}
          <div
            style={{
              position: 'absolute',
              left: margins.left,
              top: 0,
              width: 1,
              height: docHeightPx,
              backgroundColor: '#06b6d4',
              opacity: 0.5,
            }}
          />
          {/* Right margin */}
          <div
            style={{
              position: 'absolute',
              left: margins.right,
              top: 0,
              width: 1,
              height: docHeightPx,
              backgroundColor: '#06b6d4',
              opacity: 0.5,
            }}
          />

          {/* Fold lines — dashed indigo vertical lines for bifold/trifold */}
          {foldLines.map((line, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: line.x1,
                top: 0,
                width: 1,
                height: docHeightPx,
                backgroundImage:
                  'repeating-linear-gradient(to bottom, #6366f1 0px, #6366f1 4px, transparent 4px, transparent 8px)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
