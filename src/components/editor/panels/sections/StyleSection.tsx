'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useBrandStore } from '@/stores/brandStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { propagateSwatchChange } from '@/lib/brand/swatch-sync';
import { propagatePresetChange } from '@/lib/brand/preset-sync';
import { generateComplementaryPalette } from '@/lib/color-utils';
import { ColorPicker } from '@/components/editor/panels/ColorPicker';
import { NumberInput } from '@/components/editor/panels/NumberInput';
import { GoogleFontsDropdown } from '@/components/editor/panels/GoogleFontsDropdown';
import { loadGoogleFont } from '@/hooks/useGoogleFonts';
import type { TypographyPreset } from '@/types/brand';

// Default presets used when brandStore has no custom presets
const DEFAULT_PRESETS: TypographyPreset[] = [
  { id: 'preset-headline', name: 'Headline', fontFamily: 'Inter', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0, color: '#000000' },
  { id: 'preset-subhead', name: 'Subhead', fontFamily: 'Inter', fontSize: 22, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0, color: '#333333' },
  { id: 'preset-body', name: 'Body', fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0, color: '#333333' },
  { id: 'preset-caption', name: 'Caption', fontFamily: 'Inter', fontSize: 11, fontWeight: 400, lineHeight: 1.4, letterSpacing: 20, color: '#666666' },
  { id: 'preset-cta', name: 'CTA', fontFamily: 'Inter', fontSize: 16, fontWeight: 700, lineHeight: 1.2, letterSpacing: 40, color: '#6366f1' },
];

const FONT_WEIGHTS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'SemiBold' },
  { value: 700, label: 'Bold' },
];

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#888888',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: 'Inter, sans-serif',
  display: 'block',
  marginBottom: '8px',
};

