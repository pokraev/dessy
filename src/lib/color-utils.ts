/**
 * Color utility functions: hex/rgb/hsl conversions, palette generation.
 */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const hn = h / 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r: number;
  let g: number;
  let b: number;
  if (sn === 0) {
    r = g = b = ln;
  } else {
    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    r = hue2rgb(p, q, hn + 1 / 3);
    g = hue2rgb(p, q, hn);
    b = hue2rgb(p, q, hn - 1 / 3);
  }
  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

/**
 * Generate a complementary palette from a base color.
 * Returns 5 hex colors: base, triadic +120, triadic +240, split-comp +150, split-comp +210.
 */
export function generateComplementaryPalette(baseHex: string): string[] {
  const { h, s, l } = hexToHsl(baseHex);
  const rotate = (deg: number) => hslToHex((h + deg) % 360, s, l);
  return [baseHex, rotate(120), rotate(240), rotate(150), rotate(210)];
}

export const PREDEFINED_PALETTES: { name: string; colors: string[] }[] = [
  {
    name: 'Ocean',
    colors: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#023e8a'],
  },
  {
    name: 'Forest',
    colors: ['#1b4332', '#2d6a4f', '#40916c', '#74c69d', '#b7e4c7'],
  },
  {
    name: 'Sunset',
    colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8'],
  },
  {
    name: 'Berry',
    colors: ['#6a0572', '#9b2226', '#ae2012', '#bb3e03', '#ca6702'],
  },
  {
    name: 'Earth',
    colors: ['#582f0e', '#7f4f24', '#936639', '#a68a64', '#b6ad90'],
  },
  {
    name: 'Coral',
    colors: ['#ff6b6b', '#ff8e53', '#ffb347', '#ffd166', '#06d6a0'],
  },
  {
    name: 'Midnight',
    colors: ['#10002b', '#240046', '#3c096c', '#5a189a', '#7b2fbe'],
  },
  {
    name: 'Lavender',
    colors: ['#e0aaff', '#c77dff', '#9d4edd', '#7b2d8b', '#5a189a'],
  },
  {
    name: 'Autumn',
    colors: ['#b5541c', '#cf6a17', '#e07b39', '#f5b942', '#fbdfa7'],
  },
  {
    name: 'Spring',
    colors: ['#d8f3dc', '#b7e4c7', '#95d5b2', '#74c69d', '#52b788'],
  },
  {
    name: 'Neon',
    colors: ['#ff00ff', '#00ffff', '#ffff00', '#ff6600', '#00ff66'],
  },
  {
    name: 'Pastel',
    colors: ['#ffd6e7', '#ffbcd4', '#c8b6e2', '#b8d8e8', '#a0d2db'],
  },
  {
    name: 'Jewel',
    colors: ['#e63946', '#457b9d', '#1d3557', '#f4a261', '#2a9d8f'],
  },
  {
    name: 'Warm Neutral',
    colors: ['#f5f0e8', '#e8d5b7', '#c9a96e', '#a07850', '#6e4f3a'],
  },
  {
    name: 'Cool Neutral',
    colors: ['#f0f4f8', '#d9e2ec', '#9fb3c8', '#627d98', '#334e68'],
  },
  {
    name: 'Terracotta',
    colors: ['#cb7a5e', '#c0653a', '#a84420', '#8b3311', '#6f2110'],
  },
  {
    name: 'Sage',
    colors: ['#7d9e8c', '#6b8c7a', '#5a7a68', '#496856', '#385644'],
  },
  {
    name: 'Dusty Rose',
    colors: ['#e8c5c5', '#d4a5a5', '#c08585', '#ab6565', '#964545'],
  },
  {
    name: 'Slate',
    colors: ['#64748b', '#475569', '#334155', '#1e293b', '#0f172a'],
  },
  {
    name: 'Citrus',
    colors: ['#ffde21', '#f7b731', '#fa8231', '#e84393', '#20bf6b'],
  },
  {
    name: 'Vintage',
    colors: ['#d4a373', '#ccd5ae', '#e9edc9', '#fefae0', '#faedcd'],
  },
  {
    name: 'Modern Minimal',
    colors: ['#ffffff', '#f5f5f5', '#e0e0e0', '#9e9e9e', '#212121'],
  },
];
