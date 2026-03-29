'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import useEyeDropper from 'use-eye-dropper';
import { Pipette } from 'lucide-react';
import { useBrandStore } from '@/stores/brandStore';
import { hexToRgb, rgbToHex, hexToHsl, hslToHex, PREDEFINED_PALETTES } from '@/lib/color-utils';
import { NumberInput } from './NumberInput';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  onSwatchApply?: (swatchId: string, hex: string) => void;
}

type ColorTab = 'HEX' | 'RGB' | 'HSL';

function ensureHash(hex: string): string {
  return hex.startsWith('#') ? hex : `#${hex}`;
}

export function ColorPicker({ value, onChange, onSwatchApply }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ColorTab>('HEX');
  const [paletteOpen, setPaletteOpen] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { recentColors, brandColors, addRecentColor, addBrandSwatch } = useBrandStore();
  const { open: openEyeDropper, isSupported } = useEyeDropper();

  const safeHex = ensureHash(value || '#000000');

  const handleChange = useCallback(
    (hex: string) => {
      onChange(ensureHash(hex));
      useBrandStore.getState().addRecentColor(ensureHash(hex));
    },
    [onChange]
  );

  const openPopover = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 480;
    const openUpward = rect.bottom + popoverHeight > window.innerHeight;
    const top = openUpward ? rect.top - popoverHeight - 4 : rect.bottom + 4;
    const left = Math.min(rect.left, window.innerWidth - 244);
    setPopoverPos({ top, left });
    setOpen(true);
  }, []);

  const handleEyeDropper = useCallback(async () => {
    try {
      const result = await openEyeDropper();
      if (result?.sRGBHex) {
        handleChange(result.sRGBHex);
      }
    } catch {
      // user cancelled
    }
  }, [openEyeDropper, handleChange]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const rgb = hexToRgb(safeHex);
  const hsl = hexToHsl(safeHex);

  const swatcherBtn: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: '1px solid #2a2a2a',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px',
    color: '#888888',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
    display: 'block',
  };

  const popoverContent = (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        top: popoverPos.top,
        left: popoverPos.left,
        zIndex: 200,
        width: '240px',
        background: '#1e1e1e',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      {/* Color wheel */}
      <div style={{ padding: '8px 8px 0' }}>
        <HexColorPicker
          color={safeHex}
          onChange={handleChange}
          style={{ width: '100%', height: '160px' }}
        />
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          margin: '8px 8px 0',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        {(['HEX', 'RGB', 'HSL'] as ColorTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
              color: tab === t ? '#f5f5f5' : '#888888',
              padding: 0,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '8px' }}>
        {tab === 'HEX' && (
          <div
            style={{
              height: '28px',
              background: '#141414',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '8px',
            }}
          >
            <HexColorInput
              color={safeHex}
              onChange={handleChange}
              prefixed
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f5f5f5',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                width: '100%',
              }}
            />
          </div>
        )}
        {tab === 'RGB' && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <NumberInput
              value={rgb.r}
              onChange={(r) => handleChange(rgbToHex(r, rgb.g, rgb.b))}
              min={0}
              max={255}
              suffix="R"
            />
            <NumberInput
              value={rgb.g}
              onChange={(g) => handleChange(rgbToHex(rgb.r, g, rgb.b))}
              min={0}
              max={255}
              suffix="G"
            />
            <NumberInput
              value={rgb.b}
              onChange={(b) => handleChange(rgbToHex(rgb.r, rgb.g, b))}
              min={0}
              max={255}
              suffix="B"
            />
          </div>
        )}
        {tab === 'HSL' && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <NumberInput
              value={hsl.h}
              onChange={(h) => handleChange(hslToHex(h, hsl.s, hsl.l))}
              min={0}
              max={360}
              suffix="H"
            />
            <NumberInput
              value={hsl.s}
              onChange={(s) => handleChange(hslToHex(hsl.h, s, hsl.l))}
              min={0}
              max={100}
              suffix="S"
            />
            <NumberInput
              value={hsl.l}
              onChange={(l) => handleChange(hslToHex(hsl.h, hsl.s, l))}
              min={0}
              max={100}
              suffix="L"
            />
          </div>
        )}
      </div>

      {/* Eyedropper */}
      <div style={{ padding: '0 8px 8px' }}>
        <button
          onClick={handleEyeDropper}
          disabled={!isSupported()}
          title={!isSupported() ? 'Color picker not supported in this browser' : undefined}
          style={{
            width: '100%',
            height: '28px',
            background: '#141414',
            border: '1px solid #2a2a2a',
            borderRadius: '4px',
            cursor: isSupported() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: isSupported() ? '#f5f5f5' : '#888888',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            opacity: isSupported() ? 1 : 0.5,
          }}
        >
          <Pipette size={12} />
          Pick from screen
        </button>
      </div>

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div style={{ padding: '0 8px 8px' }}>
          <span style={sectionLabel}>Recent</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {recentColors.slice(0, 12).map((hex) => (
              <button
                key={hex}
                onClick={() => {
                  onChange(hex);
                  addRecentColor(hex);
                }}
                style={{
                  ...swatcherBtn,
                  width: '20px',
                  height: '20px',
                  background: hex,
                }}
                title={hex}
              />
            ))}
          </div>
        </div>
      )}

      {/* Brand swatches */}
      <div style={{ padding: '0 8px 8px' }}>
        <span style={sectionLabel}>Brand</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {brandColors.map((swatch) => {
            const isSelected = swatch.hex.toLowerCase() === safeHex.toLowerCase();
            return (
              <button
                key={swatch.id}
                onClick={() => {
                  onChange(swatch.hex);
                  addRecentColor(swatch.hex);
                  onSwatchApply?.(swatch.id, swatch.hex);
                }}
                style={{
                  ...swatcherBtn,
                  background: swatch.hex,
                  outline: isSelected ? '1px solid #6366f1' : 'none',
                  outlineOffset: '1px',
                }}
                title={swatch.name ?? swatch.hex}
              />
            );
          })}
          {brandColors.length < 10 && (
            <button
              onClick={() =>
                addBrandSwatch({ id: crypto.randomUUID(), hex: safeHex })
              }
              style={{
                ...swatcherBtn,
                background: 'transparent',
                borderStyle: 'dashed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888888',
                fontSize: '14px',
                lineHeight: 1,
              }}
              title="Add current color as brand swatch"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Predefined palettes */}
      <div style={{ padding: '0 8px 8px', borderTop: '1px solid #2a2a2a' }}>
        <button
          onClick={() => setPaletteOpen(paletteOpen === '__all__' ? null : '__all__')}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 0',
            color: '#888888',
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <span>Palettes</span>
          <span>{paletteOpen === '__all__' ? '▲' : '▼'}</span>
        </button>
        {paletteOpen === '__all__' && (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {PREDEFINED_PALETTES.map((palette) => (
              <div key={palette.name} style={{ marginBottom: '6px' }}>
                <button
                  onClick={() =>
                    setPaletteOpen(
                      paletteOpen === palette.name ? '__all__' : palette.name
                    )
                  }
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#aaa',
                    fontSize: '11px',
                    fontFamily: 'Inter, sans-serif',
                    padding: '2px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{palette.name}</span>
                </button>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  {palette.colors.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => handleChange(hex)}
                      style={{
                        ...swatcherBtn,
                        background: hex,
                      }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Trigger swatch */}
      <button
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : openPopover())}
        style={{
          width: '24px',
          height: '24px',
          background: safeHex,
          border: '1px solid #2a2a2a',
          borderRadius: '4px',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
        title={safeHex}
      />

      {/* Portal popover */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>{open && popoverContent}</AnimatePresence>,
          document.body
        )}
    </>
  );
}
