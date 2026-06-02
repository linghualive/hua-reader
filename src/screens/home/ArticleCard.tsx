import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { relativeTime } from '@/utils/time';
import type { ArticleWithFeed } from '@/db/articles';

interface ArticleCardProps {
  article: ArticleWithFeed;
  onPress: () => void;
}

export function ArticleCard({ article, onPress }: ArticleCardProps) {
  const { colors } = useTheme();
  const isRead = article.is_read === 1;
  const timeStr = relativeTime(new Date(article.published_at));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.outline + '30',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.meta, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {article.feed_title} · {timeStr}
        </Text>
        <Text
          style={[
            styles.title,
            {
              color: isRead ? colors.onSurfaceVariant : colors.onSurface,
              fontWeight: isRead ? '400' : '600',
            },
          ]}
          numberOfLines={2}
        >
          {article.title}
        </Text>
        {article.summary ? (
          <Text
            style={[styles.summary, { color: colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {article.summary}
          </Text>
        ) : null}
      </View>
      {article.image_url ? (
        <Image
          source={{ uri: article.image_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  meta: {
    fontSize: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    alignSelf: 'center',
  },
});
