
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, AlignLeft, AlignCenter, AlignRight, AlignJustify, Minus, Plus } from 'lucide-react';
import { GoogleFontsDropdown } from '@/components/editor/panels/GoogleFontsDropdown';
import { NumberInput } from '@/components/editor/panels/NumberInput';
import { ColorPicker } from '@/components/editor/panels/ColorPicker';
import { loadGoogleFont } from '@/hooks/useGoogleFonts';
import { useCanvasStore } from '@/stores/canvasStore';
import { useBrandStore } from '@/stores/brandStore';
import type { ObjectSnapshot } from '@/hooks/useSelectedObject';
import type { TypographyPreset } from '@/types/brand';

// Default presets used when brandStore has no custom presets
const DEFAULT_PRESETS: TypographyPreset[] = [
  {
    id: 'preset-headline',
    name: 'Headline',
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: 0,
    color: '#000000',
  },
  {
    id: 'preset-subhead',
    name: 'Subhead',
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: 0,
    color: '#333333',
  },
  {
    id: 'preset-body',
    name: 'Body',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
    color: '#333333',
  },
  {
    id: 'preset-caption',
    name: 'Caption',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: 20,
    color: '#666666',
  },
  {
    id: 'preset-cta',
    name: 'CTA',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: 40,
    color: '#6366f1',
  },
];

function updateCanvasObject(updates: Record<string, unknown>) {
  const canvas = useCanvasStore.getState().canvasRef;
  if (!canvas) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = canvas.getActiveObject() as any;
  if (!obj) return;
  obj.set(updates);
  obj.setCoords();
  canvas.renderAll();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas.fire('object:modified', { target: obj } as any);
}

interface TypographySectionProps {
  snapshot: ObjectSnapshot;
}

const FONT_WEIGHTS = [
  { value: 300, labelKey: 'typography.light' },
  { value: 400, labelKey: 'typography.regular' },
  { value: 500, labelKey: 'typography.medium' },
  { value: 600, labelKey: 'typography.semiBold' },
  { value: 700, labelKey: 'typography.bold' },
];

type TextTransform = 'none' | 'lowercase' | 'uppercase' | 'capitalize';

const TEXT_TRANSFORMS: { value: TextTransform; label: string }[] = [
  { value: 'none', label: 'Aa' },
  { value: 'lowercase', label: 'aa' },
  { value: 'uppercase', label: 'AA' },
  { value: 'capitalize', label: 'Cc' },
];

const TEXT_ALIGNMENTS = [
  { value: 'left', Icon: AlignLeft },
  { value: 'center', Icon: AlignCenter },
  { value: 'right', Icon: AlignRight },
  { value: 'justify', Icon: AlignJustify },
] as const;

