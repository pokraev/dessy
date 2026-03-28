import { create } from 'zustand';
import type { Project, ProjectMeta, Page } from '@/types/project';

interface ProjectState {
  currentProject: Project | null;
  projectList: ProjectMeta[];
  lastSaved: string | null;  // ISO timestamp
  isDirty: boolean;
  // Actions
  setCurrentProject: (project: Project) => void;
  setProjectList: (list: ProjectMeta[]) => void;
  setLastSaved: (date: Date) => void;
  markDirty: () => void;
  markClean: () => void;
  updateProjectName: (name: string) => void;
  getCurrentPage: () => Page | null;
  setCurrentPageIndex: (index: number) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  projectList: [],
  lastSaved: null,
  isDirty: false,
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjectList: (list) => set({ projectList: list }),
  setLastSaved: (date) => set({ lastSaved: date.toISOString(), isDirty: false }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  updateProjectName: (name) => set((s) => ({
    currentProject: s.currentProject
      ? { ...s.currentProject, meta: { ...s.currentProject.meta, name, updatedAt: new Date().toISOString() } }
      : null,
  })),
  setCurrentPageIndex: (index) => set((s) => ({
    currentProject: s.currentProject
      ? { ...s.currentProject, currentPageIndex: index }
      : null,
  })),
  getCurrentPage: () => {
    const { currentProject } = get();
    if (!currentProject) return null;
    return currentProject.pages[currentProject.currentPageIndex] ?? null;
  },
}));
