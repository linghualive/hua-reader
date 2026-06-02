import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/ThemeContext';
import type { BuiltInTopic } from '@/services/built-in-topics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP) / 2;

interface TopicCardProps {
  topic: BuiltInTopic;
  feedCount: number;
  isSubscribed: boolean;
  onPress: () => void;
}

function TopicCard({ topic, feedCount, isSubscribed, onPress }: TopicCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: isSubscribed ? colors.primary + '60' : colors.outline + '30',
          width: CARD_WIDTH,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={topic.icon as any}
        size={28}
        color={isSubscribed ? colors.primary : colors.onSurfaceVariant}
      />
      <Text style={[styles.name, { color: colors.onSurface }]}>{topic.name}</Text>
      <Text style={[styles.count, { color: colors.onSurfaceVariant }]}>
        {feedCount} 个源
      </Text>
      {isSubscribed && (
        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>已订阅</Text>
        </View>
      )}
    </Pressable>
  );
}

interface TopicGridProps {
  topics: BuiltInTopic[];
  subscribedTopicNames: Set<string>;
  onTopicPress: (topic: BuiltInTopic) => void;
}

export function TopicGrid({ topics, subscribedTopicNames, onTopicPress }: TopicGridProps) {
  return (
    <View style={styles.grid}>
      {topics.map((topic) => (
        <TopicCard
          key={topic.name}
          topic={topic}
          feedCount={topic.feeds.length}
          isSubscribed={subscribedTopicNames.has(topic.name)}
          onPress={() => onTopicPress(topic)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    paddingHorizontal: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  count: {
    fontSize: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
