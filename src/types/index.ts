export interface Word {
  id: number;
  hebrew: string;
  english: string;
  transliteration?: string;
  contextSentence?: string;
  source: 'auto' | 'manual';
  createdAt: number;
  lastPracticedAt?: number;
  practiceCount: number;
  masteryLevel: 0 | 1 | 2; // 0=new, 1=learning, 2=known
}

export interface TranscriptSegment {
  text: string;
  language: 'en' | 'he';
  isFinal: boolean;
  timestamp: number;
}

export interface DetectedHebrewWord {
  word: string;
  contextSentence: string;
  timestamp: number;
}

export type RecordingState = 'idle' | 'recording' | 'paused';

export type SortOption = 'date' | 'alphabetical' | 'mastery';
