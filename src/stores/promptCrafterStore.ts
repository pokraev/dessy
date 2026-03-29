import { create } from 'zustand';
import type { ImageHistoryEntry } from '@/types/promptCrafter';

const STORAGE_KEY = 'dessy-image-history';
const MAX_HISTORY = 50;

interface PromptCrafterState {
  history: ImageHistoryEntry[];
  addToHistory: (entry: ImageHistoryEntry) => void;
  clearHistory: () => void;
}

function loadFromStorage(): ImageHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ImageHistoryEntry[];
  } catch {
    return [];
  }
}

function saveToStorage(history: ImageHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage quota errors
  }
}

export const usePromptCrafterStore = create<PromptCrafterState>((set) => ({
  history: loadFromStorage(),

  addToHistory: (entry: ImageHistoryEntry) => {
    set((state) => {
      const newHistory = [entry, ...state.history].slice(0, MAX_HISTORY);
      saveToStorage(newHistory);
      return { history: newHistory };
    });
  },

  clearHistory: () => {
    set(() => {
      saveToStorage([]);
      return { history: [] };
    });
  },
}));
