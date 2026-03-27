import type { ProjectMeta } from '@/types/project';

const PROJECT_PREFIX = 'dessy-project-';
const PROJECT_LIST_KEY = 'dessy-project-list';

interface SaveResult { success: boolean; error?: 'quota' | 'unknown'; }

export function saveProject(
  projectId: string,
  data: { meta: ProjectMeta; canvasJSON: object; pageData: object }
): SaveResult {
  try {
    localStorage.setItem(
      `${PROJECT_PREFIX}${projectId}`,
      JSON.stringify(data)
    );
    // Update project list
    const list = listProjects();
    const idx = list.findIndex(p => p.id === projectId);
    const meta = { ...data.meta, updatedAt: new Date().toISOString() };
    if (idx >= 0) list[idx] = meta;
    else list.push(meta);
    localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(list));
    return { success: true };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return { success: false, error: 'quota' };
    }
    return { success: false, error: 'unknown' };
  }
}

export function loadProject(projectId: string): {
  meta: ProjectMeta; canvasJSON: object; pageData: object
} | null {
  const raw = localStorage.getItem(`${PROJECT_PREFIX}${projectId}`);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

export function listProjects(): ProjectMeta[] {
  const raw = localStorage.getItem(PROJECT_LIST_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); }
  catch { return []; }
}

export function deleteProject(projectId: string): void {
  localStorage.removeItem(`${PROJECT_PREFIX}${projectId}`);
  const list = listProjects().filter(p => p.id !== projectId);
  localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(list));
}
