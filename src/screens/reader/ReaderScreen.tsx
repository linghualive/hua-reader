import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, StatusBar, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { getDatabase } from '@/db/database';
import { toggleBookmark, markAsRead, type ArticleWithFeed } from '@/db/articles';
import type { RootStackParamList } from '@/app/Navigation';

type ReaderRoute = RouteProp<RootStackParamList, 'Reader'>;

export default function ReaderScreen() {
  const { colors, colorMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ReaderRoute>();
  const { articleId } = route.params;

  const [article, setArticle] = useState<ArticleWithFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [barsVisible, setBarsVisible] = useState(true);

  useEffect(() => {
    (async () => {
      const db = getDatabase();
      const row = await db.getFirstAsync<ArticleWithFeed>(
        `SELECT a.*, f.title AS feed_title, f.icon_url AS feed_icon_url
         FROM articles a JOIN feeds f ON a.feed_id = f.id
         WHERE a.id = ?`,
        [articleId],
      );
      if (row) {
        setArticle(row);
        await markAsRead(row.id);
      }
    })();
  }, [articleId]);

  const handleBookmark = useCallback(async () => {
    if (!article) return;
    await toggleBookmark(article.id);
    setArticle((prev) =>
      prev ? { ...prev, is_bookmarked: prev.is_bookmarked === 1 ? 0 : 1 } : prev,
    );
  }, [article]);

  const isBookmarked = article?.is_bookmarked === 1;
  const isDark = colorMode !== 'light';
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.outline + '20' }]}>
        <View style={{ height: statusBarHeight }} />
        <View style={styles.topBarRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.barBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.titleText, { color: colors.onSurface }]} numberOfLines={1}>
            {article?.feed_title || ''}
          </Text>
          <Pressable onPress={handleBookmark} hitSlop={12} style={styles.barBtn}>
            <MaterialCommunityIcons
              name={isBookmarked ? 'star' : 'star-outline'}
              size={24}
              color={isBookmarked ? colors.primary : colors.onSurface}
            />
          </Pressable>
        </View>
      </View>

      {/* WebView with original article */}
      {article?.url ? (
        <WebView
          source={{ uri: article.url }}
          style={styles.webView}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={false}
        />
      ) : null}

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  topBarRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10 },
  barBtn: { padding: 8 },
  titleText: { flex: 1, fontSize: 15, fontWeight: '500', marginHorizontal: 8 },
  webView: { flex: 1 },
  loadingBar: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
});
