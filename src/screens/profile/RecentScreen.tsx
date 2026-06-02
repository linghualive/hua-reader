import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeContext';
import { getRecentlyRead, type ArticleWithFeed } from '@/db/articles';
import { EmptyState } from '@/components/EmptyState';
import { relativeTime } from '@/utils/time';
import type { RootStackParamList } from '@/app/Navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function RecentScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecentlyRead(50).then(setArticles);
    }, []),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <FlashList
        data={articles}
        keyExtractor={item => String(item.id)}
        estimatedItemSize={80}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<EmptyState icon="history" message="还没有阅读记录" />}
        renderItem={({ item }) => {
          const time = item.read_at ? relativeTime(new Date(item.read_at)) : '';
          return (
            <Pressable
              onPress={() => navigation.navigate('Reader', { articleId: item.id })}
              style={({ pressed }) => [styles.card, { backgroundColor: pressed ? colors.surfaceVariant : colors.cardBackground }]}
            >
              <View style={styles.cardSourceRow}>
                <Text style={[styles.sourceName, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{item.feed_title}</Text>
                <Text style={[styles.timeText, { color: colors.onSurfaceVariant + 'AA' }]}>{time}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>{item.title}</Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { paddingHorizontal: 16, paddingVertical: 12 },
  cardSourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sourceName: { fontSize: 12, flex: 1 },
  timeText: { fontSize: 11 },
  cardTitle: { fontSize: 15, lineHeight: 22 },
});
