import React, { useMemo, useCallback } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { BUILT_IN_TOPICS } from '@/services/built-in-topics';

interface SearchableFeed {
  title: string;
  route: string;
  topicName: string;
  topicIcon: string;
}

const ALL_FEEDS: SearchableFeed[] = BUILT_IN_TOPICS.flatMap((topic) =>
  topic.feeds.map((feed) => ({ ...feed, topicName: topic.name, topicIcon: topic.icon }))
);
const UNIQUE_FEEDS = ALL_FEEDS.filter(
  (feed, i, self) => self.findIndex((f) => f.route === feed.route) === i
);

interface Props {
  query: string;
  subscribedRoutes: Set<string>;
  onAddFeed: (feed: SearchableFeed) => void;
}

export function SearchFeeds({ query, subscribedRoutes, onAddFeed }: Props) {
  const { colors } = useTheme();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return UNIQUE_FEEDS.filter(
      (f) => f.title.toLowerCase().includes(q) || f.topicName.toLowerCase().includes(q) || f.route.toLowerCase().includes(q)
    );
  }, [query]);

  const renderItem = useCallback(
    ({ item }: { item: SearchableFeed }) => {
      const isSubscribed = subscribedRoutes.has(item.route);
      return (
        <View style={[styles.row, { borderBottomColor: colors.outline + '18' }]}>
          <View style={[styles.icon, { backgroundColor: colors.surfaceVariant }]}>
            <MaterialCommunityIcons name={item.topicIcon as any} size={16} color={colors.onSurfaceVariant} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.onSurface }]}>{item.title}</Text>
            <Text style={[styles.topic, { color: colors.onSurfaceVariant }]}>{item.topicName}</Text>
          </View>
          {isSubscribed ? (
            <Text style={[styles.added, { color: colors.primary }]}>已添加</Text>
          ) : (
            <Pressable onPress={() => onAddFeed(item)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="plus" size={16} color={colors.onPrimary} />
            </Pressable>
          )}
        </View>
      );
    },
    [subscribedRoutes, colors, onAddFeed]
  );

  if (results.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="magnify" size={40} color={colors.onSurfaceVariant} />
        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          未找到匹配的源，试试其他关键词
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.count, { color: colors.onSurfaceVariant }]}>找到 {results.length} 个源</Text>
      {results.map((item) => (
        <React.Fragment key={item.route}>{renderItem({ item })}</React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  count: { fontSize: 12, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500' },
  topic: { fontSize: 11, marginTop: 1 },
  added: { fontSize: 12, fontWeight: '500' },
  addBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});
