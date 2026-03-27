import { FORMATS, getFormatPixelDimensions } from '@/constants/formats';

describe('formats', () => {
  test('A4 dimensions are 210x297mm', () => {
    expect(FORMATS.A4.widthMm).toBe(210);
    expect(FORMATS.A4.heightMm).toBe(297);
  });
  test('all formats have 3mm bleed', () => {
    Object.values(FORMATS).forEach((fmt) => {
      expect(fmt.bleedMm).toBe(3);
    });
  });
  test('bifold has 2 pages, trifold has 3', () => {
    expect(FORMATS.bifold.pages).toBe(2);
    expect(FORMATS.trifold.pages).toBe(3);
  });
  test('getFormatPixelDimensions computes correct A4 at 300dpi', () => {
    const dims = getFormatPixelDimensions('A4', 300);
    expect(dims.widthPx).toBeCloseTo(2480.31, 0);
    expect(dims.heightPx).toBeCloseTo(3507.87, 0);
  });
  test('getFormatPixelDimensions throws on unknown format', () => {
    expect(() => getFormatPixelDimensions('Z9')).toThrow('Unknown format');
  });
});
