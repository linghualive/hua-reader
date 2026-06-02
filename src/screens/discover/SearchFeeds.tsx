import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

interface RsshubRoute {
  ns: string;
  nsName: string;
  name: string;
  path: string;
  cats: string[];
  url: string;
}

let cachedRoutes: RsshubRoute[] | null = null;

async function loadRoutes(): Promise<RsshubRoute[]> {
  if (cachedRoutes) return cachedRoutes;
  const data = require('../../../assets/rsshub-routes.json');
  cachedRoutes = data as RsshubRoute[];
  return cachedRoutes;
}

const CAT_LABELS: Record<string, string> = {
  'social-media': '社交', 'new-media': '新媒体', 'traditional-media': '传统媒体',
  'bbs': '论坛', 'blog': '博客', 'programming': '编程', 'design': '设计',
  'live': '直播', 'multimedia': '多媒体', 'picture': '图片', 'anime': '动漫',
  'program-update': '软件更新', 'university': '大学', 'shopping': '购物',
  'game': '游戏', 'reading': '阅读', 'government': '政府', 'study': '学习',
  'journal': '期刊', 'finance': '金融', 'travel': '旅游', 'forecast': '预报',
  'other': '其他', 'science': '科学',
};

interface Props {
  query: string;
  subscribedRoutes: Set<string>;
  onAddFeed: (feed: { title: string; route: string; topicName: string; topicIcon: string }) => void;
}

export function SearchFeeds({ query, subscribedRoutes, onAddFeed }: Props) {
  const { colors } = useTheme();
  const [allRoutes, setAllRoutes] = useState<RsshubRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutes().then((r) => { setAllRoutes(r); setLoading(false); });
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || allRoutes.length === 0) return [];
    return allRoutes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.nsName.toLowerCase().includes(q) ||
        r.ns.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        r.cats.some((c) => (CAT_LABELS[c] || c).includes(q))
    ).slice(0, 50);
  }, [query, allRoutes]);

  const handleAdd = useCallback((item: RsshubRoute) => {
    const catLabel = item.cats[0] ? (CAT_LABELS[item.cats[0]] || item.cats[0]) : '其他';
    onAddFeed({
      title: item.name || item.nsName,
      route: item.path,
      topicName: catLabel,
      topicIcon: 'rss',
    });
  }, [onAddFeed]);

  if (loading) {
    return <ActivityIndicator style={{ paddingTop: 40 }} color={colors.primary} />;
  }

  if (results.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="magnify" size={40} color={colors.onSurfaceVariant} />
        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          未找到匹配的源，试试其他关键词
        </Text>
        <Text style={[styles.emptyHint, { color: colors.onSurfaceVariant }]}>
          支持搜索：网站名、分类、路由路径
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.count, { color: colors.onSurfaceVariant }]}>
        找到 {results.length} 个源（共 {allRoutes.length} 个可用）
      </Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.path}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isSubscribed = subscribedRoutes.has(item.path);
          const catLabel = item.cats[0] ? (CAT_LABELS[item.cats[0]] || item.cats[0]) : '';
          return (
            <View style={[styles.row, { borderBottomColor: colors.outline + '18' }]}>
              <View style={styles.info}>
                <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
                  {item.name || item.nsName}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[styles.nsName, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                    {item.nsName}
                  </Text>
                  {catLabel ? (
                    <View style={[styles.catBadge, { backgroundColor: colors.primary + '12' }]}>
                      <Text style={[styles.catText, { color: colors.primary }]}>{catLabel}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.path, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {item.path}
                </Text>
              </View>
              {isSubscribed ? (
                <Text style={[styles.added, { color: colors.primary }]}>已添加</Text>
              ) : (
                <Pressable onPress={() => handleAdd(item)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                  <MaterialCommunityIcons name="plus" size={16} color={colors.onPrimary} />
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  count: { fontSize: 12, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  nsName: { fontSize: 12 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  catText: { fontSize: 10, fontWeight: '500' },
  path: { fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  added: { fontSize: 12, fontWeight: '500' },
  addBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14 },
  emptyHint: { fontSize: 12 },
});
