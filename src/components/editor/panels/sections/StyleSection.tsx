
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';
import { extractBrandFromUrl } from '@/lib/brand/extract-from-url';
import { getApiKey, getClaudeApiKey, getOpenAIApiKey, getProvider } from '@/lib/storage/apiKeyStorage';
import { saveBrand, setActiveBrandId } from '@/lib/storage/brandStorage';
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
import { BrandManager } from './BrandManager';

// Default presets used when brandStore has no custom presets
const DEFAULT_PRESETS: TypographyPreset[] = [
  { id: 'preset-headline', name: 'Headline', fontFamily: 'Inter', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: 0, color: '#000000' },
  { id: 'preset-subhead', name: 'Subhead', fontFamily: 'Inter', fontSize: 22, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0, color: '#333333' },
  { id: 'preset-body', name: 'Body', fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0, color: '#333333' },
  { id: 'preset-caption', name: 'Caption', fontFamily: 'Inter', fontSize: 11, fontWeight: 400, lineHeight: 1.4, letterSpacing: 20, color: '#666666' },
  { id: 'preset-cta', name: 'CTA', fontFamily: 'Inter', fontSize: 16, fontWeight: 700, lineHeight: 1.2, letterSpacing: 40, color: '#6366f1' },
];

const FONT_WEIGHTS = [
  { value: 300, labelKey: 'typography.light' },
  { value: 400, labelKey: 'typography.regular' },
  { value: 500, labelKey: 'typography.medium' },
  { value: 600, labelKey: 'typography.semiBold' },
  { value: 700, labelKey: 'typography.bold' },
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
  const { t } = useTranslation();
  const { brandColors, typographyPresets, addBrandSwatch, updateBrandSwatch, removeBrandSwatch, setBrandColors, setTypographyPresets } = useBrandStore();
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

  // Website brand extraction
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  function handleUrlChange(value: string) {
    setWebsiteUrl(value);
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    const trimmed = value.trim();
    // If input looks like a URL (contains a dot), skip autocomplete
    if (trimmed.length < 2 || trimmed.includes('.')) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    // Autocomplete disabled — CORS proxies are unreliable
    // Users type the website URL directly
  }

  function selectSuggestion(value: string) {
    setWebsiteUrl(value);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  // Close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    function onMouseDown(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showSuggestions]);

  async function handleExtractBrand() {
    if (!websiteUrl.trim()) return;
    const provider = getProvider();
    const apiKey = provider === 'claude' ? getClaudeApiKey() : provider === 'openai' ? getOpenAIApiKey() : getApiKey();
    if (!apiKey) {
      setExtractError(t('brand.noApiKey'));
      return;
    }
    setExtracting(true);
    setExtractError(null);
    useCanvasStore.getState().setBusyMessage(t('brand.extracting'));
    try {
      let url = websiteUrl.trim();
      // "dnevnik bg" → "dnevnik.bg", "apple" → "apple.com"
      url = url.replace(/\s+(com|net|org|io|bg|de|fr|uk|eu|co|us|ru|info|biz|me|tv|cc|ai)$/i, '.$1');
      url = url.replace(/\s+/g, '');
      if (!url.includes('.')) url += '.com';
      if (!/^https?:\/\//.test(url)) url = 'https://' + url;
      const brand = await extractBrandFromUrl(url, apiKey, provider);

      // Capture undo state before applying
      useCanvasStore.getState().captureUndoState?.();

      // Save brand and activate it
      saveBrand(brand);
      setActiveBrandId(brand.id);
      window.dispatchEvent(new Event('dessy-brands-changed'));

      // Apply colors and typography to stores
      setBrandColors(brand.colors);
      if (brand.typographyPresets.length > 0) {
        setTypographyPresets(brand.typographyPresets);
      }

      // Apply brand to canvas objects immediately
      const canvas = canvasRef;
      if (canvas && brand.colors.length > 0) {
        const colors = brand.colors.map((c) => c.hex);

        // Load brand fonts
        const fontFamilies = [...new Set(brand.typographyPresets.map((p) => p.fontFamily))];
        for (const family of fontFamilies) {
          await loadGoogleFont(family);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objects = canvas.getObjects() as any[];
        for (const obj of objects) {
          if (obj._isDocBackground) {
            const bgColor = brand.colors.find((c) => c.name?.toLowerCase().includes('background'))?.hex ?? colors[colors.length - 1];
            if (bgColor) obj.set({ fill: bgColor });
            continue;
          }
          if (obj.customType === 'text') {
            const textColor = brand.colors.find((c) => c.name?.toLowerCase().includes('text'))?.hex ?? colors[0];
            if (textColor) obj.set({ fill: textColor });
            const headlinePreset = brand.typographyPresets.find((p) => p.name === 'Headline');
            const bodyPreset = brand.typographyPresets.find((p) => p.name === 'Body');
            const fontSize = obj.fontSize ?? 14;
            const preset = fontSize >= 20 ? headlinePreset : bodyPreset;
            if (preset) obj.set({ fontFamily: preset.fontFamily, fontWeight: preset.fontWeight });
          } else if (obj.customType === 'colorBlock' || obj.customType === 'shape') {
            const accent = brand.colors.find((c) => c.name?.toLowerCase().includes('accent') || c.name?.toLowerCase().includes('primary'))?.hex ?? colors[1];
            if (accent) obj.set({ fill: accent });
          }
        }
        canvas.requestRenderAll();
      }

      setWebsiteUrl('');
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setExtracting(false);
      useCanvasStore.getState().setBusyMessage(null);
    }
  }

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

      {/* BRAND MANAGER */}
      <BrandManager />

      {/* EXTRACT FROM WEBSITE */}
      <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid #2a2a2a' }}>
        <span style={{ ...sectionHeaderStyle, marginBottom: '6px' }}>{t('brand.fromWebsite')}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div ref={suggestRef} style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { setShowSuggestions(false); handleExtractBrand(); }
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder={t('brand.websitePlaceholder')}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                background: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '4px',
                color: '#f5f5f5',
                outline: 'none',
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '2px',
                background: '#1e1e1e',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                zIndex: 20,
                overflow: 'hidden',
              }}>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => selectSuggestion(s)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      color: '#f5f5f5',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a2a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleExtractBrand}
            disabled={extracting || !websiteUrl.trim()}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: extracting ? 'wait' : 'pointer',
              opacity: extracting || !websiteUrl.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Globe size={12} />
            {extracting ? '...' : t('brand.extract')}
          </button>
        </div>
        {extractError && (
          <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0 0' }}>{extractError}</p>
        )}
      </div>

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
          <span style={sectionHeaderStyle as React.CSSProperties}>{t('brand.colors')}</span>
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
                  title={t('brand.addSwatch')}
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
                    <span style={{ fontSize: '12px', color: '#888888', fontFamily: 'Inter, sans-serif' }}>{t('brand.color')}</span>
                  </div>
                  <input
                    type="text"
                    value={swatch.name ?? ''}
                    onChange={(e) => handleSwatchNameChange(swatch.id, e.target.value)}
                    placeholder={t('brand.swatchName')}
                    style={{ ...inputStyle, fontSize: '12px' }}
                  />
                  {removeConfirmId === swatch.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p style={{ fontSize: '11px', color: '#f5f5f5', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                        {t('brand.removeConfirm')}
                      </p>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => setRemoveConfirmId(null)}
                          style={{ ...btnStyle, flex: 1 }}
                        >
                          {t('brand.keepSwatch')}
                        </button>
                        <button
                          onClick={() => {
                            removeBrandSwatch(swatch.id);
                            setSelectedSwatchId(null);
                            setRemoveConfirmId(null);
                          }}
                          style={{ ...btnStyle, flex: 1, background: '#ef4444', border: '1px solid #ef4444' }}
                        >
                          {t('brand.removeSwatch')}
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
                      {t('brand.removeSwatch')}
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
          <span style={sectionHeaderStyle as React.CSSProperties}>{t('brand.generatePalette')}</span>
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
              <span style={{ fontSize: '12px', color: '#888888', fontFamily: 'Inter, sans-serif', flex: 1 }}>{t('brand.baseColor')}</span>
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
                {t('brand.generate')}
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
                  {t('brand.addAllToBrand')}
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
          <span style={sectionHeaderStyle as React.CSSProperties}>{t('brand.typographyPresets')}</span>
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
                          <option key={w.value} value={w.value}>{w.value} — {t(w.labelKey)}</option>
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
                          {t('brand.color')}
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
