
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { POPULAR_FONTS } from '@/constants/popular-fonts';

// Track which font+weight combos have already been injected
const injectedFonts = new Set<string>();

export async function loadGoogleFont(family: string, weight = 400): Promise<void> {
  if (typeof document === 'undefined') return;

  const slug = family.toLowerCase().replace(/\s+/g, '-');
  const id = `gf-${slug}-${weight}`;

  if (!injectedFonts.has(id)) {
    injectedFonts.add(id);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = id;
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
    document.head.appendChild(link);
  }

  // Await font load with 5s timeout
  try {
    const fontSpec = `${weight} 16px "${family}"`;
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Font load timeout')), 5000)
    );
    await Promise.race([
      document.fonts.load(fontSpec),
      timeoutPromise,
    ]);

    // Clear Fabric.js font measurement cache for this family so text re-measures
    const { cache } = await import('fabric');
    cache.clearFontCache(family);
  } catch {
    toast.error(i18n.t('canvas.fontUnavailable'), { duration: 3000 });
  }
}

interface GoogleFontsResult {
  fonts: string[];
  loading: boolean;
  loadMore: () => void;
  search: string;
  setSearch: (s: string) => void;
}

export function useGoogleFonts(): GoogleFontsResult {
  const [allFonts, setAllFonts] = useState<string[]>(POPULAR_FONTS);
  const [loading, setLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(40);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_FONTS_API_KEY as string | undefined;
    if (!apiKey) {
      // No API key — use popular fonts only (already set as initial state)
      return;
    }

    setLoading(true);
    fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${apiKey}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const families: string[] = (data.items ?? []).map(
          (item: { family: string }) => item.family
        );
        setAllFonts(families);
      })
      .catch(() => {
        // Fall back to popular fonts silently
      })
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => prev + 20);
  }, []);

  const filteredFonts = search
    ? allFonts.filter((f) =>
        f.toLowerCase().startsWith(search.toLowerCase())
      )
    : allFonts;

  const fonts = filteredFonts.slice(0, displayCount);

  return { fonts, loading, loadMore, search, setSearch };
}
