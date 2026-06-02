import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
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
  const [searchQuery, setSearchQuery] = useState('');

  const isSearching = searchQuery.trim().length > 0;

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
    for (const topic of BUILT_IN_TOPICS) {
      const topics = await getAllTopics();
      let existing = topics.find((t) => t.name === topic.name);
      const topicId = existing ? existing.id : await insertTopic(topic.name, topic.icon, true);
      for (const feed of topic.feeds) {
        await insertFeed(feed.title, feed.route, topicId, feed.type || 'rsshub');
      }
    }
    Alert.alert('订阅成功', `已订阅全部 ${BUILT_IN_TOPICS.length} 个话题`);
    loadSubscribed();
  }, [loadSubscribed]);

  const handleSearchAddFeed = useCallback(async (feed: { title: string; route: string; topicName: string; topicIcon: string }) => {
    const topics = await getAllTopics();
    let existing = topics.find((t) => t.name === feed.topicName);
    const topicId = existing ? existing.id : await insertTopic(feed.topicName, feed.topicIcon, true);
    await insertFeed(feed.title, feed.route, topicId, 'rsshub');
    loadSubscribed();
  }, [loadSubscribed]);

  const handleAddFeed = useCallback(async (url: string, title: string, topicId: number) => {
    try {
      await insertFeed(title, url, topicId, 'native');
      Alert.alert('成功', `已添加: ${title}`);
      loadSubscribed();
    } catch { Alert.alert('错误', '添加失败'); }
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
        const topicId = existing ? existing.id : await insertTopic(cat.name, 'folder', false);
        for (const feed of cat.feeds) { await insertFeed(feed.title, feed.xmlUrl, topicId, 'native'); totalFeeds++; }
      }
      Alert.alert('导入成功', `${categories.length} 个分类，${totalFeeds} 个源`);
      loadSubscribed();
    } catch (err) { Alert.alert('导入失败', err instanceof Error ? err.message : '未知错误'); }
  }, [loadSubscribed]);

  const handleExportOpml = useCallback(async () => {
    try {
      const feeds = await getAllFeeds();
      if (feeds.length === 0) { Alert.alert('无数据', '你还没有订阅任何源'); return; }
      const topicMap = new Map<string, { title: string; xmlUrl: string }[]>();
      for (const feed of feeds) {
        const name = feed.topic_name || '未分类';
        const list = topicMap.get(name) || [];
        list.push({ title: feed.title, xmlUrl: feed.url });
        topicMap.set(name, list);
      }
      const categories: OpmlCategory[] = Array.from(topicMap.entries()).map(([name, feeds]) => ({ name, feeds }));
      const filePath = `${FileSystem.documentDirectory}hua-reader-feeds.opml`;
      await FileSystem.writeAsStringAsync(filePath, generateOpml(categories), { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(filePath, { mimeType: 'text/xml', dialogTitle: '导出订阅源' });
    } catch (err) { Alert.alert('导出失败', err instanceof Error ? err.message : '未知错误'); }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.outline + '20' }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceVariant} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="搜索 3000+ 源..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isSearching ? (
          <SearchFeeds query={searchQuery} subscribedRoutes={subscribedRoutes} onAddFeed={handleSearchAddFeed} />
        ) : (
          <>
            {/* Quick subscribe */}
            {subscribedTopicNames.size < BUILT_IN_TOPICS.length && (
              <Pressable onPress={handleSubscribeAll} style={[styles.quickBtn, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.onPrimary} />
                <Text style={[styles.quickBtnText, { color: colors.onPrimary }]}>一键订阅全部 {BUILT_IN_TOPICS.length} 个话题</Text>
              </Pressable>
            )}

            {/* Section: Topics */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>推荐话题</Text>
              <Pressable onPress={() => setCreateTopicVisible(true)} style={styles.sectionAction}>
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionActionText, { color: colors.primary }]}>自建</Text>
              </Pressable>
            </View>
            <TopicGrid topics={BUILT_IN_TOPICS} subscribedTopicNames={subscribedTopicNames} onTopicPress={handleTopicPress} />

            {/* Section: Tools */}
            <Text style={[styles.sectionTitle, { color: colors.onSurface, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }]}>工具</Text>
            <ToolItem icon="rss" label="手动添加 RSS 源" desc="粘贴任意 RSS/Atom 地址" colors={colors} onPress={() => setAddFeedVisible(true)} />
            <ToolItem icon="import" label="导入 OPML" desc="从其他阅读器迁移订阅" colors={colors} onPress={handleImportOpml} />
            <ToolItem icon="export-variant" label="导出 OPML" desc="备份当前所有订阅源" colors={colors} onPress={handleExportOpml} />
          </>
        )}
      </ScrollView>

      <TopicDetail visible={topicDetailVisible} onClose={() => setTopicDetailVisible(false)} topic={selectedTopic} onChanged={loadSubscribed} />
      <AddFeedSheet visible={addFeedVisible} onClose={() => setAddFeedVisible(false)} onAdd={handleAddFeed} />
      <CreateTopicSheet visible={createTopicVisible} onClose={() => setCreateTopicVisible(false)} onCreate={handleCreateTopic} />
    </SafeAreaView>
  );
}

function ToolItem({ icon, label, desc, colors, onPress }: { icon: string; label: string; desc: string; colors: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.toolItem, { backgroundColor: pressed ? colors.surfaceVariant : 'transparent', borderBottomColor: colors.outline + '12' }]}
    >
      <View style={[styles.toolIcon, { backgroundColor: colors.primary + '10' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.toolInfo}>
        <Text style={[styles.toolLabel, { color: colors.onSurface }]}>{label}</Text>
        <Text style={[styles.toolDesc, { color: colors.onSurfaceVariant }]}>{desc}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant + '60'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  scrollContent: { paddingBottom: 40 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 14, borderRadius: 14 },
  quickBtnText: { fontSize: 15, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionActionText: { fontSize: 13, fontWeight: '500' },
  toolItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 14 },
  toolIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  toolInfo: { flex: 1 },
  toolLabel: { fontSize: 15, fontWeight: '500' },
  toolDesc: { fontSize: 12, marginTop: 2 },
});
