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
    setRecordingState,
    addSegment,
    setInterimText,
    setDetectedLanguage,
    addDetectedHebrewWord,
  } = useTranscriptionStore();

  const addWord = useWordListStore((s) => s.addWord);
  const fullTranscriptRef = useRef('');

  // Handle speech recognition results
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';

    if (event.isFinal) {
      addSegment({
        text: transcript,
        language: containsHebrew(transcript) ? 'he' : 'en',
        isFinal: true,
        timestamp: Date.now(),
      });
      fullTranscriptRef.current += ' ' + transcript;

      // Check for Hebrew words in final result
      const hebrewWords = extractHebrewWords(transcript);
      if (hebrewWords.length > 0) {
        processHebrewWords(hebrewWords, transcript);
      }
    } else {
      setInterimText(transcript);

      // Check interim results for Hebrew too (for UI highlighting)
      if (containsHebrew(transcript)) {
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
    setRecordingState('idle');
  });

  useSpeechRecognitionEvent('end', () => {
    // If we're still in recording state, restart (continuous mode workaround)
    if (useTranscriptionStore.getState().recordingState === 'recording') {
      startListening();
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
          // Still save the word even without translation
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
    } else {
      const granted = await requestPermissions();
      if (!granted) {
        console.error('Speech recognition permission denied');
        return;
      }
      setRecordingState('recording');
      fullTranscriptRef.current = '';
      startListening();
    }
  }, [recordingState, setRecordingState]);

  return { toggleRecording, recordingState };
}
