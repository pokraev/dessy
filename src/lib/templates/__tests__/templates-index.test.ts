import { describe, it, expect } from '@jest/globals';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../templates-index';

describe('templates-index', () => {
  it('exports TEMPLATES array with entries', () => {
    expect(TEMPLATES.length).toBeGreaterThan(0);
  });

  it('each template has required fields', () => {
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.format).toBeTruthy();
      expect(t.pageCount).toBeGreaterThanOrEqual(1);
      expect(t.canvasJSON).toBeTruthy();
    }
  });

  it('exports TEMPLATE_CATEGORIES with entries', () => {
    expect(TEMPLATE_CATEGORIES.length).toBeGreaterThan(0);
  });
});
