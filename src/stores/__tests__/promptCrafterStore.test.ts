/** @jest-environment jsdom */
import { usePromptCrafterStore } from '@/stores/promptCrafterStore';
import type { ImageHistoryEntry } from '@/types/promptCrafter';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

function makeEntry(id: string): ImageHistoryEntry {
  return {
    id,
    imageId: `img-${id}`,
    thumbnailDataUrl: `data:image/jpeg;base64,thumb${id}`,
    prompt: `Prompt for ${id}`,
    generatedAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  usePromptCrafterStore.getState().clearHistory();
});

describe('addToHistory', () => {
  it('adds an entry and history length is 1', () => {
    usePromptCrafterStore.getState().addToHistory(makeEntry('1'));
    expect(usePromptCrafterStore.getState().history).toHaveLength(1);
  });

  it('prepends entries (newest first)', () => {
    usePromptCrafterStore.getState().addToHistory(makeEntry('1'));
    usePromptCrafterStore.getState().addToHistory(makeEntry('2'));
    const history = usePromptCrafterStore.getState().history;
    expect(history[0].id).toBe('2');
    expect(history[1].id).toBe('1');
  });

  it('caps history at 50 entries', () => {
    for (let i = 0; i < 51; i++) {
      usePromptCrafterStore.getState().addToHistory(makeEntry(String(i)));
    }
    expect(usePromptCrafterStore.getState().history).toHaveLength(50);
  });

  it('newest entry is first after 51 adds', () => {
    for (let i = 0; i < 51; i++) {
      usePromptCrafterStore.getState().addToHistory(makeEntry(String(i)));
    }
    const history = usePromptCrafterStore.getState().history;
    expect(history[0].id).toBe('50');
    // The oldest (id '0') should be evicted
    expect(history.find((e) => e.id === '0')).toBeUndefined();
  });
});

describe('clearHistory', () => {
  it('empties history array', () => {
    usePromptCrafterStore.getState().addToHistory(makeEntry('1'));
    usePromptCrafterStore.getState().addToHistory(makeEntry('2'));
    usePromptCrafterStore.getState().clearHistory();
    expect(usePromptCrafterStore.getState().history).toHaveLength(0);
  });
});
