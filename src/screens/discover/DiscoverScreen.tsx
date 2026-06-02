import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/theme/ThemeContext';
import { BUILT_IN_TOPICS, type BuiltInTopic } from '@/services/built-in-topics';
import { parseOpml, generateOpml, type OpmlCategory } from '@/services/opml';
import { getAllTopics, insertTopic } from '@/db/topics';
import { getAllFeeds, insertFeed } from '@/db/feeds';
import { TopicGrid } from './TopicGrid';
import { TopicDetail } from './TopicDetail';
import { AddFeedSheet } from './AddFeedSheet';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const [subscribedTopicNames, setSubscribedTopicNames] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<BuiltInTopic | null>(null);
  const [topicDetailVisible, setTopicDetailVisible] = useState(false);
  const [addFeedVisible, setAddFeedVisible] = useState(false);

  const loadSubscribed = useCallback(async () => {
    const topics = await getAllTopics();
    setSubscribedTopicNames(new Set(topics.map((t) => t.name)));
  }, []);

  useEffect(() => {
    loadSubscribed();
  }, [loadSubscribed]);

  const handleTopicPress = useCallback((topic: BuiltInTopic) => {
    setSelectedTopic(topic);
    setTopicDetailVisible(true);
  }, []);

  const handleAddFeed = useCallback(async (url: string, title: string) => {
    try {
      // Add to uncategorized topic
      const topics = await getAllTopics();
      let uncategorized = topics.find((t) => t.name === '未分类');
      let topicId: number;
      if (uncategorized) {
        topicId = uncategorized.id;
      } else {
        topicId = await insertTopic('未分类', 'folder', false);
      }
      await insertFeed(title, url, topicId, 'native');
      Alert.alert('成功', `已添加: ${title}`);
      loadSubscribed();
    } catch {
      Alert.alert('错误', '添加失败');
    }
  }, [loadSubscribed]);

  const handleImportOpml = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/xml', 'application/xml', 'text/x-opml'],
      });

      if (result.canceled || !result.assets?.[0]) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const categories = parseOpml(content);

      let totalFeeds = 0;
      for (const category of categories) {
        const topics = await getAllTopics();
        let existing = topics.find((t) => t.name === category.name);
        let topicId: number;
        if (existing) {
          topicId = existing.id;
        } else {
          topicId = await insertTopic(category.name, 'folder', false);
        }
        for (const feed of category.feeds) {
          await insertFeed(feed.title, feed.xmlUrl, topicId, 'native');
          totalFeeds++;
        }
      }

      Alert.alert('导入成功', `已导入 ${categories.length} 个分类, ${totalFeeds} 个订阅源`);
      loadSubscribed();
    } catch (err) {
      Alert.alert('导入失败', err instanceof Error ? err.message : '未知错误');
    }
  }, [loadSubscribed]);

  const handleExportOpml = useCallback(async () => {
    try {
      const feeds = await getAllFeeds();
      const topicMap = new Map<string, { title: string; xmlUrl: string }[]>();
      for (const feed of feeds) {
        const topicName = feed.topic_name || '未分类';
        const list = topicMap.get(topicName) || [];
        list.push({ title: feed.title, xmlUrl: feed.url });
        topicMap.set(topicName, list);
      }

      const categories: OpmlCategory[] = Array.from(topicMap.entries()).map(
        ([name, feedList]) => ({
          name,
          feeds: feedList,
        }),
      );

      const opmlStr = generateOpml(categories);
      const filePath = `${FileSystem.cacheDirectory}hua-reader-feeds.opml`;
      await FileSystem.writeAsStringAsync(filePath, opmlStr);
      await Sharing.shareAsync(filePath, { mimeType: 'text/xml' });
    } catch (err) {
      Alert.alert('导出失败', err instanceof Error ? err.message : '未知错误');
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>话题订阅</Text>

        <TopicGrid
          topics={BUILT_IN_TOPICS}
          subscribedTopicNames={subscribedTopicNames}
          onTopicPress={handleTopicPress}
        />

        <View style={styles.actions}>
          <ActionButton
            icon="rss"
            label="添加 RSS"
            colors={colors}
            onPress={() => setAddFeedVisible(true)}
          />
          <ActionButton
            icon="import"
            label="导入 OPML"
            colors={colors}
            onPress={handleImportOpml}
          />
          <ActionButton
            icon="export"
            label="导出 OPML"
            colors={colors}
            onPress={handleExportOpml}
          />
        </View>
      </ScrollView>

      <TopicDetail
        visible={topicDetailVisible}
        onClose={() => setTopicDetailVisible(false)}
        topic={selectedTopic}
        onChanged={loadSubscribed}
      />

      <AddFeedSheet
        visible={addFeedVisible}
        onClose={() => setAddFeedVisible(false)}
        onAdd={handleAddFeed}
      />
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  colors,
  onPress,
}: {
  icon: string;
  label: string;
  colors: { cardBackground: string; onSurface: string; onSurfaceVariant: string; outline: string };
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        { backgroundColor: colors.cardBackground, borderColor: colors.outline + '30' },
      ]}
    >
      <MaterialCommunityIcons name={icon as any} size={20} color={colors.onSurfaceVariant} />
      <Text style={[styles.actionLabel, { color: colors.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});
