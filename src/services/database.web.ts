import type { Word } from '../types';

const STORAGE_KEY = 'english-buddy-words';
let nextId = 1;

function loadWords(): Word[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const words: Word[] = JSON.parse(data);
    if (words.length > 0) {
      nextId = Math.max(...words.map((w) => w.id)) + 1;
    }
    return words;
  } catch {
    return [];
  }
}

function saveWords(words: Word[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export async function getAllWords(): Promise<Word[]> {
  return loadWords();
}

export async function insertWord(
  word: Omit<Word, 'id' | 'lastPracticedAt' | 'practiceCount' | 'masteryLevel'>
): Promise<number> {
  const words = loadWords();

  const existing = words.find((w) => w.hebrew === word.hebrew);
  if (existing) {
    existing.practiceCount += 1;
    saveWords(words);
    return existing.id;
  }

  const id = nextId++;
  words.unshift({
    ...word,
    id,
    practiceCount: 0,
    masteryLevel: 0,
    lastPracticedAt: undefined,
  });
  saveWords(words);
  return id;
}

export async function deleteWord(id: number): Promise<void> {
  const words = loadWords().filter((w) => w.id !== id);
  saveWords(words);
}

export async function updateWordMastery(
  id: number,
  masteryLevel: 0 | 1 | 2
): Promise<void> {
  const words = loadWords();
  const word = words.find((w) => w.id === id);
  if (word) {
    word.masteryLevel = masteryLevel;
    word.lastPracticedAt = Date.now();
    saveWords(words);
  }
}

export async function searchWords(query: string): Promise<Word[]> {
  const words = loadWords();
  const q = query.toLowerCase();
  return words.filter(
    (w) =>
      w.hebrew.toLowerCase().includes(q) ||
      w.english.toLowerCase().includes(q)
  );
}
