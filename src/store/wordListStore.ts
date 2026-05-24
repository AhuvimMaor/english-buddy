import { create } from 'zustand';
import type { Word, SortOption } from '../types';
import * as db from '../services/database';

interface WordListState {
  words: Word[];
  isLoaded: boolean;
  searchQuery: string;
  sortBy: SortOption;

  loadWords: () => Promise<void>;
  addWord: (word: Omit<Word, 'id' | 'lastPracticedAt' | 'practiceCount' | 'masteryLevel'>) => Promise<void>;
  removeWord: (id: number) => Promise<void>;
  updateMastery: (id: number, level: 0 | 1 | 2) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortOption) => void;
  getFilteredWords: () => Word[];
}

export const useWordListStore = create<WordListState>((set, get) => ({
  words: [],
  isLoaded: false,
  searchQuery: '',
  sortBy: 'date',

  loadWords: async () => {
    const words = await db.getAllWords();
    set({ words, isLoaded: true });
  },

  addWord: async (word) => {
    const id = await db.insertWord(word);
    // Reload from DB to get accurate state (handles dedup)
    const words = await db.getAllWords();
    set({ words });
  },

  removeWord: async (id) => {
    await db.deleteWord(id);
    set((state) => ({
      words: state.words.filter((w) => w.id !== id),
    }));
  },

  updateMastery: async (id, level) => {
    await db.updateWordMastery(id, level);
    set((state) => ({
      words: state.words.map((w) =>
        w.id === id
          ? { ...w, masteryLevel: level, lastPracticedAt: Date.now() }
          : w
      ),
    }));
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),

  getFilteredWords: () => {
    const { words, searchQuery, sortBy } = get();

    let filtered = words;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = words.filter(
        (w) =>
          w.hebrew.toLowerCase().includes(q) ||
          w.english.toLowerCase().includes(q) ||
          (w.transliteration?.toLowerCase().includes(q) ?? false)
      );
    }

    switch (sortBy) {
      case 'alphabetical':
        return [...filtered].sort((a, b) => a.english.localeCompare(b.english));
      case 'mastery':
        return [...filtered].sort((a, b) => a.masteryLevel - b.masteryLevel);
      case 'date':
      default:
        return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    }
  },
}));
