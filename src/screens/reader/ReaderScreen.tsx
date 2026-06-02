import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

  const barsOpacity = useRef(new Animated.Value(1)).current;

  const toggleBars = useCallback(() => {
    const toVisible = !barsVisible;
    setBarsVisible(toVisible);
    Animated.timing(barsOpacity, {
      toValue: toVisible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [barsVisible, barsOpacity]);

  // Load article from DB
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

      // If no content or too short, try extracting full text
      let content = row.content || '';
      if (content.length < 100 && row.url) {
        const extracted = await extractFullText(row.url);
        if (extracted) {
          content = extracted;
          await cacheArticleContent(row.id, extracted);
        }
      }

      setArticle({ ...row, content });
    })();
  }, [articleId]);

  // Generate HTML whenever article or prefs change
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
    } catch {
      // ignore
    }
  }, []);

  const toggleNightMode = useCallback(() => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light');
  }, [colorMode, setColorMode]);

  const isBookmarked = article?.is_bookmarked === 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <Animated.View style={[styles.topBar, { opacity: barsOpacity, backgroundColor: colors.surface }]}>
        <SafeAreaView edges={['top']} style={styles.topBarInner}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
          </Pressable>
          <View style={styles.topBarSpacer} />
          <Pressable onPress={handleBookmark} hitSlop={12} style={styles.bookmarkButton}>
            <MaterialCommunityIcons
              name={isBookmarked ? 'star' : 'star-outline'}
              size={24}
              color={isBookmarked ? colors.primary : colors.onSurface}
            />
          </Pressable>
        </SafeAreaView>
      </Animated.View>

      {/* WebView */}
      <Pressable style={styles.webViewContainer} onPress={toggleBars}>
        {htmlContent ? (
          <WebView
            source={{ html: htmlContent }}
            style={styles.webView}
            onMessage={handleMessage}
            showsVerticalScrollIndicator={false}
            scrollEnabled
            javaScriptEnabled
            originWhitelist={['*']}
          />
        ) : null}
      </Pressable>

      {/* Bottom toolbar */}
      <Animated.View style={{ opacity: barsOpacity }}>
        <ReaderToolbar
          progress={progress}
          onToggleTypography={() => setTypographyVisible(true)}
          onToggleNightMode={toggleNightMode}
          isNightMode={colorMode !== 'light'}
        />
      </Animated.View>

      {/* Typography panel */}
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
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  topBarSpacer: {
    flex: 1,
  },
  bookmarkButton: {
    padding: 8,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
