import { create } from 'zustand';
import type { Project, ProjectMeta, Page } from '@/types/project';
import {
  addPage as addPageFn,
  duplicatePage as duplicatePageFn,
  deletePage as deletePageFn,
  reorderPages as reorderPagesFn,
  ensureFormatPageCount as ensureFormatPageCountFn,
} from '@/lib/pages/page-crud';

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
  // Page CRUD actions
  addPage: () => { newPageIndex: number } | null;
  duplicatePage: (sourceIndex: number) => { newPageIndex: number } | null;
  deletePage: (pageIndex: number) => { newCurrentIndex: number } | null;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  ensureFormatPageCount: () => void;
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
  addPage: () => {
    const { currentProject } = get();
    if (!currentProject) return null;
    const { updatedProject, newPageIndex } = addPageFn(currentProject);
    set({ currentProject: updatedProject });
    return { newPageIndex };
  },
  duplicatePage: (sourceIndex) => {
    const { currentProject } = get();
    if (!currentProject) return null;
    const { updatedProject, newPageIndex } = duplicatePageFn(
      currentProject,
      sourceIndex,
      currentProject.meta.id
    );
    set({ currentProject: updatedProject });
    return { newPageIndex };
  },
  deletePage: (pageIndex) => {
    const { currentProject } = get();
    if (!currentProject) return null;
    const { updatedProject, newCurrentIndex } = deletePageFn(
      currentProject,
      pageIndex,
      currentProject.meta.id
    );
    set({ currentProject: updatedProject });
    return { newCurrentIndex };
  },
  reorderPages: (fromIndex, toIndex) => {
    const { currentProject } = get();
    if (!currentProject) return;
    const updatedProject = reorderPagesFn(
      currentProject,
      fromIndex,
      toIndex,
      currentProject.meta.id
    );
    set({ currentProject: updatedProject });
  },
  ensureFormatPageCount: () => {
    const { currentProject } = get();
    if (!currentProject) return;
    const updatedProject = ensureFormatPageCountFn(currentProject);
    set({ currentProject: updatedProject });
  },
}));
