import { useCallback, useRef } from 'react';
import {
  startListening,
  stopListening,
  requestPermissions,
  useSpeechRecognitionEvent,
} from '../services/speechService';
import { useTranscriptionStore } from '../store/transcriptionStore';
import { containsHebrew, extractHebrewWords } from '../utils/hebrewDetector';
import { translateHebrewToEnglish } from '../services/translationService';
import { useWordListStore } from '../store/wordListStore';

export function useSpeechRecognition() {
  const {
    recordingState,
    hebrewMode,
    setRecordingState,
    addSegment,
    setInterimText,
    setDetectedLanguage,
    setHebrewMode,
    addDetectedHebrewWord,
  } = useTranscriptionStore();

  const addWord = useWordListStore((s) => s.addWord);
  const fullTranscriptRef = useRef('');

  // Handle speech recognition results
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    const isHebrewMode = useTranscriptionStore.getState().hebrewMode;

    if (event.isFinal) {
      if (isHebrewMode) {
        // In Hebrew mode: entire transcript is Hebrew
        addSegment({
          text: transcript,
          language: 'he',
          isFinal: true,
          timestamp: Date.now(),
        });

        // Process all words as Hebrew
        const words = transcript.trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
          processHebrewWords(words, fullTranscriptRef.current);
        }

        // Auto-switch back to English
        stopListening();
        setHebrewMode(false);
        // Restart in English after a brief delay
        setTimeout(() => {
          if (useTranscriptionStore.getState().recordingState === 'recording') {
            startListening('en-US');
          }
        }, 300);
      } else {
        // Normal English mode
        addSegment({
          text: transcript,
          language: containsHebrew(transcript) ? 'he' : 'en',
          isFinal: true,
          timestamp: Date.now(),
        });
        fullTranscriptRef.current += ' ' + transcript;

        // Check for Hebrew words in final result (for Android native detection)
        const hebrewWords = extractHebrewWords(transcript);
        if (hebrewWords.length > 0) {
          processHebrewWords(hebrewWords, transcript);
        }
      }
    } else {
      setInterimText(transcript);

      if (isHebrewMode) {
        setDetectedLanguage('he');
      } else if (containsHebrew(transcript)) {
        setDetectedLanguage('he');
      } else {
        setDetectedLanguage('en');
      }
    }
  });

  // Handle language detection events (Android 14+)
  useSpeechRecognitionEvent('languagedetection' as any, (event: any) => {
    if (event.detectedLanguage === 'he' || event.detectedLanguage === 'iw') {
      setDetectedLanguage('he');
    } else {
      setDetectedLanguage('en');
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    // If in Hebrew mode and error occurs, switch back to English
    if (useTranscriptionStore.getState().hebrewMode) {
      setHebrewMode(false);
      if (useTranscriptionStore.getState().recordingState === 'recording') {
        setTimeout(() => startListening('en-US'), 300);
      }
    } else {
      setRecordingState('idle');
    }
  });

  useSpeechRecognitionEvent('end', () => {
    const state = useTranscriptionStore.getState();
    // If we're still recording and not in Hebrew mode (Hebrew mode handles its own restart)
    if (state.recordingState === 'recording' && !state.hebrewMode) {
      startListening('en-US');
    }
  });

  const processHebrewWords = useCallback(
    async (hebrewWords: string[], context: string) => {
      for (const word of hebrewWords) {
        addDetectedHebrewWord({
          word,
          contextSentence: context,
          timestamp: Date.now(),
        });

        try {
          const translation = await translateHebrewToEnglish(word, context);
          await addWord({
            hebrew: word,
            english: translation.english,
            transliteration: translation.transliteration,
            contextSentence: context,
            source: 'auto',
            createdAt: Date.now(),
          });
        } catch (error) {
          console.error('Translation error:', error);
          await addWord({
            hebrew: word,
            english: `[${word}]`,
            source: 'auto',
            createdAt: Date.now(),
            contextSentence: context,
          });
        }
      }
    },
    [addDetectedHebrewWord, addWord]
  );

  const toggleRecording = useCallback(async () => {
    if (recordingState === 'recording') {
      stopListening();
      setRecordingState('idle');
      setHebrewMode(false);
    } else {
      const granted = await requestPermissions();
      if (!granted) {
        console.error('Speech recognition permission denied');
        return;
      }
      setRecordingState('recording');
      fullTranscriptRef.current = '';
      startListening('en-US');
    }
  }, [recordingState, setRecordingState, setHebrewMode]);

  const switchToHebrew = useCallback(() => {
    if (recordingState !== 'recording') return;
    stopListening();
    setHebrewMode(true);
    setTimeout(() => {
      startListening('he-IL');
    }, 300);
  }, [recordingState, setHebrewMode]);

  return { toggleRecording, switchToHebrew, recordingState, hebrewMode };
}
