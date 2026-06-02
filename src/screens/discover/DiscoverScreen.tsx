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
import { SearchFeeds } from './SearchFeeds';
import { CreateTopicSheet } from './CreateTopicSheet';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const [subscribedTopicNames, setSubscribedTopicNames] = useState<Set<string>>(new Set());
  const [subscribedRoutes, setSubscribedRoutes] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<BuiltInTopic | null>(null);
  const [topicDetailVisible, setTopicDetailVisible] = useState(false);
  const [addFeedVisible, setAddFeedVisible] = useState(false);
  const [createTopicVisible, setCreateTopicVisible] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const loadSubscribed = useCallback(async () => {
    const topics = await getAllTopics();
    const feeds = await getAllFeeds();
    setSubscribedTopicNames(new Set(topics.map((t) => t.name)));
    setSubscribedRoutes(new Set(feeds.map((f) => f.url)));
  }, []);

  useEffect(() => { loadSubscribed(); }, [loadSubscribed]);

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
      if (existing) { topicId = existing.id; }
      else { topicId = await insertTopic(topic.name, topic.icon, true); }
      for (const feed of topic.feeds) {
        await insertFeed(feed.title, feed.route, topicId, 'rsshub');
        totalFeeds++;
      }
    }
    Alert.alert('订阅成功', `已订阅全部 ${BUILT_IN_TOPICS.length} 个话题`);
    loadSubscribed();
  }, [loadSubscribed]);

  const handleSearchAddFeed = useCallback(async (feed: { title: string; route: string; topicName: string; topicIcon: string }) => {
    const topics = await getAllTopics();
    let existing = topics.find((t) => t.name === feed.topicName);
    let topicId: number;
    if (existing) { topicId = existing.id; }
    else { topicId = await insertTopic(feed.topicName, feed.topicIcon, true); }
    await insertFeed(feed.title, feed.route, topicId, 'rsshub');
    loadSubscribed();
  }, [loadSubscribed]);

  const handleAddFeed = useCallback(async (url: string, title: string, topicId: number) => {
    try {
      await insertFeed(title, url, topicId, 'native');
      Alert.alert('成功', `已添加: ${title}`);
      loadSubscribed();
    } catch {
      Alert.alert('错误', '添加失败');
    }
  }, [loadSubscribed]);

  const handleCreateTopic = useCallback(async (name: string, icon: string) => {
    await insertTopic(name, icon, false);
    loadSubscribed();
    Alert.alert('成功', `话题「${name}」已创建`);
  }, [loadSubscribed]);

  const handleImportOpml = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/xml', 'application/xml', 'text/x-opml'] });
      if (result.canceled || !result.assets?.[0]) return;
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const categories = parseOpml(content);
      let totalFeeds = 0;
      for (const cat of categories) {
        const topics = await getAllTopics();
        let existing = topics.find((t) => t.name === cat.name);
        let topicId = existing ? existing.id : await insertTopic(cat.name, 'folder', false);
        for (const feed of cat.feeds) {
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
        const name = feed.topic_name || '未分类';
        const list = topicMap.get(name) || [];
        list.push({ title: feed.title, xmlUrl: feed.url });
        topicMap.set(name, list);
      }
      const categories: OpmlCategory[] = Array.from(topicMap.entries()).map(([name, feeds]) => ({ name, feeds }));
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
        {/* Quick subscribe all */}
        {subscribedCount < totalCount && (
          <Pressable onPress={handleSubscribeAll} style={[styles.subscribeAllBtn, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.onPrimary} />
            <Text style={[styles.subscribeAllText, { color: colors.onPrimary }]}>
              一键订阅全部 {totalCount} 个话题
            </Text>
          </Pressable>
        )}

        {/* Topic grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            话题 · {subscribedCount}/{totalCount}
          </Text>
          <Pressable onPress={() => setCreateTopicVisible(true)} style={[styles.createBtn, { borderColor: colors.primary }]}>
            <MaterialCommunityIcons name="plus" size={14} color={colors.primary} />
            <Text style={[styles.createBtnText, { color: colors.primary }]}>新建</Text>
          </Pressable>
        </View>
        <TopicGrid topics={BUILT_IN_TOPICS} subscribedTopicNames={subscribedTopicNames} onTopicPress={handleTopicPress} />

        {/* Search feeds section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>搜索源</Text>
          <Pressable onPress={() => setShowSearch(!showSearch)}>
            <MaterialCommunityIcons name={showSearch ? 'chevron-up' : 'chevron-down'} size={22} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
        {showSearch && (
          <SearchFeeds subscribedRoutes={subscribedRoutes} onAddFeed={handleSearchAddFeed} />
        )}

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }]}>更多</Text>
        <View style={styles.actions}>
          <ActionRow icon="rss" title="添加 RSS 源" desc="粘贴任意 RSS/Atom 地址" colors={colors} onPress={() => setAddFeedVisible(true)} />
          <ActionRow icon="import" title="导入 OPML" desc="从其他阅读器迁移" colors={colors} onPress={handleImportOpml} />
          <ActionRow icon="export" title="导出 OPML" desc="备份你的订阅源" colors={colors} onPress={handleExportOpml} />
        </View>
      </ScrollView>

      <TopicDetail visible={topicDetailVisible} onClose={() => setTopicDetailVisible(false)} topic={selectedTopic} onChanged={loadSubscribed} />
      <AddFeedSheet visible={addFeedVisible} onClose={() => setAddFeedVisible(false)} onAdd={handleAddFeed} />
      <CreateTopicSheet visible={createTopicVisible} onClose={() => setCreateTopicVisible(false)} onCreate={handleCreateTopic} />
    </SafeAreaView>
  );
}

function ActionRow({ icon, title, desc, colors, onPress }: { icon: string; title: string; desc: string; colors: any; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionBtn, { backgroundColor: colors.cardBackground, borderColor: colors.outline + '25' }]}>
      <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.actionInfo}>
        <Text style={[styles.actionTitle, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[styles.actionDesc, { color: colors.onSurfaceVariant }]}>{desc}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingTop: 12 },
  subscribeAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginBottom: 16, paddingVertical: 13, borderRadius: 14 },
  subscribeAllText: { fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  createBtnText: { fontSize: 12, fontWeight: '500' },
  actions: { paddingHorizontal: 16, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '500' },
  actionDesc: { fontSize: 12, marginTop: 2 },
});
