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
  goToDashboard: () => set((state) => {
    // Clean up page data for the project being closed
    if (state.activeProjectId) {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(`dessy-generated-page-${state.activeProjectId}`)) {
          sessionStorage.removeItem(key);
        }
      }
      sessionStorage.removeItem(`dessy-canvas-restore-${state.activeProjectId}`);
    }
    return { currentView: 'dashboard', activeProjectId: null };
  }),
  createNewProject: (projectId) => set({ currentView: 'editor', activeProjectId: projectId }),
}));
