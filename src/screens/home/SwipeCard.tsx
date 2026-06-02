import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { relativeTime } from '@/utils/time';
import type { ArticleWithFeed } from '@/db/articles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeCardProps {
  article: ArticleWithFeed;
  onPress: () => void;
  onBookmark: () => void;
}

export function SwipeCard({ article, onPress, onBookmark }: SwipeCardProps) {
  const { colors } = useTheme();
  const timeStr = relativeTime(new Date(article.published_at));
  const isBookmarked = article.is_bookmarked === 1;

  // Extract plain text preview from summary or content
  const previewText = article.summary || '';

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, height: SCREEN_HEIGHT - 220 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBookmark} hitSlop={12}>
          <MaterialCommunityIcons
            name={isBookmarked ? 'star' : 'star-outline'}
            size={24}
            color={isBookmarked ? colors.primary : colors.onSurfaceVariant}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={3}>
          {article.title}
        </Text>
        <Text style={[styles.preview, { color: colors.onSurfaceVariant }]} numberOfLines={5}>
          {previewText}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.source, { color: colors.onSurfaceVariant }]}>
          {article.feed_title} · {timeStr}
        </Text>
        <Pressable
          onPress={onPress}
          style={[styles.readButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.readButtonText, { color: colors.onPrimary }]}>
            继续阅读全文
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 16,
  },
  preview: {
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    gap: 12,
  },
  source: {
    fontSize: 13,
    textAlign: 'center',
  },
  readButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  readButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
