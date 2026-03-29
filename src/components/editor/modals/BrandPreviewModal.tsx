import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { loadGoogleFont } from '@/hooks/useGoogleFonts';
import type { SavedBrand } from '@/types/brand';

interface Props {
  brand: SavedBrand | null;
  onClose: () => void;
}

export function BrandPreviewModal({ brand, onClose }: Props) {
  const { t } = useTranslation();

  // Load brand fonts when modal opens
  useEffect(() => {
    if (!brand) return;
    const families = [...new Set(brand.typographyPresets.map((p) => p.fontFamily))];
    families.forEach((family) => {
      loadGoogleFont(family, 400);
      loadGoogleFont(family, 700);
    });
  }, [brand]);

  if (!brand) return null;

  const colors = brand.colors;
  const primary = colors.find((c) => c.name?.toLowerCase().includes('primary'))?.hex ?? colors[0]?.hex ?? '#6366f1';
  const secondary = colors.find((c) => c.name?.toLowerCase().includes('secondary'))?.hex ?? colors[1]?.hex ?? '#818cf8';
  const accent = colors.find((c) => c.name?.toLowerCase().includes('accent'))?.hex ?? colors[2]?.hex ?? '#a5b4fc';
  const bg = colors.find((c) => c.name?.toLowerCase().includes('background'))?.hex ?? colors[colors.length - 1]?.hex ?? '#ffffff';
  const textColor = colors.find((c) => c.name?.toLowerCase().includes('text'))?.hex ?? colors[0]?.hex ?? '#1a1a1a';

  const headline = brand.typographyPresets.find((p) => p.name === 'Headline');
  const subhead = brand.typographyPresets.find((p) => p.name === 'Subhead');
  const body = brand.typographyPresets.find((p) => p.name === 'Body');
  const caption = brand.typographyPresets.find((p) => p.name === 'Caption');
  const cta = brand.typographyPresets.find((p) => p.name === 'CTA');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#141414', border: '1px solid #2a2a2a', borderRadius: '10px',
            width: '90vw', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', fontSize: '11px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderBottom: '1px solid #2a2a2a',
          }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f5f5f5' }}>{brand.name}</span>
              {brand.sourceUrl && (
                <span style={{ fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                  {brand.sourceUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#888', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          {/* Main content — side by side */}
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Left: Colors + Typography */}
            <div style={{ flex: '0 0 320px', borderRight: '1px solid #2a2a2a' }}>
              {/* Color palette */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2a2a' }}>
                <h4 style={{ fontSize: '10px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                  {t('brand.colors')}
                </h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {colors.map((c) => (
                    <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '4px',
                        background: c.hex, border: '1px solid #2a2a2a',
                      }} />
                      <span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase' }}>{c.hex}</span>
                      {c.name && <span style={{ fontSize: '8px', color: '#555' }}>{c.name}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div style={{ padding: '10px 14px' }}>
                <h4 style={{ fontSize: '10px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                  {t('brand.typographyPresets')}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {brand.typographyPresets.map((preset) => (
                    <div key={preset.id} style={{
                      display: 'flex', alignItems: 'baseline', gap: '8px',
                      padding: '4px 8px', background: '#0a0a0a', borderRadius: '4px',
                    }}>
                      <span style={{
                        fontFamily: preset.fontFamily, fontSize: Math.min(preset.fontSize, 22),
                        fontWeight: preset.fontWeight, lineHeight: 1.2,
                        color: preset.color, flex: 1,
                      }}>
                        {preset.name}
                      </span>
                      <span style={{ fontSize: '9px', color: '#555', whiteSpace: 'nowrap' }}>
                        {preset.fontFamily} · {preset.fontWeight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live preview */}
            <div style={{ flex: 1, padding: '10px 14px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>
              {t('brand.preview')}
            </h4>
            <div style={{
              background: bg, borderRadius: '8px', overflow: 'hidden',
              border: '1px solid #2a2a2a', padding: 0,
            }}>
              {/* Hero banner */}
              <div style={{ background: primary, padding: '14px 12px' }}>
                <div style={{
                  fontFamily: headline?.fontFamily ?? 'Inter', fontSize: 18,
                  fontWeight: headline?.fontWeight ?? 700, color: '#fff',
                  lineHeight: headline?.lineHeight ?? 1.2,
                }}>
                  {brand.name}
                </div>
                <div style={{
                  fontFamily: subhead?.fontFamily ?? 'Inter', fontSize: 14,
                  fontWeight: subhead?.fontWeight ?? 400, color: 'rgba(255,255,255,0.8)',
                  marginTop: '6px', lineHeight: subhead?.lineHeight ?? 1.4,
                }}>
                  {t('brand.previewSubhead')}
                </div>
              </div>

              {/* Content area */}
              <div style={{ padding: '12px' }}>
                {/* Accent bar */}
                <div style={{ width: '40px', height: '3px', background: accent, borderRadius: '2px', marginBottom: '12px' }} />

                <div style={{
                  fontFamily: subhead?.fontFamily ?? 'Inter', fontSize: 16,
                  fontWeight: subhead?.fontWeight ?? 600, color: textColor,
                  marginBottom: '8px', lineHeight: subhead?.lineHeight ?? 1.3,
                }}>
                  {t('brand.previewSectionTitle')}
                </div>

                <div style={{
                  fontFamily: body?.fontFamily ?? 'Inter', fontSize: body?.fontSize ?? 14,
                  fontWeight: body?.fontWeight ?? 400, color: textColor,
                  lineHeight: body?.lineHeight ?? 1.5, opacity: 0.8, marginBottom: '16px',
                }}>
                  {t('brand.previewBody')}
                </div>

                {/* Feature cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  {[
                    { color: secondary, key: 'brand.previewFeature1' },
                    { color: accent, key: 'brand.previewFeature2' },
                    { color: primary, key: 'brand.previewFeature3' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: item.color, borderRadius: '6px', padding: '12px',
                      display: 'flex', flexDirection: 'column', gap: '4px',
                    }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '4px',
                        background: 'rgba(255,255,255,0.3)',
                      }} />
                      <span style={{
                        fontFamily: caption?.fontFamily ?? 'Inter', fontSize: 11,
                        fontWeight: caption?.fontWeight ?? 500, color: '#fff',
                      }}>
                        {t(item.key)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{
                  background: primary, color: cta?.color ?? '#fff',
                  fontFamily: cta?.fontFamily ?? 'Inter', fontSize: cta?.fontSize ?? 14,
                  fontWeight: cta?.fontWeight ?? 700, padding: '10px 20px',
                  borderRadius: '6px', display: 'inline-block', cursor: 'default',
                }}>
                  {t('brand.previewCta')}
                </div>

                {/* Footer */}
                <div style={{
                  marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${secondary}`,
                  fontFamily: caption?.fontFamily ?? 'Inter', fontSize: 10,
                  color: textColor, opacity: 0.5,
                }}>
                  {t('brand.previewFooter')}
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Style badge */}
          {brand.style && (
            <div style={{ padding: '0 14px 10px' }}>
              <span style={{
                fontSize: '11px', color: '#888', background: '#1e1e1e',
                padding: '4px 10px', borderRadius: '4px', border: '1px solid #2a2a2a',
              }}>
                {t(`style.${brand.style}`)}
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