export function StyleSection() {
  const { brandColors, typographyPresets, addBrandSwatch, updateBrandSwatch, removeBrandSwatch, setTypographyPresets } = useBrandStore();
  const canvasRef = useCanvasStore((s) => s.canvasRef);
  const currentProject = useProjectStore((s) => s.currentProject);

  const projectId = currentProject?.meta.id ?? '';
  const currentPageIndex = currentProject?.currentPageIndex ?? 0;
  const totalPages = currentProject?.pages.length ?? 1;

  // Brand Colors state
  const [selectedSwatchId, setSelectedSwatchId] = useState<string | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

  // Palette Generator state
  const [paletteBaseColor, setPaletteBaseColor] = useState('#6366f1');
  const [generatedPalette, setGeneratedPalette] = useState<string[]>([]);

  // Typography Presets state
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);

  // Brand Colors: section open/closed
  const [brandColorsOpen, setBrandColorsOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [typographyOpen, setTypographyOpen] = useState(true);

  const presets = typographyPresets.length > 0 ? typographyPresets : DEFAULT_PRESETS;

  // Ensure presets initialized in store on first render if using defaults
  const ensurePresetsInitialized = () => {
    if (typographyPresets.length === 0) {
      setTypographyPresets(DEFAULT_PRESETS);
      return DEFAULT_PRESETS;
    }
    return typographyPresets;
  };

  const handleSwatchColorChange = (id: string, newHex: string) => {
    updateBrandSwatch(id, newHex);
    propagateSwatchChange(id, newHex, canvasRef, projectId, currentPageIndex, totalPages);
  };

  const handleSwatchNameChange = (id: string, name: string) => {
    const swatch = brandColors.find((s) => s.id === id);
    if (!swatch) return;
    // Update swatch with new name via replacing in store
    useBrandStore.setState((state) => ({
      brandColors: state.brandColors.map((s) => s.id === id ? { ...s, name } : s),
    }));
  };

  const handleGeneratePalette = () => {
    const palette = generateComplementaryPalette(paletteBaseColor);
    setGeneratedPalette(palette);
  };

  const handleAddPaletteColorToBrand = (hex: string) => {
    if (brandColors.length >= 10) return;
    addBrandSwatch({ id: crypto.randomUUID(), hex });
  };

  const handleAddAllPaletteToBrand = () => {
    const remaining = 10 - brandColors.length;
    const toAdd = generatedPalette.slice(0, remaining);
    toAdd.forEach((hex) => {
      addBrandSwatch({ id: crypto.randomUUID(), hex });
    });
  };

  const handlePresetChange = async (presetId: string, updates: Partial<Omit<TypographyPreset, 'id' | 'name'>>) => {
    const currentPresets = ensurePresetsInitialized();
    const updated = currentPresets.map((p) => p.id === presetId ? { ...p, ...updates } : p);
    setTypographyPresets(updated);
    const updatedPreset = updated.find((p) => p.id === presetId);
    if (!updatedPreset) return;

    if (updates.fontFamily) {
      await loadGoogleFont(updates.fontFamily, updatedPreset.fontWeight);
    }

    propagatePresetChange(
      presetId,
      {
        fontFamily: updatedPreset.fontFamily,
        fontSize: updatedPreset.fontSize,
        fontWeight: updatedPreset.fontWeight,
        lineHeight: updatedPreset.lineHeight,
        letterSpacing: updatedPreset.letterSpacing,
        color: updatedPreset.color,
      },
      canvasRef,
      projectId,
      currentPageIndex,
      totalPages
    );
  };

  const inputStyle: React.CSSProperties = {
    height: '28px',
    background: '#1e1e1e',
    border: '1px solid #2a2a2a',
    borderRadius: '4px',
    color: '#f5f5f5',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    padding: '0 8px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const btnStyle: React.CSSProperties = {
    height: '28px',
    background: '#1e1e1e',
    border: '1px solid #2a2a2a',
    borderRadius: '4px',
    color: '#f5f5f5',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    cursor: 'pointer',
    padding: '0 10px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* BRAND COLORS */}
      <div style={{ borderBottom: '1px solid #2a2a2a' }}>
        <button
          onClick={() => setBrandColorsOpen((v) => !v)}
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
          <span style={sectionHeaderStyle as React.CSSProperties}>BRAND COLORS</span>
          <ChevronDown
            size={16}
            style={{
              color: '#888888',
              transform: brandColorsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 150ms ease-in-out',
            }}
          />
        </button>

        {brandColorsOpen && (
          <div style={{ padding: '4px 16px 12px' }}>
            {/* Swatch row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {brandColors.map((swatch) => (
                <button
                  key={swatch.id}
                  onClick={() => setSelectedSwatchId(selectedSwatchId === swatch.id ? null : swatch.id)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: swatch.hex,
                    border: '1px solid #2a2a2a',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    outline: selectedSwatchId === swatch.id ? '1px solid #6366f1' : 'none',
                    outlineOffset: '1px',
                  }}
                  title={swatch.name ?? swatch.hex}
                />
              ))}
              {brandColors.length < 10 && (
                <button
                  onClick={() => addBrandSwatch({ id: crypto.randomUUID(), hex: '#6366f1' })}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: 'transparent',
                    border: '1px dashed #444',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#888888',
                    fontSize: '14px',
                    lineHeight: 1,
                  }}
                  title="Add brand swatch"
                >
                  +
                </button>
              )}
            </div>

            {/* Selected swatch editor */}
            {selectedSwatchId && (() => {
              const swatch = brandColors.find((s) => s.id === selectedSwatchId);
              if (!swatch) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', background: '#141414', borderRadius: '4px', border: '1px solid #2a2a2a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ColorPicker
                      value={swatch.hex}
                      onChange={(hex) => handleSwatchColorChange(swatch.id, hex)}
                    />
                    <span style={{ fontSize: '12px', color: '#888888', fontFamily: 'Inter, sans-serif' }}>Color</span>
                  </div>
                  <input
                    type="text"
                    value={swatch.name ?? ''}
                    onChange={(e) => handleSwatchNameChange(swatch.id, e.target.value)}
                    placeholder="Swatch name"
                    style={{ ...inputStyle, fontSize: '12px' }}
                  />
                  {removeConfirmId === swatch.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p style={{ fontSize: '11px', color: '#f5f5f5', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                        Remove this swatch? Elements using it will keep the color value.
                      </p>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => setRemoveConfirmId(null)}
                          style={{ ...btnStyle, flex: 1 }}
                        >
                          Keep Swatch
                        </button>
                        <button
                          onClick={() => {
                            removeBrandSwatch(swatch.id);
                            setSelectedSwatchId(null);
                            setRemoveConfirmId(null);
                          }}
                          style={{ ...btnStyle, flex: 1, background: '#ef4444', border: '1px solid #ef4444' }}
                        >
                          Remove Swatch
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRemoveConfirmId(swatch.id)}
                      style={{
                        ...btnStyle,
                        color: '#ef4444',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        justifyContent: 'flex-start',
                        fontSize: '11px',
                      }}
                    >
                      Remove Swatch
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* GENERATE PALETTE */}
      <div style={{ borderBottom: '1px solid #2a2a2a' }}>
        <button
          onClick={() => setPaletteOpen((v) => !v)}
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
          <span style={sectionHeaderStyle as React.CSSProperties}>GENERATE PALETTE</span>
          <ChevronDown
            size={16}
            style={{
              color: '#888888',
              transform: paletteOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 150ms ease-in-out',
            }}
          />
        </button>

        {paletteOpen && (
          <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Base color + generate button row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ColorPicker value={paletteBaseColor} onChange={setPaletteBaseColor} />
              <span style={{ fontSize: '12px', color: '#888888', fontFamily: 'Inter, sans-serif', flex: 1 }}>Base color</span>
              <button
                onClick={handleGeneratePalette}
                style={{
                  ...btnStyle,
                  background: '#1e1e1e',
                  border: '1px solid #2a2a2a',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a'; }}
              >
                Generate
              </button>
            </div>

            {/* Generated palette results */}
            {generatedPalette.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {generatedPalette.map((hex, i) => (
                    <button
                      key={`${hex}-${i}`}
                      onClick={() => handleAddPaletteColorToBrand(hex)}
                      disabled={brandColors.length >= 10}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: hex,
                        border: '1px solid #2a2a2a',
                        cursor: brandColors.length < 10 ? 'pointer' : 'not-allowed',
                        padding: 0,
                        flexShrink: 0,
                        opacity: brandColors.length >= 10 ? 0.5 : 1,
                      }}
                      title={`Add ${hex} to brand colors`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleAddAllPaletteToBrand}
                  disabled={brandColors.length >= 10}
                  style={{
                    ...btnStyle,
                    width: '100%',
                    opacity: brandColors.length >= 10 ? 0.5 : 1,
                    cursor: brandColors.length >= 10 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Add all to brand colors
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TYPOGRAPHY PRESETS */}
      <div style={{ borderBottom: '1px solid #2a2a2a' }}>
        <button
          onClick={() => setTypographyOpen((v) => !v)}
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
          <span style={sectionHeaderStyle as React.CSSProperties}>TYPOGRAPHY PRESETS</span>
          <ChevronDown
            size={16}
            style={{
              color: '#888888',
              transform: typographyOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 150ms ease-in-out',
            }}
          />
        </button>

        {typographyOpen && (
          <div style={{ padding: '4px 0 8px' }}>
            {presets.map((preset) => {
              const isExpanded = expandedPresetId === preset.id;
              return (
                <div key={preset.id}>
                  {/* Preset row header */}
                  <button
                    onClick={() => setExpandedPresetId(isExpanded ? null : preset.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 16px',
                      height: '36px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f5f5f5', fontFamily: 'Inter, sans-serif' }}>
                        {preset.name}
                      </span>
                      <span
                        style={{
                          fontFamily: preset.fontFamily + ', sans-serif',
                          fontSize: Math.min(preset.fontSize, 16) + 'px',
                          fontWeight: preset.fontWeight,
                          color: '#888888',
                          lineHeight: 1,
                        }}
                      >
                        Aa
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{
                        color: '#888888',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 150ms ease-in-out',
                      }}
                    />
                  </button>

                  {/* Expanded preset editor */}
                  {isExpanded && (
                    <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Font family */}
                      <GoogleFontsDropdown
                        value={preset.fontFamily}
                        onChange={(family) => handlePresetChange(preset.id, { fontFamily: family })}
                      />

                      {/* Font weight */}
                      <select
                        value={preset.fontWeight}
                        onChange={(e) => handlePresetChange(preset.id, { fontWeight: parseInt(e.target.value, 10) })}
                        style={selectStyle}
                      >
                        {FONT_WEIGHTS.map((w) => (
                          <option key={w.value} value={w.value}>{w.value} — {w.label}</option>
                        ))}
                      </select>

                      {/* Font size + line height row */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <NumberInput
                          value={preset.fontSize}
                          onChange={(v) => handlePresetChange(preset.id, { fontSize: v })}
                          suffix="pt"
                          min={1}
                          max={999}
                          step={1}
                        />
                        <NumberInput
                          value={preset.lineHeight}
                          onChange={(v) => handlePresetChange(preset.id, { lineHeight: v })}
                          suffix="x"
                          min={0.5}
                          max={5}
                          step={0.05}
                        />
                      </div>

                      {/* Letter spacing */}
                      <NumberInput
                        value={preset.letterSpacing}
                        onChange={(v) => handlePresetChange(preset.id, { letterSpacing: v })}
                        suffix="em"
                        min={-200}
                        max={1000}
                        step={10}
                      />

                      {/* Color */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#888888', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                          Color
                        </span>
                        <ColorPicker
                          value={preset.color}
                          onChange={(hex) => handlePresetChange(preset.id, { color: hex })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
