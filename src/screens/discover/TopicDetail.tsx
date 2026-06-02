import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Switch, Modal, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { getAllTopics, insertTopic } from '@/db/topics';
import { insertFeed, deleteFeed, getAllFeeds } from '@/db/feeds';
import type { BuiltInTopic } from '@/services/built-in-topics';

interface TopicDetailProps {
  visible: boolean;
  onClose: () => void;
  topic: BuiltInTopic | null;
  onChanged: () => void;
}

export function TopicDetail({ visible, onClose, topic, onChanged }: TopicDetailProps) {
  const { colors } = useTheme();
  const [subscribedUrls, setSubscribedUrls] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && topic) {
      loadSubscribed();
    }
  }, [visible, topic]);

  const loadSubscribed = async () => {
    const feeds = await getAllFeeds();
    const urls = new Set(feeds.map((f) => f.url));
    setSubscribedUrls(urls);
  };

  const getOrCreateTopicId = async (name: string, icon: string): Promise<number> => {
    const topics = await getAllTopics();
    const existing = topics.find((t) => t.name === name);
    if (existing) return existing.id;
    return insertTopic(name, icon, true);
  };

  const toggleFeed = async (route: string, title: string) => {
    if (!topic) return;
    setLoading(true);
    try {
      if (subscribedUrls.has(route)) {
        // Unsubscribe: find the feed and delete it
        const feeds = await getAllFeeds();
        const feed = feeds.find((f) => f.url === route);
        if (feed) await deleteFeed(feed.id);
        setSubscribedUrls((prev) => {
          const next = new Set(prev);
          next.delete(route);
          return next;
        });
      } else {
        // Subscribe
        const topicId = await getOrCreateTopicId(topic.name, topic.icon);
        await insertFeed(title, route, topicId, 'rsshub');
        setSubscribedUrls((prev) => new Set(prev).add(route));
      }
      onChanged();
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const subscribeAll = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const topicId = await getOrCreateTopicId(topic.name, topic.icon);
      for (const feed of topic.feeds) {
        if (!subscribedUrls.has(feed.route)) {
          await insertFeed(feed.title, feed.route, topicId, 'rsshub');
        }
      }
      await loadSubscribed();
      onChanged();
    } catch {
      // ignore
    }
    setLoading(false);
  };

  if (!topic) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onSurface }]}>{topic.name}</Text>
            <Pressable
              onPress={subscribeAll}
              disabled={loading}
              style={[styles.subscribeAllBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.subscribeAllText, { color: colors.onPrimary }]}>
                全部订阅
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.list}>
            {topic.feeds.map((feed) => (
              <View
                key={feed.route}
                style={[styles.feedRow, { borderBottomColor: colors.outline + '20' }]}
              >
                <Text style={[styles.feedTitle, { color: colors.onSurface }]} numberOfLines={1}>
                  {feed.title}
                </Text>
                <Switch
                  value={subscribedUrls.has(feed.route)}
                  onValueChange={() => toggleFeed(feed.route, feed.title)}
                  disabled={loading}
                  trackColor={{ false: colors.outline, true: colors.primary + '80' }}
                  thumbColor={subscribedUrls.has(feed.route) ? colors.primary : '#f4f3f4'}
                />
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subscribeAllBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  subscribeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  feedTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
});
