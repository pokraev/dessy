import { exportProjectJSON, importProjectJSON } from '@/lib/fabric/serialization';
import type { ProjectMeta } from '@/types/project';

const makeMeta = (): ProjectMeta => ({
  id: 'proj-abc',
  name: 'My Leaflet',
  format: 'A4',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

// Mock document.createElement for anchor downloads
const mockClick = jest.fn();
const mockAnchor = {
  href: '',
  download: '',
  click: mockClick,
};
jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'a') return mockAnchor as unknown as HTMLAnchorElement;
  return document.createElement(tag);
});

// Mock URL.createObjectURL and URL.revokeObjectURL
const MOCK_BLOB_URL = 'blob:http://localhost/test';
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => MOCK_BLOB_URL),
  configurable: true,
  writable: true,
});
Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
  configurable: true,
  writable: true,
});

const makeCanvasMock = (canvasData: Record<string, unknown> = { objects: [] }) => ({
  toDatalessJSON: jest.fn().mockReturnValue(canvasData),
  loadFromJSON: jest.fn().mockResolvedValue(undefined),
  renderAll: jest.fn(),
});

describe('exportProjectJSON', () => {
  it('creates correct JSON structure and triggers download', () => {
    const canvas = makeCanvasMock({ objects: [{ type: 'rect' }] });
    const meta = makeMeta();

    exportProjectJSON(canvas as never, meta);

    expect(canvas.toDatalessJSON).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockAnchor.download).toMatch(/\.dessy\.json$/);
    expect(mockAnchor.download).toContain('my-leaflet');
  });
});

describe('importProjectJSON', () => {
  it('calls loadFromJSON with canvas data and returns meta', async () => {
    const canvas = makeCanvasMock();
    const meta = makeMeta();
    const fileData = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      meta,
      canvas: { objects: [] },
    });
    const file = new File([fileData], 'project.dessy.json', { type: 'application/json' });
    // jsdom File does not implement .text() — polyfill it
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(fileData),
      configurable: true,
    });

    const result = await importProjectJSON(canvas as never, file);

    expect(canvas.loadFromJSON).toHaveBeenCalledWith({ objects: [] });
    expect(result.id).toBe('proj-abc');
  });

  it('throws on invalid file format', async () => {
    const canvas = makeCanvasMock();
    const badData = '{"bad": "data"}';
    const file = new File([badData], 'bad.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(badData),
      configurable: true,
    });

    await expect(importProjectJSON(canvas as never, file)).rejects.toThrow('Invalid Dessy project file');
  });
});
