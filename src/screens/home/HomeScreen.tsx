import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';
import { getAllFeeds } from '@/db/feeds';
import { getUnreadArticles } from '@/db/articles';
import { syncAllFeeds } from '@/services/feed-sync';
import { ListMode } from './ListMode';
import { EmptyState } from '@/components/EmptyState';
import type { TabParamList } from '@/app/Navigation';

type TabNavProp = BottomTabNavigationProp<TabParamList>;

export default function HomeScreen() {
  const { colors } = useTheme();
  const tabNavigation = useNavigation<TabNavProp>();
  const [hasFeeds, setHasFeeds] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const feeds = await getAllFeeds();
        setHasFeeds(feeds.length > 0);
        if (feeds.length > 0) {
          setSyncing(true);
          setSyncStatus(`正在同步 ${feeds.length} 个源...`);
          try {
            const results = await syncAllFeeds();
            if (cancelled) return;
            const totalNew = results.reduce((sum, r) => sum + r.newArticles, 0);
            const errors = results.filter((r) => r.error).length;
            if (totalNew > 0) {
              setSyncStatus(`已加载 ${totalNew} 篇新文章`);
            } else {
              const articles = await getUnreadArticles();
              setSyncStatus(`共 ${articles.length} 篇文章`);
            }
            if (errors > 0) {
              setSyncStatus((prev) => `${prev}（${errors} 个源失败）`);
            }
          } catch {
            setSyncStatus('同步失败');
          }
          setSyncing(false);
          setRefreshKey((k) => k + 1);
          setTimeout(() => { if (!cancelled) setSyncStatus(''); }, 3000);
        }
      })();
      return () => { cancelled = true; };
    }, []),
  );

  if (hasFeeds === null) return null;

  if (!hasFeeds) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <EmptyState
          icon="book-open-page-variant-outline"
          message="欢迎使用华读！先去发现页订阅一些话题吧"
          actionLabel="去发现"
          onAction={() => tabNavigation.navigate('DiscoverTab')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {syncStatus ? (
        <View style={[styles.syncBar, { backgroundColor: colors.surfaceVariant }]}>
          {syncing && <ActivityIndicator size="small" color={colors.primary} />}
          <Text style={[styles.syncText, { color: colors.onSurfaceVariant }]}>{syncStatus}</Text>
        </View>
      ) : null}
      <ListMode key={`list-${refreshKey}`} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  syncBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 6 },
  syncText: { fontSize: 12 },
});
