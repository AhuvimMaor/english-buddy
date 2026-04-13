import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTranscriptionStore } from '../store/transcriptionStore';
import { useWordListStore } from '../store/wordListStore';
import { splitByLanguage } from '../utils/hebrewDetector';
import { WordBadge } from './WordBadge';
import type { TranscriptSegment } from '../types';

export function TranscriptionDisplay() {
  const scrollRef = useRef<ScrollView>(null);
  const segments = useTranscriptionStore((s) => s.segments);
  const interimText = useTranscriptionStore((s) => s.interimText);
  const hebrewMode = useTranscriptionStore((s) => s.hebrewMode);
  const savedWords = useWordListStore((s) => s.words);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [segments, interimText]);

  const renderSegment = (segment: TranscriptSegment, index: number) => {
    // If segment is marked as Hebrew, render entire segment as badges
    if (segment.language === 'he') {
      const words = segment.text.trim().split(/\s+/);
      return (
        <React.Fragment key={index}>
          {words.map((word, i) => {
            const saved = savedWords.find((w) => w.hebrew === word);
            return (
              <WordBadge
                key={`${index}-${i}`}
                hebrew={word}
                english={saved?.english}
              />
            );
          })}
        </React.Fragment>
      );
    }

    // English segment — still check for inline Hebrew characters (Android)
    const parts = splitByLanguage(segment.text);
    return (
      <React.Fragment key={index}>
        {parts.map((part, i) => {
          if (part.isHebrew) {
            const saved = savedWords.find((w) => w.hebrew === part.text);
            return (
              <WordBadge
                key={`${index}-${i}`}
                hebrew={part.text}
                english={saved?.english}
              />
            );
          }
          return (
            <Text key={`${index}-${i}`} style={styles.word}>
              {part.text}{' '}
            </Text>
          );
        })}
      </React.Fragment>
    );
  };

  const renderInterim = () => {
    if (!interimText) return null;
    return (
      <Text style={[styles.word, styles.interim, hebrewMode && styles.hebrewInterim]}>
        {interimText}
      </Text>
    );
  };

  const hasContent = segments.length > 0 || interimText;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {!hasContent && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🎤</Text>
          <Text style={styles.placeholderText}>
            Tap the microphone and start speaking in English
          </Text>
          <Text style={styles.placeholderSubtext}>
            When you get stuck, switch to Hebrew — the app will catch it!
          </Text>
        </View>
      )}

      <View style={styles.textContainer}>
        {segments.map(renderSegment)}
        {renderInterim()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  word: {
    fontSize: 20,
    lineHeight: 32,
    color: '#2c3e50',
  },
  interim: {
    color: '#95a5a6',
  },
  hebrewInterim: {
    color: '#e67e22',
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderIcon: {
    fontSize: 48,
  },
  placeholderText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
