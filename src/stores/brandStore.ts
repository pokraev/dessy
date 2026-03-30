import { create } from 'zustand';
import type { ColorSwatch, TypographyPreset } from '@/types/brand';

interface BrandState {
  brandColors: ColorSwatch[];
  typographyPresets: TypographyPreset[];
  recentColors: string[];  // up to 12 hex values, newest first
  setBrandColors: (colors: ColorSwatch[]) => void;
  setTypographyPresets: (presets: TypographyPreset[]) => void;
  addRecentColor: (hex: string) => void;
  addBrandSwatch: (swatch: ColorSwatch) => void;
  updateBrandSwatch: (id: string, hex: string) => void;
  removeBrandSwatch: (id: string) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  brandColors: [],
  typographyPresets: [],
  recentColors: [],
  setBrandColors: (colors) => set({ brandColors: colors }),
  setTypographyPresets: (presets) => set({ typographyPresets: presets }),
  addRecentColor: (hex) =>
    set((state) => {
      const normalized = hex.toLowerCase();
      const deduped = [normalized, ...state.recentColors.filter((c) => c.toLowerCase() !== normalized)];
      return { recentColors: deduped.slice(0, 12) };
    }),
  addBrandSwatch: (swatch) =>
    set((state) => {
      if (state.brandColors.length >= 10) return state;
      return { brandColors: [...state.brandColors, swatch] };
    }),
  updateBrandSwatch: (id, hex) =>
    set((state) => ({
      brandColors: state.brandColors.map((s) => (s.id === id ? { ...s, hex } : s)),
    })),
  removeBrandSwatch: (id) =>
    set((state) => ({
      brandColors: state.brandColors.filter((s) => s.id !== id),
    })),
}));
