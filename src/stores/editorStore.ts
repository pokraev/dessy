import { create } from 'zustand';

interface EditorState {
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  shortcutsModalOpen: boolean;
  generateModalOpen: boolean;
  exportModalOpen: boolean;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setGenerateModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  showGrid: false,
  showRulers: true,
  showGuides: true,
  leftPanelOpen: true,
  rightPanelOpen: true,
  shortcutsModalOpen: false,
  generateModalOpen: false,
  exportModalOpen: false,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  setGenerateModalOpen: (open) => set({ generateModalOpen: open }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
}));
