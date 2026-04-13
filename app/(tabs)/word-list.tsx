import React from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useWordList } from '@/src/hooks/useWordList';
import { WordCard } from '@/src/components/WordCard';
import type { SortOption, Word } from '@/src/types';

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { value: 'date', label: 'Recent', icon: 'clock-o' },
  { value: 'alphabetical', label: 'A-Z', icon: 'sort-alpha-asc' },
  { value: 'mastery', label: 'Mastery', icon: 'graduation-cap' },
];

export default function WordListScreen() {
  const {
    words,
    isLoaded,
    searchQuery,
    sortBy,
    setSearchQuery,
    setSortBy,
    removeWord,
    totalCount,
  } = useWordList();

  const renderItem = ({ item }: { item: Word }) => (
    <WordCard word={item} onDelete={removeWord} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#95a5a6" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search words..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#95a5a6"
        />
      </View>

      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setSortBy(option.value)}
            style={[
              styles.sortButton,
              sortBy === option.value && styles.sortButtonActive,
            ]}
          >
            <FontAwesome
              name={option.icon}
              size={12}
              color={sortBy === option.value ? '#fff' : '#7f8c8d'}
            />
            <Text
              style={[
                styles.sortText,
                sortBy === option.value && styles.sortTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
        <Text style={styles.count}>{totalCount} words</Text>
      </View>

      {!isLoaded ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : words.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matches found' : 'No words yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start speaking and switch to Hebrew when you get stuck. Your words will appear here!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={words}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#2c3e50',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ecf0f1',
  },
  sortButtonActive: {
    backgroundColor: '#3498db',
  },
  sortText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#fff',
  },
  count: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#95a5a6',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 20,
  },
});
