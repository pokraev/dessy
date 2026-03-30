import type { Canvas } from 'fabric';
import type { SavedBrand } from '@/types/brand';
import { useBrandStore } from '@/stores/brandStore';
import { loadGoogleFont } from '@/hooks/useGoogleFonts';

/**
 * Apply a saved brand to all objects on the canvas.
 * - Background rect gets the brand's background color
 * - Text objects get text color + typography (headline preset for large text, body for small)
 * - Shapes/colorBlocks get accent/primary color
 * - Loads required Google Fonts
 */
export async function applyBrandToCanvas(canvas: Canvas, brand: SavedBrand): Promise<void> {
  const colors = brand.colors.map((c) => c.hex);
  if (colors.length === 0) return;

  // Load brand fonts
  const fontFamilies = [...new Set(brand.typographyPresets.map((p) => p.fontFamily))];
  await Promise.all(fontFamilies.map((f) => loadGoogleFont(f).catch(() => {})));

  // Find named colors with fallbacks
  const bgColor = brand.colors.find((c) => c.name?.toLowerCase().includes('background'))?.hex ?? colors[colors.length - 1];
  const textColor = brand.colors.find((c) => c.name?.toLowerCase().includes('text'))?.hex ?? colors[0];
  const accentColor = brand.colors.find((c) =>
    c.name?.toLowerCase().includes('accent') || c.name?.toLowerCase().includes('primary')
  )?.hex ?? colors[1 % colors.length];
  const secondaryColor = brand.colors.find((c) =>
    c.name?.toLowerCase().includes('secondary')
  )?.hex ?? colors[2 % colors.length];

  // Find typography presets
  const headlinePreset = brand.typographyPresets.find((p) => p.name === 'Headline');
  const subheadPreset = brand.typographyPresets.find((p) => p.name === 'Subhead');
  const bodyPreset = brand.typographyPresets.find((p) => p.name === 'Body');
  const ctaPreset = brand.typographyPresets.find((p) => p.name === 'CTA');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects = canvas.getObjects() as any[];
  let colorBlockIndex = 0;
  const colorBlockColors = [accentColor, secondaryColor, ...colors.filter((c) => c !== bgColor && c !== textColor)];

  for (const obj of objects) {
    if (obj._isDocBackground) {
      obj.set({ fill: bgColor });
      continue;
    }

    if (obj.customType === 'text' || obj.customType === 'textFrame') {
      // Determine preset by font size
      const fontSize = obj.fontSize ?? 14;
      let preset;
      if (fontSize >= 28) preset = headlinePreset;
      else if (fontSize >= 20) preset = subheadPreset ?? headlinePreset;
      else if (fontSize >= 14) preset = bodyPreset;
      else preset = bodyPreset;

      // Check if text looks like a CTA (short, button-like)
      const text = (obj.text ?? '').trim();
      if (text.length < 20 && text === text.toUpperCase() && ctaPreset) {
        preset = ctaPreset;
      }

      // Fallback: use any available preset if none matched
      if (!preset && brand.typographyPresets.length > 0) {
        preset = brand.typographyPresets[0];
      }

      if (preset) {
        obj.set({
          fontFamily: preset.fontFamily,
          fontWeight: preset.fontWeight,
          fill: preset.color || textColor,
        });
      } else {
        obj.set({ fill: textColor });
      }
    } else if (obj.customType === 'colorBlock' || obj.customType === 'shape') {
      // Cycle through brand colors for variety
      const color = colorBlockColors[colorBlockIndex % colorBlockColors.length];
      if (color) obj.set({ fill: color });
      colorBlockIndex++;
    }
  }

  // Update brand store
  useBrandStore.getState().setBrandColors(brand.colors);
  if (brand.typographyPresets.length > 0) {
    useBrandStore.getState().setTypographyPresets(brand.typographyPresets);
  }

  canvas.requestRenderAll();
}
