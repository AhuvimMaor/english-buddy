import React, { useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTranscriptionStore } from '../store/transcriptionStore';
import { splitByLanguage } from '../utils/hebrewDetector';
import { WordBadge } from './WordBadge';

export function TranscriptionDisplay() {
  const scrollRef = useRef<ScrollView>(null);
  const segments = useTranscriptionStore((s) => s.segments);
  const interimText = useTranscriptionStore((s) => s.interimText);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [segments, interimText]);

  const renderText = (text: string, isFinal: boolean) => {
    const parts = splitByLanguage(text);
    return parts.map((part, index) => {
      if (part.isHebrew) {
        return <WordBadge key={index} hebrew={part.text} />;
      }
      return (
        <Text
          key={index}
          style={[styles.word, !isFinal && styles.interim]}
        >
          {part.text}{' '}
        </Text>
      );
    });
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
        {segments.map((segment, index) => (
          <React.Fragment key={index}>
            {renderText(segment.text, true)}
          </React.Fragment>
        ))}
        {interimText ? renderText(interimText, false) : null}
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
