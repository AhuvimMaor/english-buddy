import { create } from 'zustand';
import type { TranscriptSegment, DetectedHebrewWord, RecordingState } from '../types';

interface TranscriptionState {
  recordingState: RecordingState;
  segments: TranscriptSegment[];
  interimText: string;
  detectedLanguage: 'en' | 'he';
  detectedHebrewWords: DetectedHebrewWord[];

  setRecordingState: (state: RecordingState) => void;
  addSegment: (segment: TranscriptSegment) => void;
  setInterimText: (text: string) => void;
  setDetectedLanguage: (lang: 'en' | 'he') => void;
  addDetectedHebrewWord: (word: DetectedHebrewWord) => void;
  clearSession: () => void;
}

export const useTranscriptionStore = create<TranscriptionState>((set) => ({
  recordingState: 'idle',
  segments: [],
  interimText: '',
  detectedLanguage: 'en',
  detectedHebrewWords: [],

  setRecordingState: (recordingState) => set({ recordingState }),

  addSegment: (segment) =>
    set((state) => ({
      segments: [...state.segments, segment],
      interimText: '',
    })),

  setInterimText: (interimText) => set({ interimText }),

  setDetectedLanguage: (detectedLanguage) => set({ detectedLanguage }),

  addDetectedHebrewWord: (word) =>
    set((state) => {
      // Avoid duplicates in the same session
      const exists = state.detectedHebrewWords.some(
        (w) => w.word === word.word
      );
      if (exists) return state;
      return {
        detectedHebrewWords: [...state.detectedHebrewWords, word],
      };
    }),

  clearSession: () =>
    set({
      segments: [],
      interimText: '',
      detectedLanguage: 'en',
      detectedHebrewWords: [],
    }),
}));
