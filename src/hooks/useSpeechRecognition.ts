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

// Chrome gives ~0.85+ confidence for real English speech.
// Hebrew transliterated as English typically gets 0.0-0.8 depending on the word.
// We use a low threshold to catch obvious gibberish, but the main detection
// mechanism is tracking "nonsense segments" that get replaced when Hebrew captures.
const LOW_CONFIDENCE_THRESHOLD = 0.75;

export function useSpeechRecognition() {
  const {
    recordingState,
    hebrewMode,
    setRecordingState,
    addSegment,
    removeLastSegments,
    setInterimText,
    setDetectedLanguage,
    setHebrewMode,
    addDetectedHebrewWord,
  } = useTranscriptionStore();

  const addWord = useWordListStore((s) => s.addWord);
  const fullTranscriptRef = useRef('');
  const switchingRef = useRef(false);
  // Track how many segments were added since we suspected Hebrew
  const suspectedGarbledCountRef = useRef(0);
  // Track consecutive low-confidence results
  const lowConfStreakRef = useRef(0);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    const confidence = event.results[0]?.confidence ?? 1;
    const isHebrewMode = useTranscriptionStore.getState().hebrewMode;

    if (switchingRef.current) return;

    if (event.isFinal) {
      if (isHebrewMode) {
        // Hebrew mode: recognizer is set to he-IL, this IS Hebrew text.
        // Remove the garbled English segments that were added before we switched.
        if (suspectedGarbledCountRef.current > 0) {
          removeLastSegments(suspectedGarbledCountRef.current);
          suspectedGarbledCountRef.current = 0;
        }

        // Add the Hebrew segment
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
        switchingRef.current = true;
        stopListening();
        setHebrewMode(false);
        lowConfStreakRef.current = 0;
        setTimeout(() => {
          switchingRef.current = false;
          if (useTranscriptionStore.getState().recordingState === 'recording') {
            startListening('en-US');
          }
        }, 300);
      } else {
        // English mode
        if (containsHebrew(transcript)) {
          // Android native detection produced Hebrew characters
          addSegment({
            text: transcript,
            language: 'he',
            isFinal: true,
            timestamp: Date.now(),
          });
          const hebrewWords = extractHebrewWords(transcript);
          if (hebrewWords.length > 0) {
            processHebrewWords(hebrewWords, transcript);
          }
          lowConfStreakRef.current = 0;
        } else if (confidence < LOW_CONFIDENCE_THRESHOLD) {
          // Low confidence = likely Hebrew garbled as English
          lowConfStreakRef.current++;

          // Add the segment but mark it as suspected garbled — we'll remove it
          // if Hebrew mode confirms it was actually Hebrew
          addSegment({
            text: transcript,
            language: 'en',
            isFinal: true,
            timestamp: Date.now(),
          });
          suspectedGarbledCountRef.current++;

          // After 1 low-confidence result, immediately switch to Hebrew
          // to try to capture what the user is actually saying
          triggerHebrewSwitch();
        } else {
          // Normal high-confidence English
          lowConfStreakRef.current = 0;
          suspectedGarbledCountRef.current = 0;
          addSegment({
            text: transcript,
            language: 'en',
            isFinal: true,
            timestamp: Date.now(),
          });
          fullTranscriptRef.current += ' ' + transcript;
        }
      }
    } else {
      // Interim results
      if (isHebrewMode) {
        setInterimText(transcript);
        setDetectedLanguage('he');
      } else if (containsHebrew(transcript)) {
        setInterimText(transcript);
        setDetectedLanguage('he');
      } else {
        setInterimText(transcript);
        setDetectedLanguage(
          confidence > 0 && confidence < LOW_CONFIDENCE_THRESHOLD ? 'he' : 'en'
        );
      }
    }
  });

  // Handle language detection events (Android 14+)
  useSpeechRecognitionEvent('languagedetection' as any, (event: any) => {
    if (event.detectedLanguage === 'he' || event.detectedLanguage === 'iw') {
      setDetectedLanguage('he');
      if (!useTranscriptionStore.getState().hebrewMode) {
        triggerHebrewSwitch();
      }
    } else {
      setDetectedLanguage('en');
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    const state = useTranscriptionStore.getState();

    if (state.hebrewMode) {
      switchingRef.current = true;
      setHebrewMode(false);
      suspectedGarbledCountRef.current = 0;
      setTimeout(() => {
        switchingRef.current = false;
        if (useTranscriptionStore.getState().recordingState === 'recording') {
          startListening('en-US');
        }
      }, 300);
    } else if (event.error === 'no-speech') {
      if (state.recordingState === 'recording') {
        startListening('en-US');
      }
    } else {
      setRecordingState('idle');
    }
  });

  useSpeechRecognitionEvent('end', () => {
    const state = useTranscriptionStore.getState();
    if (
      state.recordingState === 'recording' &&
      !state.hebrewMode &&
      !switchingRef.current
    ) {
      startListening('en-US');
    }
  });

  const triggerHebrewSwitch = useCallback(() => {
    if (switchingRef.current) return;
    switchingRef.current = true;
    lowConfStreakRef.current = 0;

    stopListening();
    setHebrewMode(true);
    setDetectedLanguage('he');

    setTimeout(() => {
      switchingRef.current = false;
      if (useTranscriptionStore.getState().recordingState === 'recording') {
        startListening('he-IL');
      }
    }, 300);
  }, [setHebrewMode, setDetectedLanguage]);

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
      lowConfStreakRef.current = 0;
      suspectedGarbledCountRef.current = 0;
      switchingRef.current = false;
    } else {
      const granted = await requestPermissions();
      if (!granted) {
        console.error('Speech recognition permission denied');
        return;
      }
      setRecordingState('recording');
      fullTranscriptRef.current = '';
      lowConfStreakRef.current = 0;
      suspectedGarbledCountRef.current = 0;
      startListening('en-US');
    }
  }, [recordingState, setRecordingState, setHebrewMode]);

  return { toggleRecording, recordingState, hebrewMode };
}
