import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, RefreshControl, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useTheme } from '@/theme/ThemeContext';
import { getAllFeeds } from '@/db/feeds';
import { getUnreadArticles, markAsRead, type ArticleWithFeed } from '@/db/articles';
import { getAllTopics, type Topic } from '@/db/topics';
import { syncFeedsByTopic } from '@/services/feed-sync';
import { EmptyState } from '@/components/EmptyState';
import { relativeTime } from '@/utils/time';
import type { RootStackParamList, DrawerParamList } from '@/app/Navigation';

type StackNav = NativeStackNavigationProp<RootStackParamList>;
type DrawNav = DrawerNavigationProp<DrawerParamList>;

export default function HomeScreen() {
  const { colors } = useTheme();
  const stackNav = useNavigation<StackNav>();
  const drawNav = useNavigation<DrawNav>();

  const [hasFeeds, setHasFeeds] = useState<boolean | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (syncing) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [syncing]);

  const loadArticles = useCallback(async () => {
    const data = await getUnreadArticles();
    setArticles(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const feeds = await getAllFeeds();
        setHasFeeds(feeds.length > 0);
        if (feeds.length === 0) return;

        const topicList = await getAllTopics();
        setTopics(topicList);
        await loadArticles();

        setSyncing(true);
        for (const t of topicList) {
          if (cancelled) break;
          await syncFeedsByTopic(t.id);
        }
        if (!cancelled) {
          await loadArticles();
          setSyncing(false);
        }
      })();
      return () => { cancelled = true; };
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    for (const t of topics) await syncFeedsByTopic(t.id, true);
    await loadArticles();
    setRefreshing(false);
  }, [topics, loadArticles]);

  const handleArticlePress = useCallback(async (article: ArticleWithFeed) => {
    await markAsRead(article.id);
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, is_read: 1 } : a));
    stackNav.navigate('Reader', { articleId: article.id });
  }, [stackNav]);

  if (hasFeeds === null) return null;
  if (!hasFeeds || topics.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => drawNav.openDrawer()} hitSlop={12} style={styles.menuBtn}>
            <MaterialCommunityIcons name="menu" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
        <EmptyState icon="book-open-page-variant-outline" message="欢迎使用华读！打开侧边栏去发现页订阅话题" actionLabel="打开菜单" onAction={() => drawNav.openDrawer()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => drawNav.openDrawer()} hitSlop={12} style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.appTitle, { color: colors.onSurface }]}>华读</Text>
        {syncing && <Animated.View style={[styles.syncDot, { backgroundColor: colors.primary, opacity: pulseAnim }]} />}
        <View style={{ flex: 1 }} />
      </View>

      {/* Article feed */}
      <FlashList
        data={articles}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <ArticleItem article={item} colors={colors} onPress={() => handleArticlePress(item)} />}
        estimatedItemSize={100}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={<EmptyState icon="newspaper-variant-outline" message={syncing ? '正在同步...' : '暂无文章，下拉刷新'} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      />
    </SafeAreaView>
  );
}

function ArticleItem({ article, colors, onPress }: { article: ArticleWithFeed; colors: any; onPress: () => void }) {
  const isRead = article.is_read === 1;
  const time = relativeTime(new Date(article.published_at));
  const summary = (article.summary || '').replace(/<[^>]*>/g, '').trim();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: pressed ? colors.surfaceVariant : 'transparent' }]}>
      <View style={styles.cardInner}>
        <View style={styles.cardSourceRow}>
          <View style={[styles.sourceDot, { backgroundColor: colors.primary + (isRead ? '30' : '80') }]} />
          <Text style={[styles.sourceName, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{article.feed_title}</Text>
          <Text style={[styles.timeText, { color: colors.onSurfaceVariant + '99' }]}>{time}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: isRead ? colors.onSurfaceVariant : colors.onSurface }]} numberOfLines={2}>
          {article.title}
        </Text>
        {summary ? (
          <Text style={[styles.cardSummary, { color: colors.onSurfaceVariant + 'BB' }]} numberOfLines={2}>{summary}</Text>
        ) : null}
      </View>
      <View style={[styles.cardDivider, { backgroundColor: colors.outline + '15' }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  menuBtn: { padding: 4, marginRight: 12 },
  appTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  syncDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  card: { paddingHorizontal: 20 },
  cardInner: { paddingVertical: 14 },
  cardSourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sourceDot: { width: 6, height: 6, borderRadius: 3 },
  sourceName: { fontSize: 12, flex: 1 },
  timeText: { fontSize: 11 },
  cardTitle: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginBottom: 4 },
  cardSummary: { fontSize: 13, lineHeight: 20 },
  cardDivider: { height: StyleSheet.hairlineWidth },
});
