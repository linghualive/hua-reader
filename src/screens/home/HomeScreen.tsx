import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, Animated, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';
import { getAllFeeds } from '@/db/feeds';
import { getUnreadArticles, markAsRead, type ArticleWithFeed } from '@/db/articles';
import { getAllTopics, type Topic } from '@/db/topics';
import { syncAllFeeds } from '@/services/feed-sync';
import { EmptyState } from '@/components/EmptyState';
import { relativeTime } from '@/utils/time';
import type { RootStackParamList, TabParamList } from '@/app/Navigation';

type StackNav = NativeStackNavigationProp<RootStackParamList>;
type TabNav = BottomTabNavigationProp<TabParamList>;

interface TabPage { id: number | undefined; name: string; }

export default function HomeScreen() {
  const { colors } = useTheme();
  const stackNav = useNavigation<StackNav>();
  const tabNav = useNavigation<TabNav>();

  const [hasFeeds, setHasFeeds] = useState<boolean | null>(null);
  const [tabs, setTabs] = useState<TabPage[]>([{ id: undefined, name: '全部' }]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [articlesByTab, setArticlesByTab] = useState<Map<number | undefined, ArticleWithFeed[]>>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const pagerRef = useRef<PagerView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Map<number, { x: number; width: number }>>(new Map());
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (syncing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [syncing]);

  const loadAllData = useCallback(async () => {
    const topicList = await getAllTopics();
    const newTabs: TabPage[] = [{ id: undefined, name: '全部' }];
    topicList.forEach((t) => newTabs.push({ id: t.id, name: t.name }));
    setTabs(newTabs);

    const map = new Map<number | undefined, ArticleWithFeed[]>();
    for (const tab of newTabs) {
      map.set(tab.id, await getUnreadArticles(tab.id));
    }
    setArticlesByTab(map);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const feeds = await getAllFeeds();
        setHasFeeds(feeds.length > 0);
        if (feeds.length > 0) {
          await loadAllData();
          setSyncing(true);
          syncAllFeeds().then(() => {
            if (!cancelled) { setSyncing(false); loadAllData(); }
          }).catch(() => { if (!cancelled) setSyncing(false); });
        }
      })();
      return () => { cancelled = true; };
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncAllFeeds().catch(() => {});
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  const handleArticlePress = useCallback(async (article: ArticleWithFeed) => {
    await markAsRead(article.id);
    stackNav.navigate('Reader', { articleId: article.id });
  }, [stackNav]);

  const onTabPress = useCallback((index: number) => {
    setSelectedIndex(index);
    pagerRef.current?.setPage(index);
  }, []);

  const onPageSelected = useCallback((e: any) => {
    const index = e.nativeEvent.position;
    setSelectedIndex(index);
  }, []);

  useEffect(() => {
    const layout = tabLayouts.current.get(selectedIndex);
    if (layout && tabScrollRef.current) {
      const screenWidth = Dimensions.get('window').width;
      tabScrollRef.current.scrollTo({ x: Math.max(0, layout.x - screenWidth / 2 + layout.width / 2), animated: true });
    }
  }, [selectedIndex]);

  if (hasFeeds === null) return null;

  if (!hasFeeds) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <EmptyState
          icon="book-open-page-variant-outline"
          message="欢迎使用华读！先去发现页订阅一些话题吧"
          actionLabel="去发现"
          onAction={() => tabNav.navigate('DiscoverTab')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outline + '15' }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.appTitle, { color: colors.onSurface }]}>华读</Text>
          {syncing && (
            <Animated.View style={[styles.syncDot, { backgroundColor: colors.primary, opacity: pulseAnim }]} />
          )}
        </View>

        {/* Topic tabs */}
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {tabs.map((tab, index) => {
            const active = index === selectedIndex;
            return (
              <Pressable
                key={tab.name + index}
                onPress={() => onTabPress(index)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  tabLayouts.current.set(index, { x, width });
                }}
                style={[
                  styles.tab,
                  active ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <Text style={[
                  styles.tabText,
                  { color: active ? colors.onPrimary : colors.onSurfaceVariant },
                  active && { fontWeight: '600' },
                ]}>
                  {tab.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Swipeable article pages */}
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
                <EmptyState icon="newspaper-variant-outline" message="暂无文章，下拉刷新试试" />
              ) : (
                <FlashList
                  data={articles}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <ArticleItem article={item} colors={colors} onPress={() => handleArticlePress(item)} />
                  )}
                  estimatedItemSize={90}
                  contentContainerStyle={{ paddingBottom: 80 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                  }
                />
              )}
            </View>
          );
        })}
      </PagerView>
    </SafeAreaView>
  );
}

function ArticleItem({ article, colors, onPress }: { article: ArticleWithFeed; colors: any; onPress: () => void }) {
  const isRead = article.is_read === 1;
  const time = relativeTime(new Date(article.published_at));
  const summary = (article.summary || '').replace(/<[^>]*>/g, '').trim();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? colors.surfaceVariant : colors.cardBackground },
      ]}
    >
      <View style={styles.cardSourceRow}>
        <View style={[styles.sourceDot, { backgroundColor: colors.primary + '60' }]} />
        <Text style={[styles.sourceName, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {article.feed_title}
        </Text>
        <Text style={[styles.timeText, { color: colors.onSurfaceVariant + 'AA' }]}>{time}</Text>
      </View>
      <Text
        style={[
          styles.cardTitle,
          { color: isRead ? colors.onSurfaceVariant : colors.onSurface },
          !isRead && { fontWeight: '600' },
        ]}
        numberOfLines={2}
      >
        {article.title}
      </Text>
      {summary ? (
        <Text style={[styles.cardSummary, { color: colors.onSurfaceVariant + 'CC' }]} numberOfLines={2}>
          {summary}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  appTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  syncDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  tabContent: { paddingHorizontal: 14, gap: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  tabText: { fontSize: 13 },
  pager: { flex: 1 },
  card: { paddingHorizontal: 16, paddingVertical: 14 },
  cardSourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sourceDot: { width: 6, height: 6, borderRadius: 3 },
  sourceName: { fontSize: 12, flex: 1 },
  timeText: { fontSize: 11 },
  cardTitle: { fontSize: 16, lineHeight: 23, marginBottom: 4 },
  cardSummary: { fontSize: 13, lineHeight: 19 },
});
