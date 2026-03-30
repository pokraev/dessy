
import { useRef, useState, useCallback, useEffect, type RefObject } from 'react';
import type { Canvas, FabricObject } from 'fabric';
import { createImageFrame } from '@/lib/fabric/element-factory';
import { useCanvasStore } from '@/stores/canvasStore';

export interface UseImageUploadReturn {
  imageUploadRef: RefObject<HTMLInputElement | null>;
  isDragOver: boolean;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleImageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useImageUpload(canvas: Canvas | null): UseImageUploadReturn {
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const isMountedRef = useRef(true);

  // Track mount state for async safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Double-click on image placeholder — open file picker
  useEffect(() => {
    function onImageUpload() {
      imageUploadRef.current?.click();
    }
    window.addEventListener('dessy-image-upload', onImageUpload);
    return () => window.removeEventListener('dessy-image-upload', onImageUpload);
  }, []);

  // Handle file selected via hidden input (double-click upload flow)
  const handleImageInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !canvas) return;

      const obj = canvas.getActiveObject();
      if (!obj) return;

      useCanvasStore.getState().captureUndoState?.();

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      try {
        const { FabricImage } = await import('fabric');
        const img = await FabricImage.fromURL(dataUrl);

        if (!isMountedRef.current) return;

        const targetW = (obj.width ?? 100) * (obj.scaleX ?? 1);
        const targetH = (obj.height ?? 100) * (obj.scaleY ?? 1);
        img.set({
          left: obj.left,
          top: obj.top,
          originX: 'left',
          originY: 'top',
          scaleX: targetW / (img.width || 1),
          scaleY: targetH / (img.height || 1),
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const custom = obj as any;
        Object.assign(img, {
          customType: 'image',
          name: custom.name || 'Image',
          id: custom.id || crypto.randomUUID(),
          locked: false,
          visible: true,
          imageId: 'uploaded',
          fitMode: custom.fitMode || 'fill',
        });

        const prev = canvas.renderOnAddRemove;
        canvas.renderOnAddRemove = false;
        const idx = canvas.getObjects().indexOf(obj);
        canvas.insertAt(idx, img as unknown as FabricObject);
        canvas.remove(obj);
        canvas.renderOnAddRemove = prev;
        canvas.setActiveObject(img as unknown as FabricObject);
        canvas.requestRenderAll();
      } catch {
        // Image load failed — no-op, placeholder stays
      }

      if (imageUploadRef.current) imageUploadRef.current.value = '';
    },
    [canvas],
  );

  // Handle image file drops onto the canvas
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!canvas) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/'),
      );
      if (!files.length) return;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          if (!dataUrl) return;

          // Determine drop position relative to canvas
          const el = canvas.getElement();
          const rect = el.getBoundingClientRect();
          const dropX = e.clientX - rect.left;
          const dropY = e.clientY - rect.top;

          // Create image frame placeholder at drop position
          const frame = createImageFrame({
            left: dropX - 100,
            top: dropY - 75,
            width: 200,
            height: 150,
          });

          canvas.add(frame as Parameters<typeof canvas.add>[0]);
          canvas.requestRenderAll();

          try {
            const { FabricImage } = await import('fabric');
            const img = await FabricImage.fromURL(dataUrl, {
              crossOrigin: 'anonymous',
            });

            if (!isMountedRef.current) return;

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
          } catch {
            // Image load failed — remove placeholder frame
            canvas.remove(frame as Parameters<typeof canvas.add>[0]);
            canvas.requestRenderAll();
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [canvas],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return {
    imageUploadRef,
    isDragOver,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleImageInputChange,
  };
}
