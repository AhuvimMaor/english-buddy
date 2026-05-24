import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import type { Word } from '../types';

interface WordCardProps {
  word: Word;
  onDelete?: (id: number) => void;
}

const MASTERY_LABELS = ['New', 'Learning', 'Known'] as const;
const MASTERY_COLORS = ['#e74c3c', '#f39c12', '#2ecc71'] as const;

export function WordCard({ word, onDelete }: WordCardProps) {
  const dateStr = new Date(word.createdAt).toLocaleDateString();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.wordPair}>
          <Text style={styles.hebrew}>{word.hebrew}</Text>
          <FontAwesome name="arrow-right" size={12} color="#95a5a6" />
          <Text style={styles.english}>{word.english}</Text>
        </View>
        {onDelete && (
          <Pressable
            onPress={() => onDelete(word.id)}
            hitSlop={8}
            style={styles.deleteBtn}
          >
            <FontAwesome name="trash-o" size={16} color="#e74c3c" />
          </Pressable>
        )}
      </View>

      {word.transliteration && (
        <Text style={styles.transliteration}>/{word.transliteration}/</Text>
      )}

      {word.contextSentence && (
        <Text style={styles.context} numberOfLines={2}>
          "{word.contextSentence}"
        </Text>
      )}

      <View style={styles.footer}>
        <View
          style={[
            styles.masteryBadge,
            { backgroundColor: MASTERY_COLORS[word.masteryLevel] },
          ]}
        >
          <Text style={styles.masteryText}>
            {MASTERY_LABELS[word.masteryLevel]}
          </Text>
        </View>
        <Text style={styles.date}>{dateStr}</Text>
        {word.practiceCount > 0 && (
          <Text style={styles.encounters}>
            Seen {word.practiceCount}x
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hebrew: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  english: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3498db',
  },
  deleteBtn: {
    padding: 4,
  },
  transliteration: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  context: {
    fontSize: 13,
    color: '#95a5a6',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  masteryBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  masteryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  encounters: {
    fontSize: 12,
    color: '#bdc3c7',
  },
});
