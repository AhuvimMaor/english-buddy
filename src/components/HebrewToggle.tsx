import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  cancelAnimation,
} from 'react-native-reanimated';

interface HebrewToggleProps {
  isHebrewMode: boolean;
  isRecording: boolean;
  onPress: () => void;
}

export function HebrewToggle({
  isHebrewMode,
  isRecording,
  onPress,
}: HebrewToggleProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isHebrewMode) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(0.95, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isHebrewMode, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!isRecording) return null;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        style={[styles.button, isHebrewMode && styles.buttonActive]}
      >
        <Text style={styles.flag}>🇮🇱</Text>
        <Text style={[styles.label, isHebrewMode && styles.labelActive]}>
          {isHebrewMode ? 'Listening in Hebrew...' : 'Stuck? Tap for Hebrew'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: '#fef9e7',
    borderColor: '#f39c12',
  },
  flag: {
    fontSize: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  labelActive: {
    color: '#e67e22',
  },
});
