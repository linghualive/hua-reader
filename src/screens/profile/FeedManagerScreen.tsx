import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Alert, SectionList, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { getAllFeeds, deleteFeed, type FeedWithMeta } from '@/db/feeds';

interface FeedSection {
  title: string;
  data: FeedWithMeta[];
}

export default function FeedManagerScreen() {
  const { colors } = useTheme();
  const [sections, setSections] = useState<FeedSection[]>([]);

  const loadFeeds = useCallback(async () => {
    const feeds = await getAllFeeds();
    const groupMap = new Map<string, FeedWithMeta[]>();
    for (const feed of feeds) {
      const topicName = feed.topic_name || '未分类';
      const list = groupMap.get(topicName) || [];
      list.push(feed);
      groupMap.set(topicName, list);
    }
    setSections(
      Array.from(groupMap.entries()).map(([title, data]) => ({ title, data })),
    );
  }, []);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  const handleDelete = useCallback(
    (feed: FeedWithMeta) => {
      Alert.alert('确认删除', `确定要删除「${feed.title}」吗？相关文章也会被清除。`, [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteFeed(feed.id);
            loadFeeds();
          },
        },
      ]);
    },
    [loadFeeds],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.feedRow, { backgroundColor: colors.cardBackground, borderBottomColor: colors.outline + '20' }]}>
            <View style={styles.feedInfo}>
              <Text style={[styles.feedTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.feedUrl, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {item.url}
              </Text>
            </View>
            <Pressable onPress={() => handleDelete(item)} hitSlop={12} style={styles.deleteBtn}>
              <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              暂无订阅源
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  feedInfo: {
    flex: 1,
    marginRight: 12,
  },
  feedTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  feedUrl: {
    fontSize: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});
