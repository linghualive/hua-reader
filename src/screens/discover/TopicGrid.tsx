import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import type { BuiltInTopic } from '@/services/built-in-topics';

interface Props {
  topics: BuiltInTopic[];
  subscribedTopicNames: Set<string>;
  onTopicPress: (topic: BuiltInTopic) => void;
}

export function TopicGrid({ topics, subscribedTopicNames, onTopicPress }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      {topics.map((topic) => {
        const subscribed = subscribedTopicNames.has(topic.name);
        return (
          <Pressable
            key={topic.name}
            onPress={() => onTopicPress(topic)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: pressed ? colors.surfaceVariant : colors.cardBackground,
                borderBottomColor: colors.outline + '12',
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: subscribed ? colors.primary + '15' : colors.surfaceVariant }]}>
              <MaterialCommunityIcons
                name={topic.icon as any}
                size={20}
                color={subscribed ? colors.primary : colors.onSurfaceVariant}
              />
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.onSurface }]}>{topic.name}</Text>
              <Text style={[styles.count, { color: colors.onSurfaceVariant }]}>{topic.feeds.length} 个源</Text>
            </View>
            {subscribed ? (
              <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="check" size={14} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>已订阅</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
                <MaterialCommunityIcons name="plus" size={14} color={colors.onSurfaceVariant} />
                <Text style={[styles.badgeText, { color: colors.onSurfaceVariant }]}>订阅</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  count: { fontSize: 12, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: { fontSize: 12, fontWeight: '500' },
});
