import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, Wand2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import type { ObjectSnapshot } from '@/hooks/useSelectedObject';
import type { FabricObject } from 'fabric';

interface Props {
  snapshot: ObjectSnapshot;
}

export function ImageSection({ snapshot }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const hasImage = snapshot.imageId !== null && snapshot.imageId !== undefined;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;

    const obj = canvas.getActiveObject();
    if (!obj) return;

    useCanvasStore.getState().captureUndoState?.();

    const dataUrl = await readFile(file);
    const { FabricImage } = await import('fabric');
    const img = await FabricImage.fromURL(dataUrl);

    // Scale image to fit the placeholder dimensions
    const targetW = (obj.width ?? 100) * (obj.scaleX ?? 1);
    const targetH = (obj.height ?? 100) * (obj.scaleY ?? 1);

    const newImg = img;
    newImg.set({
      left: obj.left,
      top: obj.top,
      originX: 'left',
      originY: 'top',
      scaleX: targetW / (newImg.width || 1),
      scaleY: targetH / (newImg.height || 1),
    });

    // Copy custom props
    const custom = obj as FabricObject & Record<string, unknown>;
    Object.assign(newImg, {
      customType: 'image',
      name: custom.name || 'Image',
      id: custom.id || crypto.randomUUID(),
      locked: custom.locked ?? false,
      visible: true,
      imageId: 'uploaded',
      fitMode: custom.fitMode || 'fill',
    });

    const idx = canvas.getObjects().indexOf(obj);
    const prev = canvas.renderOnAddRemove;
    canvas.renderOnAddRemove = false;
    canvas.insertAt(idx, newImg as unknown as FabricObject);
    canvas.remove(obj);
    canvas.renderOnAddRemove = prev;
    canvas.setActiveObject(newImg as unknown as FabricObject);
    canvas.requestRenderAll();

    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleRemoveImage() {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;

    const obj = canvas.getActiveObject();
    if (!obj) return;

    useCanvasStore.getState().captureUndoState?.();

    // Replace with a placeholder rect
    const { Rect } = await import('fabric');
    const rect = new Rect({
      left: obj.left,
      top: obj.top,
      width: (obj.width ?? 100) * (obj.scaleX ?? 1),
      height: (obj.height ?? 100) * (obj.scaleY ?? 1),
      originX: 'left',
      originY: 'top',
      fill: '#1e1e1e',
      stroke: '#2a2a2a',
      strokeWidth: 1,
      strokeDashArray: [6, 4],
    });

    const custom = obj as FabricObject & Record<string, unknown>;
    Object.assign(rect, {
      customType: 'image',
      name: custom.name || 'Image Frame',
      id: custom.id || crypto.randomUUID(),
      locked: false,
      visible: true,
      imageId: null,
      fitMode: 'fill',
    });

    const idx = canvas.getObjects().indexOf(obj);
    const prevR = canvas.renderOnAddRemove;
    canvas.renderOnAddRemove = false;
    canvas.insertAt(idx, rect);
    canvas.remove(obj);
    canvas.renderOnAddRemove = prevR;
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
  }

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
          marginBottom: '8px',
        }}
      >
        {t('image.title')}
      </label>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 500,
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Upload size={14} />
          {hasImage ? t('image.replace') : t('image.upload')}
        </button>

        {hasImage && (
          <button
            onClick={handleRemoveImage}
            style={{
              padding: '8px',
              fontSize: '12px',
              background: 'transparent',
              color: '#ef4444',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* AI Generate button */}
      <button
        onClick={() => useEditorStore.getState().setPromptCrafterModalOpen(true)}
        style={{
          marginTop: '6px',
          width: '100%',
          padding: '8px 12px',
          fontSize: '12px',
          fontWeight: 500,
          background: 'transparent',
          color: '#6366f1',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <Wand2 size={14} />
        {t('image.aiGenerate')}
      </button>
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
