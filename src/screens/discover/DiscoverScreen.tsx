import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  const handleSubscribeAll = useCallback(async () => {
    let totalFeeds = 0;
    for (const topic of BUILT_IN_TOPICS) {
      const topics = await getAllTopics();
      let existing = topics.find((t) => t.name === topic.name);
      let topicId: number;
      if (existing) {
        topicId = existing.id;
      } else {
        topicId = await insertTopic(topic.name, topic.icon, true);
      }
      for (const feed of topic.feeds) {
        await insertFeed(feed.title, feed.route, topicId, 'rsshub');
        totalFeeds++;
      }
    }
    Alert.alert('订阅成功', `已订阅全部 ${BUILT_IN_TOPICS.length} 个话题，${totalFeeds} 个源`);
    loadSubscribed();
  }, [loadSubscribed]);

  const handleAddFeed = useCallback(async (url: string, title: string) => {
    try {
      const topics = await getAllTopics();
      let uncategorized = topics.find((t) => t.name === '自定义');
      let topicId: number;
      if (uncategorized) {
        topicId = uncategorized.id;
      } else {
        topicId = await insertTopic('自定义', 'rss', false);
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
      Alert.alert('导入成功', `已导入 ${categories.length} 个分类，${totalFeeds} 个源`);
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
        ([name, feedList]) => ({ name, feeds: feedList }),
      );
      const opmlStr = generateOpml(categories);
      const filePath = `${FileSystem.cacheDirectory}hua-reader-feeds.opml`;
      await FileSystem.writeAsStringAsync(filePath, opmlStr);
      await Sharing.shareAsync(filePath, { mimeType: 'text/xml' });
    } catch (err) {
      Alert.alert('导出失败', err instanceof Error ? err.message : '未知错误');
    }
  }, []);

  const subscribedCount = subscribedTopicNames.size;
  const totalCount = BUILT_IN_TOPICS.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>发现</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            选择感兴趣的话题，打破认知边界
          </Text>
        </View>

        {/* Quick subscribe all */}
        {subscribedCount < totalCount && (
          <Pressable
            onPress={handleSubscribeAll}
            style={[styles.subscribeAllBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.onPrimary} />
            <Text style={[styles.subscribeAllText, { color: colors.onPrimary }]}>
              一键订阅全部 {totalCount} 个话题（{BUILT_IN_TOPICS.reduce((a, t) => a + t.feeds.length, 0)} 个源）
            </Text>
          </Pressable>
        )}

        {/* Topic grid */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
          话题 · {subscribedCount}/{totalCount} 已订阅
        </Text>
        <TopicGrid
          topics={BUILT_IN_TOPICS}
          subscribedTopicNames={subscribedTopicNames}
          onTopicPress={handleTopicPress}
        />

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>更多</Text>
        <View style={styles.actions}>
          <Pressable
            onPress={() => setAddFeedVisible(true)}
            style={[styles.actionBtn, { backgroundColor: colors.cardBackground, borderColor: colors.outline + '25' }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="rss" size={18} color={colors.primary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.onSurface }]}>添加 RSS 源</Text>
              <Text style={[styles.actionDesc, { color: colors.onSurfaceVariant }]}>粘贴任意 RSS/Atom 地址</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </Pressable>

          <Pressable
            onPress={handleImportOpml}
            style={[styles.actionBtn, { backgroundColor: colors.cardBackground, borderColor: colors.outline + '25' }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="import" size={18} color={colors.primary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.onSurface }]}>导入 OPML</Text>
              <Text style={[styles.actionDesc, { color: colors.onSurfaceVariant }]}>从其他阅读器迁移</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </Pressable>

          <Pressable
            onPress={handleExportOpml}
            style={[styles.actionBtn, { backgroundColor: colors.cardBackground, borderColor: colors.outline + '25' }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="export" size={18} color={colors.primary} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.onSurface }]}>导出 OPML</Text>
              <Text style={[styles.actionDesc, { color: colors.onSurfaceVariant }]}>备份你的订阅源</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  subscribeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 13,
    borderRadius: 14,
  },
  subscribeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  actions: {
    paddingHorizontal: 16,
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  actionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
