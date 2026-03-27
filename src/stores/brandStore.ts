import { create } from 'zustand';
import type { ColorSwatch, TypographyPreset } from '@/types/brand';

interface BrandState {
  brandColors: ColorSwatch[];
  typographyPresets: TypographyPreset[];
  setBrandColors: (colors: ColorSwatch[]) => void;
  setTypographyPresets: (presets: TypographyPreset[]) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  brandColors: [],
  typographyPresets: [],
  setBrandColors: (colors) => set({ brandColors: colors }),
  setTypographyPresets: (presets) => set({ typographyPresets: presets }),
}));
