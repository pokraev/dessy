import { create } from 'zustand';

interface AppState {
  currentView: 'dashboard' | 'editor';
  activeProjectId: string | null;
  openProject: (projectId: string) => void;
  goToDashboard: () => void;
  createNewProject: (projectId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  activeProjectId: null,
  openProject: (projectId) => set({ currentView: 'editor', activeProjectId: projectId }),
  goToDashboard: () => set({ currentView: 'dashboard', activeProjectId: null }),
  createNewProject: (projectId) => set({ currentView: 'editor', activeProjectId: projectId }),
}));
