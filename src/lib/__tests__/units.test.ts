import { mmToPx, pxToMm, SCREEN_DPI } from '@/lib/units';

describe('units', () => {
  test('mmToPx converts A4 width at 300dpi', () => {
    expect(mmToPx(210, 300)).toBeCloseTo(2480.31, 0);
  });
  test('mmToPx converts A4 width at screen dpi (72)', () => {
    expect(mmToPx(210, 72)).toBeCloseTo(595.28, 0);
  });
  test('pxToMm inverts mmToPx at screen dpi', () => {
    const px = mmToPx(148);
    expect(pxToMm(px)).toBeCloseTo(148, 2);
  });
  test('SCREEN_DPI is 72', () => {
    expect(SCREEN_DPI).toBe(72);
  });
});
