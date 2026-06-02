import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
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

interface TabPage {
  id: number | undefined;
  name: string;
}

export function ListMode() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const [tabs, setTabs] = useState<TabPage[]>([{ id: undefined, name: '全部' }]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [articlesByTab, setArticlesByTab] = useState<Map<number | undefined, ArticleWithFeed[]>>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const pagerRef = useRef<PagerView>(null);
  const tabScrollRef = useRef<ScrollView>(null);

  const loadTopics = useCallback(async () => {
    const topicList = await getAllTopics();
    const newTabs: TabPage[] = [{ id: undefined, name: '全部' }];
    topicList.forEach((t) => newTabs.push({ id: t.id, name: t.name }));
    setTabs(newTabs);
  }, []);

  const loadArticlesForTab = useCallback(async (topicId: number | undefined) => {
    const articles = await getUnreadArticles(topicId);
    setArticlesByTab((prev) => new Map(prev).set(topicId, articles));
  }, []);

  const loadAllArticles = useCallback(async () => {
    const topicList = await getAllTopics();
    const allTabs: TabPage[] = [{ id: undefined, name: '全部' }];
    topicList.forEach((t) => allTabs.push({ id: t.id, name: t.name }));
    setTabs(allTabs);
    for (const tab of allTabs) {
      const articles = await getUnreadArticles(tab.id);
      setArticlesByTab((prev) => new Map(prev).set(tab.id, articles));
    }
  }, []);

  useEffect(() => {
    loadAllArticles();
  }, [loadAllArticles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncAllFeeds();
      await loadAllArticles();
    } catch {}
    setRefreshing(false);
  }, [loadAllArticles]);

  const onTabPress = useCallback((index: number) => {
    setSelectedIndex(index);
    pagerRef.current?.setPage(index);
  }, []);

  const onPageSelected = useCallback((e: any) => {
    const index = e.nativeEvent.position;
    setSelectedIndex(index);
  }, []);

  const tabLayouts = useRef<Map<number, { x: number; width: number }>>(new Map());

  const scrollTabIntoView = useCallback((index: number) => {
    const layout = tabLayouts.current.get(index);
    if (!layout || !tabScrollRef.current) return;
    const screenWidth = Dimensions.get('window').width;
    const scrollX = Math.max(0, layout.x - (screenWidth / 2) + (layout.width / 2));
    tabScrollRef.current.scrollTo({ x: scrollX, animated: true });
  }, []);

  useEffect(() => {
    scrollTabIntoView(selectedIndex);
  }, [selectedIndex, scrollTabIntoView]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={tabScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.outline + '30' }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {tabs.map((tab, index) => {
          const active = index === selectedIndex;
          return (
            <Pressable
              key={tab.name}
              onPress={() => onTabPress(index)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                tabLayouts.current.set(index, { x, width });
              }}
              style={[
                styles.tab,
                active
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: 'transparent', borderColor: colors.outline + '50' },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? colors.onPrimary : colors.onSurfaceVariant },
                  active && { fontWeight: '600' },
                ]}
              >
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={onPageSelected}
      >
        {tabs.map((tab) => {
          const articles = articlesByTab.get(tab.id) ?? [];
          return (
            <View key={tab.name} style={{ flex: 1 }}>
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
        })}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    maxHeight: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pager: {
    flex: 1,
  },
});
