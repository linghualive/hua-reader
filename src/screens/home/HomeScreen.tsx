import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';
import { getAllFeeds } from '@/db/feeds';
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
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const feeds = await getAllFeeds();
        setHasFeeds(feeds.length > 0);
        if (feeds.length > 0) {
          await syncAllFeeds();
          setRefreshKey((k) => k + 1);
        }
      })();
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
        <View style={styles.headerSpacer} />
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
  toggleButton: { padding: 4 },
});
