import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface WordBadgeProps {
  hebrew: string;
  english?: string;
  onPress?: () => void;
}

export function WordBadge({ hebrew, english, onPress }: WordBadgeProps) {
  return (
    <Pressable onPress={onPress}>
      <View style={styles.container}>
        <Text style={styles.hebrew}>{hebrew}</Text>
        {english && <Text style={styles.english}>{english}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f39c12',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  hebrew: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  english: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.9,
  },
});
