import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, StatusBar, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { READING_BG_OPTIONS } from '@/theme/reading';
import { getDatabase } from '@/db/database';
import { cacheArticleContent, toggleBookmark, type ArticleWithFeed } from '@/db/articles';
import { generateArticleHtml } from '@/services/article-html';
import { extractFullText } from '@/services/readability';
import { relativeTime } from '@/utils/time';
import { estimateReadingTime } from '@/utils/reading-time';
import { ReaderToolbar } from './ReaderToolbar';
import { TypographyPanel } from './TypographyPanel';
import type { RootStackParamList } from '@/app/Navigation';

type ReaderRoute = RouteProp<RootStackParamList, 'Reader'>;

export default function ReaderScreen() {
  const { colors, readingPrefs, setReadingPrefs, colorMode, setColorMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ReaderRoute>();
  const { articleId } = route.params;

  const [article, setArticle] = useState<ArticleWithFeed | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [barsVisible, setBarsVisible] = useState(true);
  const [typographyVisible, setTypographyVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const db = getDatabase();
      const row = await db.getFirstAsync<ArticleWithFeed>(
        `SELECT a.*, f.title AS feed_title, f.icon_url AS feed_icon_url
         FROM articles a JOIN feeds f ON a.feed_id = f.id
         WHERE a.id = ?`,
        [articleId],
      );
      if (!row) return;

      let content = row.content || '';
      if (content.length < 100 && row.url) {
        try {
          const extracted = await extractFullText(row.url);
          if (extracted) {
            content = extracted;
            await cacheArticleContent(row.id, extracted);
          }
        } catch {}
      }

      setArticle({ ...row, content });
    })();
  }, [articleId]);

  useEffect(() => {
    if (!article) return;

    const bgOpt = READING_BG_OPTIONS.find(
      (o) => o.backgroundColor === readingPrefs.backgroundColor,
    ) || READING_BG_OPTIONS[0];

    const html = generateArticleHtml({
      title: article.title,
      feedName: article.feed_title,
      date: relativeTime(new Date(article.published_at)),
      readingTime: estimateReadingTime(article.content || article.summary),
      content: article.content || article.summary || '',
      fontSize: readingPrefs.fontSize,
      lineHeight: readingPrefs.lineHeight,
      backgroundColor: bgOpt.backgroundColor,
      textColor: bgOpt.textColor,
      secondaryColor: colors.onSurfaceVariant,
      accentColor: colors.primary,
    });
    setHtmlContent(html);
  }, [article, readingPrefs, colors]);

  const handleBookmark = useCallback(async () => {
    if (!article) return;
    await toggleBookmark(article.id);
    setArticle((prev) =>
      prev ? { ...prev, is_bookmarked: prev.is_bookmarked === 1 ? 0 : 1 } : prev,
    );
  }, [article]);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'scroll_progress') {
        setProgress(data.progress);
      }
    } catch {}
  }, []);

  const isBookmarked = article?.is_bookmarked === 1;
  const isDark = colorMode !== 'light';

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* WebView - full screen */}
      <WebView
        source={{ html: htmlContent || '<html><body></body></html>' }}
        style={styles.webView}
        onMessage={handleMessage}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        javaScriptEnabled
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        mixedContentMode="compatibility"
        domStorageEnabled
      />

      {/* Top bar overlay */}
      {barsVisible && (
        <View style={[styles.topBar, { backgroundColor: colors.surface + 'F0' }]}>
          <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44 }} />
          <View style={styles.topBarRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.barBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
            </Pressable>
            <View style={styles.topBarSpacer} />
            <Pressable onPress={handleBookmark} hitSlop={12} style={styles.barBtn}>
              <MaterialCommunityIcons
                name={isBookmarked ? 'star' : 'star-outline'}
                size={24}
                color={isBookmarked ? colors.primary : colors.onSurface}
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom toolbar overlay */}
      {barsVisible && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface + 'F0' }]}>
          <ReaderToolbar
            progress={progress}
            onToggleTypography={() => setTypographyVisible(true)}
            onToggleNightMode={() => setColorMode(isDark ? 'light' : 'dark')}
            isNightMode={isDark}
          />
        </View>
      )}

      {/* Tap center to toggle bars */}
      <Pressable
        style={styles.tapZone}
        onPress={() => setBarsVisible((v) => !v)}
      />

      <TypographyPanel
        visible={typographyVisible}
        onClose={() => setTypographyVisible(false)}
        prefs={readingPrefs}
        onChangePrefs={setReadingPrefs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1, backgroundColor: 'transparent' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBarRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  topBarSpacer: { flex: 1 },
  barBtn: { padding: 8 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, paddingBottom: 20 },
  tapZone: { position: 'absolute', top: '30%', bottom: '30%', left: '20%', right: '20%', zIndex: 5 },
});
