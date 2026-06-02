import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';
import { getAllFeeds } from '@/db/feeds';
import { getUnreadArticles } from '@/db/articles';
import { syncAllFeeds } from '@/services/feed-sync';
import { SwipeMode } from './SwipeMode';
import { ListMode } from './ListMode';
import { EmptyState } from '@/components/EmptyState';
import type { TabParamList } from '@/app/Navigation';

type ViewMode = 'swipe' | 'list';
type TabNavProp = BottomTabNavigationProp<TabParamList>;

export default function HomeScreen() {
  const { colors } = useTheme();
  const tabNavigation = useNavigation<TabNavProp>();
  const [viewMode, setViewMode] = useState<ViewMode>('swipe');
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

  const toggleMode = useCallback(() => {
    setViewMode((prev) => (prev === 'swipe' ? 'list' : 'swipe'));
  }, []);

  const navigateDiscover = useCallback(() => {
    tabNavigation.navigate('DiscoverTab');
  }, [tabNavigation]);

  if (hasFeeds === null) return null;

  if (!hasFeeds) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <EmptyState
          icon="book-open-page-variant-outline"
          message="欢迎使用华读！先去发现页订阅一些话题吧"
          actionLabel="去发现"
          onAction={navigateDiscover}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        {syncStatus ? (
          <View style={styles.syncRow}>
            {syncing && <ActivityIndicator size="small" color={colors.primary} />}
            <Text style={[styles.syncText, { color: colors.onSurfaceVariant }]}>{syncStatus}</Text>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Pressable onPress={toggleMode} hitSlop={12} style={styles.toggleButton}>
          <MaterialCommunityIcons
            name={viewMode === 'swipe' ? 'view-list' : 'cards'}
            size={24}
            color={colors.onSurface}
          />
        </Pressable>
      </View>
      {viewMode === 'swipe' ? (
        <SwipeMode key={`swipe-${refreshKey}`} onNavigateDiscover={navigateDiscover} />
      ) : (
        <ListMode key={`list-${refreshKey}`} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 },
  headerSpacer: { flex: 1 },
  syncRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncText: { fontSize: 12 },
  toggleButton: { padding: 4 },
});
