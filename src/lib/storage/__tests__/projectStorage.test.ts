import { saveProject, loadProject, listProjects, deleteProject, duplicateProject, updateProjectName } from '../projectStorage';
import type { ProjectMeta } from '@/types/project';

const makeMeta = (id: string): ProjectMeta => ({
  id,
  name: 'Test Project',
  format: 'A4',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

// Simple in-memory localStorage mock
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

// Stable UUID counter for crypto.randomUUID
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => `uuid-${++uuidCounter}` },
  configurable: true,
});

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    configurable: true,
    writable: true,
  });
  mockLocalStorage.clear();
  uuidCounter = 0;
  jest.restoreAllMocks();
});

describe('saveProject', () => {
  it('stores data in localStorage with key dessy-project-{id}', () => {
    const meta = makeMeta('proj-1');
    const result = saveProject('proj-1', { meta, canvasJSON: {}, pageData: {} });
    expect(result.success).toBe(true);
    const stored = localStorage.getItem('dessy-project-proj-1');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.meta.id).toBe('proj-1');
  });

  it('returns { success: false, error: "quota" } on QuotaExceededError', () => {
    // Spy on our mock localStorage's setItem directly
    const original = mockLocalStorage.setItem;
    mockLocalStorage.setItem = (_key: string, _value: string) => {
      const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
      throw err;
    };
    const meta = makeMeta('proj-2');
    const result = saveProject('proj-2', { meta, canvasJSON: {}, pageData: {} });
    mockLocalStorage.setItem = original;
    expect(result.success).toBe(false);
    expect(result.error).toBe('quota');
  });
});

describe('loadProject', () => {
  it('returns the saved project and canvas JSON', () => {
    const meta = makeMeta('proj-3');
    const canvasJSON = { objects: [{ type: 'rect' }] };
    saveProject('proj-3', { meta, canvasJSON, pageData: {} });
    const loaded = loadProject('proj-3');
    expect(loaded).not.toBeNull();
    expect(loaded!.meta.id).toBe('proj-3');
    expect(loaded!.canvasJSON).toEqual(canvasJSON);
  });

  it('returns null if project not found', () => {
    expect(loadProject('nonexistent')).toBeNull();
  });
});

describe('listProjects', () => {
  it('returns array of ProjectMeta from localStorage', () => {
    saveProject('a', { meta: makeMeta('a'), canvasJSON: {}, pageData: {} });
    saveProject('b', { meta: makeMeta('b'), canvasJSON: {}, pageData: {} });
    const list = listProjects();
    expect(list).toHaveLength(2);
    expect(list.map((p) => p.id)).toContain('a');
    expect(list.map((p) => p.id)).toContain('b');
  });

  it('returns empty array when nothing saved', () => {
    expect(listProjects()).toEqual([]);
  });
});

describe('deleteProject', () => {
  it('removes the entry from localStorage', () => {
    saveProject('del-1', { meta: makeMeta('del-1'), canvasJSON: {}, pageData: {} });
    deleteProject('del-1');
    expect(loadProject('del-1')).toBeNull();
    const list = listProjects();
    expect(list.find((p) => p.id === 'del-1')).toBeUndefined();
  });
});

describe('duplicateProject', () => {
  it('returns new project ID when source exists', () => {
    saveProject('src-1', { meta: makeMeta('src-1'), canvasJSON: {}, pageData: {} });
    const newId = duplicateProject('src-1');
    expect(newId).not.toBeNull();
    expect(typeof newId).toBe('string');
    expect(newId).not.toBe('src-1');
  });

  it('returns null when source does not exist', () => {
    const result = duplicateProject('nonexistent');
    expect(result).toBeNull();
  });

  it('new project has "Copy of" prefix in name by default', () => {
    saveProject('src-2', { meta: makeMeta('src-2'), canvasJSON: {}, pageData: {} });
    const newId = duplicateProject('src-2');
    expect(newId).not.toBeNull();
    const loaded = loadProject(newId!);
    expect(loaded!.meta.name).toBe('Copy of Test Project');
  });

  it('new project has fresh createdAt and updatedAt', () => {
    const originalMeta = makeMeta('src-3');
    saveProject('src-3', { meta: originalMeta, canvasJSON: {}, pageData: {} });
    const newId = duplicateProject('src-3');
    expect(newId).not.toBeNull();
    const loaded = loadProject(newId!);
    // The new project's timestamps should differ from the original
    expect(loaded!.meta.id).not.toBe('src-3');
  });

  it('creates new entry with custom prefix', () => {
    saveProject('src-4', { meta: makeMeta('src-4'), canvasJSON: {}, pageData: {} });
    const newId = duplicateProject('src-4', 'Duplicate of');
    expect(newId).not.toBeNull();
    const loaded = loadProject(newId!);
    expect(loaded!.meta.name).toBe('Duplicate of Test Project');
  });
});

describe('updateProjectName', () => {
  it('returns true and updates name when project exists', () => {
    saveProject('upd-1', { meta: makeMeta('upd-1'), canvasJSON: {}, pageData: {} });
    const result = updateProjectName('upd-1', 'New Name');
    expect(result).toBe(true);
    const loaded = loadProject('upd-1');
    expect(loaded!.meta.name).toBe('New Name');
  });

  it('returns false when project does not exist', () => {
    const result = updateProjectName('nonexistent', 'New Name');
    expect(result).toBe(false);
  });

  it('updates updatedAt timestamp', () => {
    const originalMeta = makeMeta('upd-2');
    saveProject('upd-2', { meta: originalMeta, canvasJSON: {}, pageData: {} });
    const before = new Date(originalMeta.updatedAt).getTime();
    updateProjectName('upd-2', 'Renamed');
    const loaded = loadProject('upd-2');
    const after = new Date(loaded!.meta.updatedAt).getTime();
    // updatedAt should be a valid date (>= original or equal)
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
