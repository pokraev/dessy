import { saveProject, loadProject, listProjects, deleteProject } from '../projectStorage';
import type { ProjectMeta } from '@/types/project';

const makeMeta = (id: string): ProjectMeta => ({
  id,
  name: 'Test Project',
  format: 'A4',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

beforeEach(() => {
  localStorage.clear();
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
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
      throw err;
    });
    const meta = makeMeta('proj-2');
    const result = saveProject('proj-2', { meta, canvasJSON: {}, pageData: {} });
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
  it.todo('returns new project ID when source exists');
  it.todo('returns null when source does not exist');
  it.todo('new project has "Copy of" prefix in name');
  it.todo('new project has fresh createdAt and updatedAt');
});

describe('updateProjectName', () => {
  it.todo('returns true and updates name when project exists');
  it.todo('returns false when project does not exist');
  it.todo('updates updatedAt timestamp');
});
