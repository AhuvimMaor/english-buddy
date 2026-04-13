import * as SQLite from 'expo-sqlite';
import type { Word } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('english-buddy.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hebrew TEXT NOT NULL,
        english TEXT NOT NULL,
        transliteration TEXT,
        context_sentence TEXT,
        source TEXT DEFAULT 'auto',
        created_at INTEGER NOT NULL,
        last_practiced_at INTEGER,
        practice_count INTEGER DEFAULT 0,
        mastery_level INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_words_created ON words(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_words_hebrew ON words(hebrew);
    `);
  }
  return db;
}

export async function getAllWords(): Promise<Word[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    hebrew: string;
    english: string;
    transliteration: string | null;
    context_sentence: string | null;
    source: string;
    created_at: number;
    last_practiced_at: number | null;
    practice_count: number;
    mastery_level: number;
  }>('SELECT * FROM words ORDER BY created_at DESC');

  return rows.map(mapRowToWord);
}

export async function insertWord(
  word: Omit<Word, 'id' | 'lastPracticedAt' | 'practiceCount' | 'masteryLevel'>
): Promise<number> {
  const database = await getDatabase();

  // Check for duplicates
  const existing = await database.getFirstAsync<{ id: number; practice_count: number }>(
    'SELECT id, practice_count FROM words WHERE hebrew = ?',
    word.hebrew
  );

  if (existing) {
    // Increment encounter count instead of duplicating
    await database.runAsync(
      'UPDATE words SET practice_count = practice_count + 1 WHERE id = ?',
      existing.id
    );
    return existing.id;
  }

  const result = await database.runAsync(
    'INSERT INTO words (hebrew, english, transliteration, context_sentence, source, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    word.hebrew,
    word.english,
    word.transliteration ?? null,
    word.contextSentence ?? null,
    word.source,
    word.createdAt
  );

  return result.lastInsertRowId;
}

export async function deleteWord(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM words WHERE id = ?', id);
}

export async function updateWordMastery(
  id: number,
  masteryLevel: 0 | 1 | 2
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE words SET mastery_level = ?, last_practiced_at = ? WHERE id = ?',
    masteryLevel,
    Date.now(),
    id
  );
}

export async function searchWords(query: string): Promise<Word[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    hebrew: string;
    english: string;
    transliteration: string | null;
    context_sentence: string | null;
    source: string;
    created_at: number;
    last_practiced_at: number | null;
    practice_count: number;
    mastery_level: number;
  }>(
    'SELECT * FROM words WHERE hebrew LIKE ? OR english LIKE ? ORDER BY created_at DESC',
    `%${query}%`,
    `%${query}%`
  );

  return rows.map(mapRowToWord);
}

function mapRowToWord(row: {
  id: number;
  hebrew: string;
  english: string;
  transliteration: string | null;
  context_sentence: string | null;
  source: string;
  created_at: number;
  last_practiced_at: number | null;
  practice_count: number;
  mastery_level: number;
}): Word {
  return {
    id: row.id,
    hebrew: row.hebrew,
    english: row.english,
    transliteration: row.transliteration ?? undefined,
    contextSentence: row.context_sentence ?? undefined,
    source: row.source as 'auto' | 'manual',
    createdAt: row.created_at,
    lastPracticedAt: row.last_practiced_at ?? undefined,
    practiceCount: row.practice_count,
    masteryLevel: row.mastery_level as 0 | 1 | 2,
  };
}
