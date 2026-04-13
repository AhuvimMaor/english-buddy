import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSpeechRecognition } from '@/src/hooks/useSpeechRecognition';
import { useTranscriptionStore } from '@/src/store/transcriptionStore';
import { TranscriptionDisplay } from '@/src/components/TranscriptionDisplay';
import { RecordButton } from '@/src/components/RecordButton';
import { LanguageIndicator } from '@/src/components/LanguageIndicator';
import { DetectedWordsStrip } from '@/src/components/DetectedWordsStrip';
import { HebrewToggle } from '@/src/components/HebrewToggle';

export default function SpeakScreen() {
  const { toggleRecording, switchToHebrew, recordingState, hebrewMode } =
    useSpeechRecognition();
  const detectedLanguage = useTranscriptionStore((s) => s.detectedLanguage);

  return (
    <View style={styles.container}>
      <View style={styles.indicatorRow}>
        <LanguageIndicator
          language={detectedLanguage}
          isRecording={recordingState === 'recording'}
        />
      </View>

      <TranscriptionDisplay />

      <DetectedWordsStrip />

      <View style={styles.controls}>
        <HebrewToggle
          isHebrewMode={hebrewMode}
          isRecording={recordingState === 'recording'}
          onPress={switchToHebrew}
        />
        <RecordButton
          recordingState={recordingState}
          onPress={toggleRecording}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  indicatorRow: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    gap: 12,
  },
});
