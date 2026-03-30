import { CATEGORY_COLORS, createProjectFromTemplate } from '@/lib/templates/template-utils';

jest.mock('@/lib/storage/projectStorage', () => ({
  saveProject: jest.fn(),
}));

// Mock crypto.randomUUID
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => {
      uuidCounter++;
      return `00000000-0000-0000-0000-${String(uuidCounter).padStart(12, '0')}`;
    },
  },
  configurable: true,
});

const mockTemplate = {
  id: 'test-01',
  name: 'Test Template',
  category: 'Sale' as const,
  format: 'A4' as const,
  pageCount: 1,
  canvasJSON: {
    version: '7.0.0',
    objects: [
      { type: 'Rect', left: 0, top: 0, width: 595, height: 842, _isDocBackground: true, customType: 'background' },
      { type: 'Textbox', left: 40, top: 60, width: 200, text: 'Hello' },
    ],
  },
};

beforeEach(() => {
  uuidCounter = 0;
});

describe('CATEGORY_COLORS', () => {
  it('has 8 entries', () => {
    expect(Object.keys(CATEGORY_COLORS)).toHaveLength(8);
  });

  it('Real Estate is #3b82f6', () => {
    expect(CATEGORY_COLORS['Real Estate']).toBe('#3b82f6');
  });
});

describe('createProjectFromTemplate', () => {
  it('returns a valid UUID', () => {
    const id = createProjectFromTemplate(mockTemplate);
    // UUID v4 pattern
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('sets originX/originY to left/top on all objects', () => {
    const { saveProject } = require('@/lib/storage/projectStorage');
    createProjectFromTemplate(mockTemplate);
    const callArg = saveProject.mock.calls[saveProject.mock.calls.length - 1][1];
    const objects = (callArg.canvasJSON as { objects: Record<string, unknown>[] }).objects;
    for (const obj of objects) {
      expect(obj.originX).toBe('left');
      expect(obj.originY).toBe('top');
    }
  });

  it('fixes doc background position with negative bleed offset', () => {
    const { saveProject } = require('@/lib/storage/projectStorage');
    createProjectFromTemplate(mockTemplate);
    const callArg = saveProject.mock.calls[saveProject.mock.calls.length - 1][1];
    const objects = (callArg.canvasJSON as { objects: Record<string, unknown>[] }).objects;
    const bg = objects.find((o) => o._isDocBackground);
    expect(bg).toBeDefined();
    // left and top should be negative (= -bleedPx)
    expect((bg!.left as number)).toBeLessThan(0);
    expect((bg!.top as number)).toBeLessThan(0);
    // width and height should be larger than A4 (595 x 842)
    expect((bg!.width as number)).toBeGreaterThan(595);
    expect((bg!.height as number)).toBeGreaterThan(842);
  });

  it('creates correct number of pages for the template', () => {
    const { saveProject } = require('@/lib/storage/projectStorage');

    const multiPageTemplate = { ...mockTemplate, pageCount: 3 };
    createProjectFromTemplate(multiPageTemplate);
    const callArg = saveProject.mock.calls[saveProject.mock.calls.length - 1][1];
    const pages = (callArg.pageData as { pages: unknown[] }).pages;
    expect(pages).toHaveLength(3);
  });

  it('does not mutate the original template canvasJSON', () => {
    const originalLeft = mockTemplate.canvasJSON.objects[0].left;
    const originalTop = mockTemplate.canvasJSON.objects[0].top;
    const originalWidth = mockTemplate.canvasJSON.objects[0].width;
    const originalHeight = mockTemplate.canvasJSON.objects[0].height;

    createProjectFromTemplate(mockTemplate);

    expect(mockTemplate.canvasJSON.objects[0].left).toBe(originalLeft);
    expect(mockTemplate.canvasJSON.objects[0].top).toBe(originalTop);
    expect(mockTemplate.canvasJSON.objects[0].width).toBe(originalWidth);
    expect(mockTemplate.canvasJSON.objects[0].height).toBe(originalHeight);
  });
});
