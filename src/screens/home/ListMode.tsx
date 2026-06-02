import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeContext';
import { getUnreadArticles, type ArticleWithFeed } from '@/db/articles';
import { getAllTopics, type Topic } from '@/db/topics';
import { syncAllFeeds } from '@/services/feed-sync';
import { ArticleCard } from './ArticleCard';
import { EmptyState } from '@/components/EmptyState';
import type { RootStackParamList } from '@/app/Navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function ListMode() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [topicList, articleList] = await Promise.all([
      getAllTopics(),
      getUnreadArticles(selectedTopicId),
    ]);
    setTopics(topicList);
    setArticles(articleList);
  }, [selectedTopicId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncAllFeeds();
      await loadData();
    } catch {
      // ignore
    }
    setRefreshing(false);
  }, [loadData]);

  const selectTopic = useCallback((topicId: number | undefined) => {
    setSelectedTopicId(topicId);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: colors.surface }]}
        contentContainerStyle={styles.tabBarContent}
      >
        <Pressable
          onPress={() => selectTopic(undefined)}
          style={[
            styles.tab,
            {
              backgroundColor: selectedTopicId === undefined ? colors.primary : 'transparent',
              borderColor: colors.outline,
            },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTopicId === undefined ? colors.onPrimary : colors.onSurfaceVariant,
              },
            ]}
          >
            全部
          </Text>
        </Pressable>
        {topics.map((topic) => (
          <Pressable
            key={topic.id}
            onPress={() => selectTopic(topic.id)}
            style={[
              styles.tab,
              {
                backgroundColor: selectedTopicId === topic.id ? colors.primary : 'transparent',
                borderColor: colors.outline,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: selectedTopicId === topic.id ? colors.onPrimary : colors.onSurfaceVariant,
                },
              ]}
            >
              {topic.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {articles.length === 0 ? (
        <EmptyState
          icon="newspaper-variant-outline"
          message="暂无文章，下拉刷新试试"
        />
      ) : (
        <FlashList
          data={articles}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              onPress={() => navigation.navigate('Reader', { articleId: item.id })}
            />
          )}
          estimatedItemSize={100}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    maxHeight: 48,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
