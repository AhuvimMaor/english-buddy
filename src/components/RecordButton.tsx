import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import type { RecordingState } from '../types';

interface RecordButtonProps {
  recordingState: RecordingState;
  onPress: () => void;
}

export function RecordButton({ recordingState, onPress }: RecordButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const isRecording = recordingState === 'recording';

  useEffect(() => {
    if (isRecording) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(0, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isRecording, scale, opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Animated.View style={[styles.pulse, pulseStyle]} />
      <Animated.View
        style={[styles.button, isRecording && styles.buttonRecording]}
      >
        <FontAwesome
          name={isRecording ? 'stop' : 'microphone'}
          size={32}
          color="#fff"
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
  },
  pulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e74c3c',
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonRecording: {
    backgroundColor: '#e74c3c',
  },
});
