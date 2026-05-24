import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTranscriptionStore } from '../store/transcriptionStore';
import { useWordListStore } from '../store/wordListStore';

export function DetectedWordsStrip() {
  const detectedWords = useTranscriptionStore((s) => s.detectedHebrewWords);
  const savedWords = useWordListStore((s) => s.words);

  if (detectedWords.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Detected Hebrew words ({detectedWords.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {detectedWords.map((detected, index) => {
          const saved = savedWords.find((w) => w.hebrew === detected.word);
          return (
            <View key={index} style={styles.chip}>
              <Text style={styles.chipHebrew}>{detected.word}</Text>
              {saved && (
                <Text style={styles.chipEnglish}>{saved.english}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef9e7',
    borderTopWidth: 1,
    borderTopColor: '#f9e79f',
    paddingVertical: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7d6608',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#f39c12',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  chipHebrew: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  chipEnglish: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
});
