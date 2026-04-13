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

// Confidence below this threshold triggers Hebrew re-listen
const LOW_CONFIDENCE_THRESHOLD = 0.55;
// Number of consecutive low-confidence results before switching
const LOW_CONFIDENCE_STREAK_TRIGGER = 2;

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
  const lowConfidenceStreakRef = useRef(0);
  const lastLowConfidenceTextRef = useRef('');
  const switchingRef = useRef(false);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    const confidence = event.results[0]?.confidence ?? 1;
    const isHebrewMode = useTranscriptionStore.getState().hebrewMode;

    if (switchingRef.current) return;

    if (event.isFinal) {
      if (isHebrewMode) {
        // Hebrew mode: the recognizer was set to he-IL, so this IS Hebrew
        addSegment({
          text: transcript,
          language: 'he',
          isFinal: true,
          timestamp: Date.now(),
        });

        const words = transcript.trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
          processHebrewWords(words, fullTranscriptRef.current);
        }

        // Auto-switch back to English
        switchingRef.current = true;
        stopListening();
        setHebrewMode(false);
        setTimeout(() => {
          switchingRef.current = false;
          if (useTranscriptionStore.getState().recordingState === 'recording') {
            startListening('en-US');
          }
        }, 300);
      } else {
        // English mode
        // Check if this contains Hebrew characters (Android native detection)
        if (containsHebrew(transcript)) {
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
        } else if (confidence < LOW_CONFIDENCE_THRESHOLD) {
          // Low confidence final result = likely Hebrew that got garbled
          // Don't add the garbled text — switch to Hebrew to re-capture
          lowConfidenceStreakRef.current++;
          lastLowConfidenceTextRef.current = transcript;

          if (lowConfidenceStreakRef.current >= LOW_CONFIDENCE_STREAK_TRIGGER) {
            triggerHebrewSwitch();
          }
        } else {
          // Normal high-confidence English
          lowConfidenceStreakRef.current = 0;
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
      } else if (confidence > 0 && confidence < LOW_CONFIDENCE_THRESHOLD) {
        // Show interim text but mark it as uncertain
        setInterimText(transcript);
        setDetectedLanguage('he'); // Signal that we're detecting something off
      } else {
        setInterimText(transcript);
        setDetectedLanguage('en');
      }
    }
  });

  // Handle language detection events (Android 14+)
  useSpeechRecognitionEvent('languagedetection' as any, (event: any) => {
    if (event.detectedLanguage === 'he' || event.detectedLanguage === 'iw') {
      setDetectedLanguage('he');
      // On Android, auto-switch to Hebrew if not already
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
      // Error in Hebrew mode — switch back to English
      switchingRef.current = true;
      setHebrewMode(false);
      setTimeout(() => {
        switchingRef.current = false;
        if (useTranscriptionStore.getState().recordingState === 'recording') {
          startListening('en-US');
        }
      }, 300);
    } else if (event.error === 'no-speech') {
      // No speech detected — could be a pause, just restart
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
    lowConfidenceStreakRef.current = 0;

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
      lowConfidenceStreakRef.current = 0;
      switchingRef.current = false;
    } else {
      const granted = await requestPermissions();
      if (!granted) {
        console.error('Speech recognition permission denied');
        return;
      }
      setRecordingState('recording');
      fullTranscriptRef.current = '';
      lowConfidenceStreakRef.current = 0;
      startListening('en-US');
    }
  }, [recordingState, setRecordingState, setHebrewMode]);

  return { toggleRecording, recordingState, hebrewMode };
}
