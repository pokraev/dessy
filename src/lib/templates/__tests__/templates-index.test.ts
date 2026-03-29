import { describe, it, expect } from '@jest/globals';

describe('templates-index', () => {
  it.todo('TEMPLATES array has at least 10 entries');
  it.todo('TEMPLATE_CATEGORIES has 8 categories');
  it.todo('every template has a valid format (A4|A5|DL|bifold|trifold|custom)');
  it.todo('every template canvasJSON has an objects array');
  it.todo('every template canvasJSON objects array has at least one object with _isDocBackground');
  it.todo('no template canvasJSON contains base64 image data');

  it('stub passes', () => {
    expect(true).toBe(true);
  });
});
