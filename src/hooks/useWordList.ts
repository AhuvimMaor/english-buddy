import { useEffect } from 'react';
import { useWordListStore } from '../store/wordListStore';

export function useWordList() {
  const store = useWordListStore();

  useEffect(() => {
    if (!store.isLoaded) {
      store.loadWords();
    }
  }, [store.isLoaded]);

  return {
    words: store.getFilteredWords(),
    isLoaded: store.isLoaded,
    searchQuery: store.searchQuery,
    sortBy: store.sortBy,
    setSearchQuery: store.setSearchQuery,
    setSortBy: store.setSortBy,
    removeWord: store.removeWord,
    updateMastery: store.updateMastery,
    totalCount: store.words.length,
  };
}
