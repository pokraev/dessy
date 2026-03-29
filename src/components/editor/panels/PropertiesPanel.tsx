
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCanvasStore } from '@/stores/canvasStore';
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
          <FillSection snapshot={snapshot} />
          <StrokeSection snapshot={snapshot} />
          <ShadowSection snapshot={snapshot} />
        </div>
      )}

      {/* Single selection: image */}
      {selectionCount === 1 && snapshot?.type === 'image' && (
        <div>
          <ImageSection snapshot={snapshot} />
          <PositionSection snapshot={snapshot} />
          <FitModeSection snapshot={snapshot} />
        </div>
      )}

      {/* Single selection: colorBlock */}
      {selectionCount === 1 && snapshot?.type === 'colorBlock' && (
        <div>
          <PositionSection snapshot={snapshot} />
          <FillSection snapshot={snapshot} />
        </div>
      )}
    </div>
  );
}
