'use client';

import { useRef, useState } from 'react';
import { useFabricCanvas } from '@/hooks/useFabricCanvas';

interface EditorCanvasInnerProps {
  projectId: string;
  formatId: string;
}

export default function EditorCanvasInner({ formatId }: EditorCanvasInnerProps) {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const [hasElements, setHasElements] = useState(false);

  // Mount Fabric.js canvas
  const canvasRef = useFabricCanvas(canvasElRef.current, formatId);

  // Suppress unused warning — canvasRef used by child hooks added in Task 2
  void canvasRef;
  void setHasElements;

  return (
    <div
      className="relative w-full h-full overflow-auto flex items-center justify-center"
      style={{
        // Checkerboard pasteboard background
        backgroundImage: 'repeating-conic-gradient(#141414 0% 25%, #1a1a1a 0% 50%)',
        backgroundSize: '10px 10px',
      }}
    >
      {/* Document canvas wrapper */}
      <div
        className="relative"
        style={{
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        }}
      >
        <canvas ref={canvasElRef} />
      </div>

      {/* First-open hint — disappears after first element is placed */}
      {!hasElements && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            color: '#555555',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          Your canvas is ready &mdash; select a tool to start designing
        </div>
      )}
    </div>
  );
}
