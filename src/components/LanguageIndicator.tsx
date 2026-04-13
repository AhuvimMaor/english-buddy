import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface LanguageIndicatorProps {
  language: 'en' | 'he';
  isRecording: boolean;
}

export function LanguageIndicator({
  language,
  isRecording,
}: LanguageIndicatorProps) {
  const isHebrew = language === 'he';

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isHebrew ? '#f39c12' : '#2ecc71', {
      duration: 300,
    }),
  }));

  if (!isRecording) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>
        {isHebrew ? 'Hebrew detected!' : 'Listening in English...'}
      </Text>
      <View style={[styles.dot, isHebrew ? styles.dotHebrew : styles.dotEnglish]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotEnglish: {
    backgroundColor: '#fff',
  },
  dotHebrew: {
    backgroundColor: '#e74c3c',
  },
});
