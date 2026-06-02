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
        await insertFeed(feed.title, feed.route, topicId, 'rsshub');
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
      const topicMap = new Map<string, { title: string; xmlUrl: string }[]>();
      for (const feed of feeds) {
        const name = feed.topic_name || '未分类';
        const list = topicMap.get(name) || [];
        list.push({ title: feed.title, xmlUrl: feed.url });
        topicMap.set(name, list);
      }
      const categories: OpmlCategory[] = Array.from(topicMap.entries()).map(([name, feeds]) => ({ name, feeds }));
      const filePath = `${FileSystem.cacheDirectory}hua-reader-feeds.opml`;
      await FileSystem.writeAsStringAsync(filePath, generateOpml(categories));
      await Sharing.shareAsync(filePath, { mimeType: 'text/xml' });
    } catch (err) { Alert.alert('导出失败', err instanceof Error ? err.message : '未知错误'); }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search bar - always visible */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.outline + '20' }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[styles.searchText, { color: colors.onSurface }]}
            placeholder="搜索源..."
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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isSearching ? (
          /* Search results */
          <SearchFeeds query={searchQuery} subscribedRoutes={subscribedRoutes} onAddFeed={handleSearchAddFeed} />
        ) : (
          /* Default view */
          <>
            {/* Quick subscribe */}
            {subscribedTopicNames.size < BUILT_IN_TOPICS.length && (
              <Pressable onPress={handleSubscribeAll} style={[styles.quickBtn, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.onPrimary} />
                <Text style={[styles.quickBtnText, { color: colors.onPrimary }]}>一键订阅全部话题</Text>
              </Pressable>
            )}

            {/* Topics */}
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>话题</Text>
              <Pressable onPress={() => setCreateTopicVisible(true)} style={[styles.newBtn, { borderColor: colors.primary }]}>
                <MaterialCommunityIcons name="plus" size={13} color={colors.primary} />
                <Text style={[styles.newBtnText, { color: colors.primary }]}>新建</Text>
              </Pressable>
            </View>
            <TopicGrid topics={BUILT_IN_TOPICS} subscribedTopicNames={subscribedTopicNames} onTopicPress={handleTopicPress} />

            {/* Actions */}
            <View style={styles.actionRow}>
              <ActionChip icon="rss" label="添加源" colors={colors} onPress={() => setAddFeedVisible(true)} />
              <ActionChip icon="import" label="导入" colors={colors} onPress={handleImportOpml} />
              <ActionChip icon="export" label="导出" colors={colors} onPress={handleExportOpml} />
            </View>
          </>
        )}
      </ScrollView>

      <TopicDetail visible={topicDetailVisible} onClose={() => setTopicDetailVisible(false)} topic={selectedTopic} onChanged={loadSubscribed} />
      <AddFeedSheet visible={addFeedVisible} onClose={() => setAddFeedVisible(false)} onAdd={handleAddFeed} />
      <CreateTopicSheet visible={createTopicVisible} onClose={() => setCreateTopicVisible(false)} onCreate={handleCreateTopic} />
    </SafeAreaView>
  );
}

function ActionChip({ icon, label, colors, onPress }: { icon: string; label: string; colors: any; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: colors.cardBackground, borderColor: colors.outline + '25' }]}>
      <MaterialCommunityIcons name={icon as any} size={16} color={colors.primary} />
      <Text style={[styles.chipText, { color: colors.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  searchInput: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, gap: 8 },
  searchText: { flex: 1, fontSize: 15, padding: 0 },
  scrollContent: { paddingBottom: 40 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginHorizontal: 16, marginTop: 14, marginBottom: 6, paddingVertical: 12, borderRadius: 12 },
  quickBtnText: { fontSize: 14, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  newBtnText: { fontSize: 12, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 20 },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
});
