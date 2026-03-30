
import { ChevronDown, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore } from '@/stores/canvasStore';
import { useEditorStore } from '@/stores/editorStore';
import { useSelectedObject } from '@/hooks/useSelectedObject';
import { PositionSection } from './sections/PositionSection';
import { FillSection } from './sections/FillSection';
import { StrokeSection } from './sections/StrokeSection';
import { ShadowSection } from './sections/ShadowSection';
import { FitModeSection } from './sections/FitModeSection';
import { PageSection } from './sections/PageSection';
import { StyleSection } from './sections/StyleSection';
import { TypographySection } from './sections/TypographySection';
import { TextContentSection } from './sections/TextContentSection';
import { ImageSection } from './sections/ImageSection';

function CornerRadiusSection({ rx }: { rx: number }) {
  const { t } = useTranslation();
  const handleChange = (value: number) => {
    const canvas = useCanvasStore.getState().canvasRef;
    const obj = canvas?.getActiveObject();
    if (!obj || !canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj as any).set({ rx: value, ry: value });
    obj.setCoords();
    canvas.renderAll();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvas.fire('object:modified', { target: obj } as any);
  };

  return (
    <div className="border-b border-border px-4 py-2.5">
      <div className="flex items-center gap-3">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary shrink-0">
          {t('properties.cornerRadius', 'Radius')}
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(rx)}
          onChange={(e) => handleChange(Number(e.target.value))}
          className="flex-1 h-1 accent-accent cursor-pointer"
        />
        <span className="text-[12px] text-text-secondary tabular-nums w-8 text-right">
          {Math.round(rx)}
        </span>
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function SectionHeader({ title, isOpen, onToggle }: SectionHeaderProps) {
  return (
    <button
      className="flex items-center justify-between w-full px-4 transition-colors hover:bg-surface-raised"
      style={{
        height: '32px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <span
        className="text-text-secondary uppercase tracking-wider"
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
        }}
      >
        {title}
      </span>
      <ChevronDown
        size={16}
        className="text-text-secondary transition-transform"
        style={{
          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 150ms ease-in-out',
        }}
      />
    </button>
  );
}

export function PropertiesPanel() {
  const { t } = useTranslation();
  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);
  const snapshot = useSelectedObject();
  const selectionCount = selectedObjectIds.length;

  return (
    <div
      className="bg-surface flex flex-col h-full"
      style={{ width: '320px', overflowY: 'auto' }}
    >
      {/* Nothing selected */}
      {selectionCount === 0 && (
        <>
          <PageSection />
          <StyleSection />
        </>
      )}

      {/* Multi-selection */}
      {selectionCount > 1 && snapshot && (
        <div>
          <div
            style={{
              padding: '12px 16px 8px',
              borderBottom: '1px solid #2a2a2a',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#f5f5f5',
                fontFamily: 'Inter, sans-serif',
                margin: 0,
              }}
            >
              {t('properties.objectsSelected', { count: selectionCount })}
            </p>
          </div>
          <PositionSection snapshot={snapshot} />
          {snapshot.type === 'text' && <TypographySection snapshot={snapshot} />}
          {(snapshot.type === 'text' || snapshot.type === 'shape' || snapshot.type === 'colorBlock') && (
            <FillSection snapshot={snapshot} />
          )}
          {snapshot.type === 'shape' && (
            <>
              <StrokeSection snapshot={snapshot} />
              <ShadowSection snapshot={snapshot} />
            </>
          )}
          {snapshot.type === 'image' && <FitModeSection snapshot={snapshot} />}
        </div>
      )}

      {/* Single selection: text */}
      {selectionCount === 1 && snapshot?.type === 'text' && (
        <div>
          <TextContentSection snapshot={snapshot} />
          <TypographySection snapshot={snapshot} />
          <PositionSection snapshot={snapshot} />
          <FillSection snapshot={snapshot} />
        </div>
      )}

      {/* Single selection: shape */}
      {selectionCount === 1 && snapshot?.type === 'shape' && (
        <div>
          <PositionSection snapshot={snapshot} />
          {!isNaN(snapshot.rx) && <CornerRadiusSection rx={snapshot.rx} />}
          <FillSection snapshot={snapshot} />
          <StrokeSection snapshot={snapshot} />
          <ShadowSection snapshot={snapshot} />
        </div>
      )}

      {/* Single selection: image */}
      {selectionCount === 1 && snapshot?.type === 'image' && (
        <div>
          <div className="p-3 border-b border-border">
            <button
              className="w-full h-8 flex items-center justify-center gap-1.5 text-white text-[13px] font-medium rounded-lg border-none cursor-pointer shrink-0 hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              onClick={() => useEditorStore.getState().setPromptCrafterModalOpen(true)}
            >
              <Wand2 size={14} />
              AI Image
            </button>
          </div>
          <ImageSection snapshot={snapshot} />
          <PositionSection snapshot={snapshot} />
          <FitModeSection snapshot={snapshot} />
        </div>
      )}

      {/* Single selection: colorBlock */}
      {selectionCount === 1 && snapshot?.type === 'colorBlock' && (
        <div>
          <PositionSection snapshot={snapshot} />
          {!isNaN(snapshot.rx) && <CornerRadiusSection rx={snapshot.rx} />}
          <FillSection snapshot={snapshot} />
        </div>
      )}
    </div>
  );
}
