import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Trash2, ChevronDown, Eye } from 'lucide-react';
import { BrandPreviewModal } from '@/components/editor/modals/BrandPreviewModal';
import { useBrandStore } from '@/stores/brandStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { getSavedBrands, saveBrand, deleteBrand, getActiveBrandId, setActiveBrandId } from '@/lib/storage/brandStorage';
import { loadGoogleFont } from '@/hooks/useGoogleFonts';
import type { SavedBrand } from '@/types/brand';

export function BrandManager() {
  const { t } = useTranslation();
  const { brandColors, typographyPresets, setBrandColors, setTypographyPresets } = useBrandStore();
  const [brands, setBrands] = useState<SavedBrand[]>([]);
  const [activeBrandId, setActiveId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [previewBrand, setPreviewBrand] = useState<SavedBrand | null>(null);

  useEffect(() => {
    function refresh() {
      setBrands(getSavedBrands());
      setActiveId(getActiveBrandId());
    }
    refresh();
    // Listen for brand changes from other components (e.g. StyleSection extraction)
    window.addEventListener('dessy-brands-changed', refresh);
    return () => window.removeEventListener('dessy-brands-changed', refresh);
  }, []);

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? null;

  function handleSelectBrand(brand: SavedBrand) {
    // Capture undo state
    useCanvasStore.getState().captureUndoState?.();

    // Apply brand to stores
    setBrandColors(brand.colors);
    setTypographyPresets(brand.typographyPresets);
    setActiveBrandId(brand.id);
    setActiveId(brand.id);
    setDropdownOpen(false);

    // Apply to canvas
    applyBrandToCanvas(brand);
  }

  async function applyBrandToCanvas(brand: SavedBrand) {
    const canvas = useCanvasStore.getState().canvasRef;
    if (!canvas || brand.colors.length === 0) return;

    // Load brand fonts
    const fontFamilies = [...new Set(brand.typographyPresets.map((p) => p.fontFamily))];
    for (const family of fontFamilies) {
      await loadGoogleFont(family);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects() as any[];
    const colors = brand.colors.map((c) => c.hex);

    for (const obj of objects) {
      if (obj._isDocBackground) {
        const bgColor = colors.find((_, i) => brand.colors[i]?.name?.toLowerCase().includes('background')) ?? colors[colors.length - 1];
        if (bgColor) obj.set({ fill: bgColor });
        continue;
      }

      if (obj.customType === 'text') {
        const textColor = colors.find((_, i) => brand.colors[i]?.name?.toLowerCase().includes('text')) ?? colors[0];
        if (textColor) obj.set({ fill: textColor });
        // Apply matching typography preset
        const headlinePreset = brand.typographyPresets.find((p) => p.name === 'Headline');
        const bodyPreset = brand.typographyPresets.find((p) => p.name === 'Body');
        const fontSize = obj.fontSize ?? 14;
        const preset = fontSize >= 20 ? headlinePreset : bodyPreset;
        if (preset) {
          obj.set({ fontFamily: preset.fontFamily, fontWeight: preset.fontWeight });
        }
      } else if (obj.customType === 'colorBlock' || obj.customType === 'shape') {
        const accent = colors.find((_, i) => brand.colors[i]?.name?.toLowerCase().includes('accent') || brand.colors[i]?.name?.toLowerCase().includes('primary')) ?? colors[1];
        if (accent) obj.set({ fill: accent });
      }
    }
    canvas.requestRenderAll();
  }

  function handleSaveCurrent() {
    if (!activeBrand) {
      // Save as new brand
      const newBrand: SavedBrand = {
        id: crypto.randomUUID(),
        name: t('brand.untitledBrand'),
        colors: brandColors,
        typographyPresets,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveBrand(newBrand);
      setActiveBrandId(newBrand.id);
      setActiveId(newBrand.id);
      setBrands(getSavedBrands());
    } else {
      // Update existing
      const updated = { ...activeBrand, colors: brandColors, typographyPresets, updatedAt: new Date().toISOString() };
      saveBrand(updated);
      setBrands(getSavedBrands());
    }
  }

  function handleDelete(id: string) {
    deleteBrand(id);
    if (activeBrandId === id) {
      setActiveId(null);
      setActiveBrandId(null);
    }
    setBrands(getSavedBrands());
    setDropdownOpen(false);
  }

  function handleRename() {
    if (!activeBrand || !nameInput.trim()) return;
    const updated = { ...activeBrand, name: nameInput.trim(), updatedAt: new Date().toISOString() };
    saveBrand(updated);
    setBrands(getSavedBrands());
    setRenaming(false);
  }

  function handleClearBrand() {
    useCanvasStore.getState().captureUndoState?.();
    setBrandColors([]);
    setActiveBrandId(null);
    setActiveId(null);
    setDropdownOpen(false);
  }

  // Called from StyleSection after extraction
  function handleBrandExtracted(brand: SavedBrand) {
    saveBrand(brand);
    setActiveBrandId(brand.id);
    setActiveId(brand.id);
    setBrands(getSavedBrands());
  }

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '4px',
    color: '#888',
  };

  return (
    <div style={{ padding: '8px 12px', borderBottom: '1px solid #2a2a2a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Brand selector */}
        <div style={{ flex: 1, position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: '100%',
              padding: '5px 8px',
              fontSize: '12px',
              background: '#0a0a0a',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              color: '#f5f5f5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {renaming ? (
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f5f5f5',
                  fontSize: '12px',
                  outline: 'none',
                  width: '100%',
                  padding: 0,
                }}
              />
            ) : (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeBrand?.name ?? t('brand.noBrand')}
              </span>
            )}
            <ChevronDown size={12} style={{ flexShrink: 0, transform: dropdownOpen ? 'rotate(180deg)' : '', transition: 'transform 0.15s' }} />
          </button>

          {dropdownOpen && (
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
              maxHeight: '200px',
              overflowY: 'auto',
            }}>
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: brand.id === activeBrandId ? '#6366f1' : '#f5f5f5',
                    background: brand.id === activeBrandId ? '#1a1a2e' : 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a2a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = brand.id === activeBrandId ? '#1a1a2e' : 'transparent'; }}
                >
                  {/* Color preview dots */}
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    {brand.colors.slice(0, 4).map((c) => (
                      <div key={c.id} style={{ width: '10px', height: '10px', borderRadius: '2px', background: c.hex, border: '1px solid rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <span
                    style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    onClick={() => handleSelectBrand(brand)}
                  >
                    {brand.name}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewBrand(brand); setDropdownOpen(false); }}
                    style={btnStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Eye size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(brand.id); }}
                    style={{ ...btnStyle, color: '#ef4444' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a2a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {brands.length > 0 && <div style={{ height: '1px', background: '#2a2a2a' }} />}
              <div
                style={{ padding: '6px 8px', cursor: 'pointer', fontSize: '12px', color: '#888' }}
                onClick={handleClearBrand}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a2a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {t('brand.clearBrand')}
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSaveCurrent}
          style={btnStyle}
          title={t('brand.saveBrand')}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a2a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Save size={14} />
        </button>

        {/* Rename (only if active) */}
        {activeBrand && !renaming && (
          <button
            onClick={() => { setNameInput(activeBrand.name); setRenaming(true); }}
            style={{ ...btnStyle, fontSize: '11px', color: '#888' }}
            title={t('brand.renameBrand')}
          >
            ✎
          </button>
        )}
      </div>

      {/* Color preview dots */}
      {activeBrand && activeBrand.colors.length > 0 && (
        <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
          {activeBrand.colors.map((c) => (
            <div
              key={c.id}
              title={c.name ?? c.hex}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '3px',
                background: c.hex,
                border: '1px solid #2a2a2a',
              }}
            />
          ))}
        </div>
      )}
      {/* Preview modal */}
      <BrandPreviewModal brand={previewBrand} onClose={() => setPreviewBrand(null)} />
    </div>
  );
}

// Export for use by StyleSection after extraction
export { type SavedBrand };
