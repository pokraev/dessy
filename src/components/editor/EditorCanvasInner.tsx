'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useFabricCanvas } from '@/hooks/useFabricCanvas';
import { useElementCreation } from '@/hooks/useElementCreation';
import { useCanvasZoomPan } from '@/hooks/useCanvasZoomPan';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { createImageFrame } from '@/lib/fabric/element-factory';
import GuidesOverlay from '@/components/editor/GuidesOverlay';
import { ContextMenu } from '@/components/editor/panels/ContextMenu';
import { KeyboardShortcutsModal } from '@/components/editor/ui/KeyboardShortcutsModal';

interface EditorCanvasInnerProps {
  projectId: string;
  formatId: string;
}

export default function EditorCanvasInner({ formatId }: EditorCanvasInnerProps) {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const [hasElements, setHasElements] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Mount Fabric.js canvas — canvasInstance becomes non-null once async init completes
  const { canvasRef, canvasInstance, historyRef } = useFabricCanvas(canvasElRef.current, formatId);

  // Wire element creation and zoom/pan hooks — these re-run when canvasInstance becomes available
  useElementCreation(canvasInstance);
  useCanvasZoomPan(canvasInstance);

  // Wire keyboard shortcuts — passes history functions from historyRef
  useKeyboardShortcuts(canvasInstance, {
    undo: (canvas) => historyRef.current.undo(canvas),
    redo: (canvas) => historyRef.current.redo(canvas),
  });

  // Track when first element is placed to hide the hint
  useEffect(() => {
    const canvas = canvasInstance;
    if (!canvas) return;

    const onObjectAdded = () => setHasElements(true);
    canvas.on('object:added', onObjectAdded);
    return () => {
      canvas.off('object:added', onObjectAdded);
    };
  }, [canvasInstance]);

  // Suppress unused warning for canvasRef — used by future canvas-dependent features
  void canvasRef;
  void contextMenuPos; // used by ContextMenu

  // Handle image file drops onto the canvas
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const canvas = canvasInstance;
      if (!canvas) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (!files.length) return;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          if (!dataUrl) return;

          // Determine drop position relative to canvas
          const canvasEl = canvas.getElement();
          const rect = canvasEl.getBoundingClientRect();
          const dropX = e.clientX - rect.left;
          const dropY = e.clientY - rect.top;

          // Create image frame placeholder at drop position
          const frame = createImageFrame({
            left: dropX - 100,
            top: dropY - 75,
            width: 200,
            height: 150,
          });

          // Load image into frame using FabricImage.fromURL
          const { FabricImage } = await import('fabric');
          FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' }).then((img) => {
            // Scale image to fit within the frame
            const scaleX = 200 / (img.width ?? 200);
            const scaleY = 150 / (img.height ?? 150);
            const scale = Math.min(scaleX, scaleY);
            img.set({
              left: dropX - 100,
              top: dropY - 75,
              scaleX: scale,
              scaleY: scale,
              originX: 'left',
              originY: 'top',
            });

            // Replace frame placeholder with actual image
            canvas.remove(frame as Parameters<typeof canvas.add>[0]);
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();
          });

          canvas.add(frame as Parameters<typeof canvas.add>[0]);
          canvas.requestRenderAll();
        };
        reader.readAsDataURL(file);
      });
    },
    [canvasInstance]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Prevent default browser context menu on the canvas area
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div
      className="relative w-full h-full overflow-auto flex items-center justify-center"
      style={{
        // Checkerboard pasteboard background
        backgroundImage: 'repeating-conic-gradient(#141414 0% 25%, #1a1a1a 0% 50%)',
        backgroundSize: '10px 10px',
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={handleContextMenu}
    >
      {/* Document canvas wrapper with guides overlay */}
      <div
        className="relative"
        style={{
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        }}
      >
        <canvas ref={canvasElRef} />
        <GuidesOverlay formatId={formatId} />
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

      {/* Right-click context menu — mounted here to access canvas instance */}
      <ContextMenu canvas={canvasInstance} />

      {/* Keyboard shortcuts overlay modal — reads state from editorStore */}
      <KeyboardShortcutsModal />
    </div>
  );
}