export function TypographySection({ snapshot }: TypographySectionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const { typographyPresets, setTypographyPresets } = useBrandStore();

  const presets = typographyPresets.length > 0 ? typographyPresets : DEFAULT_PRESETS;

  const currentFontFamily = snapshot.fontFamily ?? 'Inter';
  const rawWeight = snapshot.fontWeight ?? 400;
  const currentFontWeight = typeof rawWeight === 'string' && isNaN(Number(rawWeight))
    ? (rawWeight === 'bold' ? 700 : 400)
    : Number(rawWeight);
  const currentFontSize = snapshot.fontSize ?? 16;
  const currentLineHeight = snapshot.lineHeight ?? 1.2;
  const currentCharSpacing = snapshot.charSpacing ?? 0;
  const currentTextAlign = snapshot.textAlign ?? 'left';
  const currentTextTransform = (snapshot.textTransform ?? 'none') as TextTransform;
  const currentFill = typeof snapshot.fill === 'string' ? snapshot.fill : '#000000';
  const currentPresetId = snapshot.presetId ?? null;

  const handleFontChange = async (family: string) => {
    await loadGoogleFont(family);
    updateCanvasObject({ fontFamily: family });
  };

  const handleWeightChange = (weight: string) => {
    updateCanvasObject({ fontWeight: parseInt(weight, 10) });
  };

  const handleTextTransform = (transform: TextTransform) => {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = canvas.getActiveObject() as any;
    if (!obj) return;

    let newText: string | undefined;
    const currentText = (obj.text as string) ?? '';

    if (transform === 'uppercase') {
      newText = currentText.toUpperCase();
    } else if (transform === 'lowercase') {
      newText = currentText.toLowerCase();
    } else if (transform === 'capitalize') {
      newText = currentText.replace(/\b\w/g, (c: string) => c.toUpperCase());
    }

    if (newText !== undefined) {
      obj.set({ text: newText, textTransform: transform });
    } else {
      obj.set({ textTransform: transform });
    }
    obj.setCoords();
    canvas.renderAll();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvas.fire('object:modified', { target: obj } as any);
  };

  const handlePresetApply = async (preset: TypographyPreset) => {
    // Initialize defaults in brandStore on first use if using defaults
    if (typographyPresets.length === 0) {
      setTypographyPresets(DEFAULT_PRESETS);
    }
    await loadGoogleFont(preset.fontFamily, preset.fontWeight);
    updateCanvasObject({
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      lineHeight: preset.lineHeight,
      charSpacing: preset.letterSpacing,
      fill: preset.color,
      presetId: preset.id,
    });
  };

  const buttonGroupStyle = (isFirst: boolean, isLast: boolean, isActive: boolean): React.CSSProperties => ({
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isActive ? '#6366f1' : '#1e1e1e',
    border: '1px solid #2a2a2a',
    borderRadius: isFirst ? '4px 0 0 4px' : isLast ? '0 4px 4px 0' : '0',
    borderLeft: isFirst ? '1px solid #2a2a2a' : 'none',
    cursor: 'pointer',
    color: isActive ? '#f5f5f5' : '#888888',
    fontSize: '11px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
  });

  return (
    <div>
      {/* Section header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={{
          height: '32px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#888888',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t('typography.title')}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: '#888888',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 150ms ease-in-out',
          }}
        />
      </button>

      {isOpen && (
        <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* 1. Font family */}
          <GoogleFontsDropdown value={currentFontFamily} onChange={handleFontChange} />

          {/* 2. Font weight */}
          <select
            value={currentFontWeight}
            onChange={(e) => handleWeightChange(e.target.value)}
            style={{
              height: '28px',
              width: '100%',
              background: '#1e1e1e',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              color: '#f5f5f5',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              padding: '0 8px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {FONT_WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.value} — {t(w.labelKey)}
              </option>
            ))}
          </select>

          {/* 3. Font size + line height row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={() => updateCanvasObject({ fontSize: Math.max(1, currentFontSize - 1) })}
                style={{
                  width: '24px', height: '24px', borderRadius: '4px',
                  background: 'transparent', border: '1px solid #2a2a2a',
                  cursor: 'pointer', color: '#888', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <Minus size={12} />
              </button>
              <NumberInput
                value={currentFontSize}
                onChange={(v) => updateCanvasObject({ fontSize: v })}
                suffix="pt"
                step={1}
                min={1}
                max={999}
              />
              <button
                onClick={() => updateCanvasObject({ fontSize: Math.min(999, currentFontSize + 1) })}
                style={{
                  width: '24px', height: '24px', borderRadius: '4px',
                  background: 'transparent', border: '1px solid #2a2a2a',
                  cursor: 'pointer', color: '#888', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <Plus size={12} />
              </button>
            </div>
            <NumberInput
              value={currentLineHeight}
              onChange={(v) => updateCanvasObject({ lineHeight: v })}
              suffix="x"
              step={0.05}
              min={0.5}
              max={5}
            />
          </div>

          {/* 4. Letter spacing */}
          <NumberInput
            value={currentCharSpacing}
            onChange={(v) => updateCanvasObject({ charSpacing: v })}
            suffix="px"
            step={10}
            min={-200}
            max={1000}
          />

          {/* 5. Text color */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                color: '#888888',
                fontFamily: 'Inter, sans-serif',
                flexShrink: 0,
              }}
            >
              Color
            </span>
            <ColorPicker
              value={currentFill}
              onChange={(hex) => updateCanvasObject({ fill: hex })}
              onSwatchApply={(swatchId, hex) =>
                updateCanvasObject({ fill: hex, swatchId })
              }
            />
          </div>

          {/* 6. Text alignment buttons */}
          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#888888',
                fontFamily: 'Inter, sans-serif',
                marginBottom: '4px',
              }}
            >
              {t('typography.align')}
            </div>
            <div style={{ display: 'flex' }}>
              {TEXT_ALIGNMENTS.map(({ value, Icon }, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === TEXT_ALIGNMENTS.length - 1;
                const isActive = currentTextAlign === value;
                return (
                  <button
                    key={value}
                    onClick={() => updateCanvasObject({ textAlign: value })}
                    style={buttonGroupStyle(isFirst, isLast, isActive)}
                    title={t(`typography.align${value.charAt(0).toUpperCase() + value.slice(1)}`)}
                  >
                    <Icon
                      size={14}
                      style={{ color: isActive ? '#f5f5f5' : '#888888' }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Text transform buttons */}
          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#888888',
                fontFamily: 'Inter, sans-serif',
                marginBottom: '4px',
              }}
            >
              {t('typography.transform')}
            </div>
            <div style={{ display: 'flex' }}>
              {TEXT_TRANSFORMS.map(({ value, label }, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === TEXT_TRANSFORMS.length - 1;
                const isActive = currentTextTransform === value;
                return (
                  <button
                    key={value}
                    onClick={() => handleTextTransform(value)}
                    style={buttonGroupStyle(isFirst, isLast, isActive)}
                    title={value === 'none' ? 'None' : value.charAt(0).toUpperCase() + value.slice(1)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Typography presets */}
          <div>
            <div
              style={{
                fontSize: '11px',
                color: '#888888',
                fontFamily: 'Inter, sans-serif',
                marginBottom: '4px',
              }}
            >
              {t('typography.presets')}
            </div>
            {/* Top row: Headline, Subhead */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '4px' }}>
              {presets.slice(0, 2).map((preset) => {
                const isActive = currentPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetApply(preset)}
                    style={{
                      height: '28px',
                      background: isActive ? 'rgba(99,102,241,0.15)' : '#1e1e1e',
                      border: isActive ? '1px solid #6366f1' : '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#f5f5f5',
                      fontSize: '11px',
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a';
                      }
                    }}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
            {/* Bottom row: Body, Caption, CTA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              {presets.slice(2, 5).map((preset) => {
                const isActive = currentPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetApply(preset)}
                    style={{
                      height: '28px',
                      background: isActive ? 'rgba(99,102,241,0.15)' : '#1e1e1e',
                      border: isActive ? '1px solid #6366f1' : '1px solid #2a2a2a',
                      borderRadius: '4px',
                      color: '#f5f5f5',
                      fontSize: '11px',
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a';
                      }
                    }}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
