import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import type { BuiltInTopic } from '@/services/built-in-topics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_GAP * 2) / 3;

interface TopicCardProps {
  topic: BuiltInTopic;
  isSubscribed: boolean;
  onPress: () => void;
}

function TopicCard({ topic, isSubscribed, onPress }: TopicCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSubscribed ? colors.primary + '12' : colors.cardBackground,
          borderColor: isSubscribed ? colors.primary + '40' : colors.outline + '25',
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isSubscribed ? colors.primary + '20' : colors.surfaceVariant }]}>
        <MaterialCommunityIcons
          name={topic.icon as any}
          size={22}
          color={isSubscribed ? colors.primary : colors.onSurfaceVariant}
        />
      </View>
      <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>{topic.name}</Text>
      <Text style={[styles.count, { color: colors.onSurfaceVariant }]}>
        {topic.feeds.length} 源
      </Text>
      {isSubscribed && (
        <View style={[styles.checkMark, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="check" size={10} color={colors.onPrimary} />
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
    width: CARD_WIDTH,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
  },
  count: {
    fontSize: 11,
  },
  checkMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
