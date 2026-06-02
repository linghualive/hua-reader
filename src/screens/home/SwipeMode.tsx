import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeContext';
import { getUnreadArticles, markAsRead, toggleBookmark, type ArticleWithFeed } from '@/db/articles';
import { SwipeCard } from './SwipeCard';
import { EmptyState } from '@/components/EmptyState';
import type { RootStackParamList } from '@/app/Navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Interleave articles by feed so consecutive cards are from different sources.
 */
function interleaveByFeed(articles: ArticleWithFeed[]): ArticleWithFeed[] {
  const byFeed = new Map<number, ArticleWithFeed[]>();
  for (const a of articles) {
    const list = byFeed.get(a.feed_id) || [];
    list.push(a);
    byFeed.set(a.feed_id, list);
  }

  const queues = Array.from(byFeed.values());
  const result: ArticleWithFeed[] = [];
  let lastFeedId: number | null = null;

  while (queues.some((q) => q.length > 0)) {
    // Try to pick from a queue that differs from the last feed
    let picked = false;
    for (const q of queues) {
      if (q.length > 0 && q[0].feed_id !== lastFeedId) {
        const item = q.shift()!;
        result.push(item);
        lastFeedId = item.feed_id;
        picked = true;
        break;
      }
    }
    if (!picked) {
      // All remaining are from the same feed
      for (const q of queues) {
        if (q.length > 0) {
          const item = q.shift()!;
          result.push(item);
          lastFeedId = item.feed_id;
          break;
        }
      }
    }
  }

  return result;
}

interface SwipeModeProps {
  onNavigateDiscover: () => void;
}

export function SwipeMode({ onNavigateDiscover }: SwipeModeProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const pagerRef = useRef<PagerView>(null);

  const loadArticles = useCallback(async () => {
    const unread = await getUnreadArticles();
    setArticles(interleaveByFeed(unread));
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const index = e.nativeEvent.position;
      if (articles[index]) {
        markAsRead(articles[index].id).catch(() => {});
      }
    },
    [articles],
  );

  const handleBookmark = useCallback(
    async (articleId: number) => {
      await toggleBookmark(articleId);
      setArticles((prev) =>
        prev.map((a) =>
          a.id === articleId
            ? { ...a, is_bookmarked: a.is_bookmarked === 1 ? 0 : 1 }
            : a,
        ),
      );
    },
    [],
  );

  if (articles.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="card-text-outline"
          message="已经刷完了，去发现更多话题？"
          actionLabel="去发现"
          onAction={onNavigateDiscover}
        />
      </View>
    );
  }

  return (
    <PagerView
      ref={pagerRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      orientation="vertical"
      onPageSelected={onPageSelected}
      initialPage={0}
    >
      {articles.map((article, index) => (
        <View key={article.id} style={styles.page}>
          <SwipeCard
            article={article}
            onPress={() => navigation.navigate('Reader', { articleId: article.id })}
            onBookmark={() => handleBookmark(article.id)}
          />
        </View>
      ))}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
  },
});
