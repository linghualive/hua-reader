import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { BUILT_IN_TOPICS, type BuiltInFeed } from '@/services/built-in-topics';

interface SearchableFeed extends BuiltInFeed {
  topicName: string;
  topicIcon: string;
}

const ALL_FEEDS: SearchableFeed[] = BUILT_IN_TOPICS.flatMap((topic) =>
  topic.feeds.map((feed) => ({
    ...feed,
    topicName: topic.name,
    topicIcon: topic.icon,
  }))
);

// Deduplicate by route
const UNIQUE_FEEDS = ALL_FEEDS.filter(
  (feed, index, self) => self.findIndex((f) => f.route === feed.route) === index
);

interface Props {
  subscribedRoutes: Set<string>;
  onAddFeed: (feed: SearchableFeed) => void;
}

export function SearchFeeds({ subscribedRoutes, onAddFeed }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return UNIQUE_FEEDS;
    const q = query.trim().toLowerCase();
    return UNIQUE_FEEDS.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.topicName.toLowerCase().includes(q) ||
        f.route.toLowerCase().includes(q)
    );
  }, [query]);

  const renderItem = useCallback(
    ({ item }: { item: SearchableFeed }) => {
      const isSubscribed = subscribedRoutes.has(item.route);
      return (
        <View style={[styles.feedRow, { borderBottomColor: colors.outline + '20' }]}>
          <View style={[styles.feedIcon, { backgroundColor: colors.surfaceVariant }]}>
            <MaterialCommunityIcons name={item.topicIcon as any} size={18} color={colors.onSurfaceVariant} />
          </View>
          <View style={styles.feedInfo}>
            <Text style={[styles.feedTitle, { color: colors.onSurface }]}>{item.title}</Text>
            <Text style={[styles.feedTopic, { color: colors.onSurfaceVariant }]}>{item.topicName}</Text>
          </View>
          {isSubscribed ? (
            <View style={[styles.subscribedBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.subscribedText, { color: colors.primary }]}>已添加</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => onAddFeed(item)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.onPrimary} />
            </Pressable>
          )}
        </View>
      );
    },
    [subscribedRoutes, colors, onAddFeed]
  );

  return (
    <View>
      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.outline + '30' }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="搜索源名称、话题、路由..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>
      <Text style={[styles.resultCount, { color: colors.onSurfaceVariant }]}>
        {query ? `找到 ${results.length} 个源` : `共 ${results.length} 个内置源`}
      </Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.route}
        renderItem={renderItem}
        style={styles.list}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  resultCount: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  list: {
    paddingHorizontal: 16,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  feedIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedInfo: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedTopic: {
    fontSize: 11,
    marginTop: 2,
  },
  subscribedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  subscribedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
