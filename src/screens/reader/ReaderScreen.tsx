import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StatusBar, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { READING_BG_OPTIONS } from '@/theme/reading';
import { getDatabase } from '@/db/database';
import { cacheArticleContent, toggleBookmark, type ArticleWithFeed } from '@/db/articles';
import { generateArticleHtml } from '@/services/article-html';
import { relativeTime } from '@/utils/time';
import { estimateReadingTime } from '@/utils/reading-time';
import type { RootStackParamList } from '@/app/Navigation';

type ReaderRoute = RouteProp<RootStackParamList, 'Reader'>;

const READABILITY_JS = `
(function() {
  function extractContent() {
    var article = document.querySelector('article')
      || document.querySelector('[role="main"]')
      || document.querySelector('.post-content, .article-content, .entry-content, .content, main');

    if (!article) {
      var allPs = document.querySelectorAll('p');
      if (allPs.length > 3) {
        var container = document.createElement('div');
        allPs.forEach(function(p) {
          if (p.textContent.length > 20) container.appendChild(p.cloneNode(true));
        });
        if (container.innerHTML.length > 200) {
          return container.innerHTML;
        }
      }
      return document.body.innerHTML;
    }
    return article.innerHTML;
  }

  try {
    var content = extractContent();
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'extracted_content',
      content: content,
      title: document.title
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'extraction_failed',
      error: e.message
    }));
  }
})();
true;
`;

export default function ReaderScreen() {
  const { colors, readingPrefs, setReadingPrefs, colorMode, setColorMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ReaderRoute>();
  const { articleId } = route.params;

  const [article, setArticle] = useState<ArticleWithFeed | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [barsVisible, setBarsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'reader' | 'extracting' | 'webview'>('reader');
  const extractWebViewRef = useRef<WebView>(null);

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
      setArticle(row);

      const content = row.content || '';
      const plainText = content.replace(/<[^>]*>/g, '').trim();

      if (plainText.length > 200) {
        renderArticle(row, content);
      } else if (row.url) {
        setMode('extracting');
        setLoading(true);
        // 10s timeout: if extraction takes too long, show what we have
        setTimeout(() => {
          setLoading((loading) => {
            if (loading) {
              const fallback = content || row.summary || '';
              if (fallback.replace(/<[^>]*>/g, '').trim().length > 20) {
                renderArticle(row, fallback);
              } else {
                setMode('webview');
              }
              return false;
            }
            return loading;
          });
        }, 10000);
      } else {
        renderArticle(row, content || row.summary || '');
      }
    })();
  }, [articleId]);

  const renderArticle = useCallback((art: ArticleWithFeed, content: string) => {
    const bgOpt = READING_BG_OPTIONS.find(
      (o) => o.backgroundColor === readingPrefs.backgroundColor,
    ) || READING_BG_OPTIONS[0];

    const html = generateArticleHtml({
      title: art.title,
      feedName: art.feed_title,
      date: relativeTime(new Date(art.published_at)),
      readingTime: estimateReadingTime(content),
      content,
      fontSize: readingPrefs.fontSize,
      lineHeight: readingPrefs.lineHeight,
      backgroundColor: bgOpt.backgroundColor,
      textColor: bgOpt.textColor,
      secondaryColor: colors.onSurfaceVariant,
      accentColor: colors.primary,
    });
    setHtmlContent(html);
    setMode('reader');
    setLoading(false);
  }, [readingPrefs, colors]);

  // Re-render when prefs change
  useEffect(() => {
    if (article && mode === 'reader' && htmlContent) {
      const content = article.content || article.summary || '';
      const plainText = content.replace(/<[^>]*>/g, '').trim();
      if (plainText.length > 0) {
        renderArticle(article, content);
      }
    }
  }, [readingPrefs, colors]);

  const handleExtractMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'extracted_content' && article) {
        const content = data.content;
        const plainText = content.replace(/<[^>]*>/g, '').trim();
        if (plainText.length > 100) {
          cacheArticleContent(article.id, content);
          setArticle((prev) => prev ? { ...prev, content } : prev);
          renderArticle(article, content);
        } else {
          setMode('webview');
          setLoading(false);
        }
      } else if (data.type === 'extraction_failed') {
        setMode('webview');
        setLoading(false);
      } else if (data.type === 'scroll_progress') {
        setProgress(data.progress);
      }
    } catch {}
  }, [article, renderArticle]);

  const handleReaderMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'toggle_bars') {
        setBarsVisible((v) => !v);
      }
    } catch {}
  }, []);

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
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Hidden WebView for content extraction */}
      {mode === 'extracting' && article?.url && (
        <WebView
          ref={extractWebViewRef}
          source={{ uri: article.url }}
          style={{ height: 0, width: 0, position: 'absolute', opacity: 0 }}
          onLoadEnd={() => {
            extractWebViewRef.current?.injectJavaScript(READABILITY_JS);
          }}
          onMessage={handleExtractMessage}
          javaScriptEnabled
          originWhitelist={['*']}
          onError={() => { setMode('webview'); setLoading(false); }}
          onHttpError={() => { setMode('webview'); setLoading(false); }}
        />
      )}

      {/* Loading indicator */}
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>正在获取全文...</Text>
        </View>
      )}

      {/* Reader mode: themed HTML */}
      {mode === 'reader' && htmlContent && (
        <WebView
          source={{ html: htmlContent }}
          style={styles.webView}
          onMessage={handleReaderMessage}
          showsVerticalScrollIndicator={false}
          scrollEnabled
          javaScriptEnabled
          originWhitelist={['*']}
          mixedContentMode="compatibility"
        />
      )}

      {/* Webview fallback: show original page */}
      {mode === 'webview' && article?.url && (
        <WebView
          source={{ uri: article.url }}
          style={[styles.webView, { marginTop: statusBarHeight + 44 }]}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled
          originWhitelist={['*']}
          mixedContentMode="compatibility"
        />
      )}

      {/* Top bar */}
      {barsVisible && (
        <View style={[styles.topBar, { backgroundColor: colors.surface + 'F0' }]}>
          <View style={{ height: statusBarHeight }} />
          <View style={styles.topBarRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.barBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
            </Pressable>
            <View style={styles.topBarSpacer} />
            {mode !== 'reader' && article?.url && (
              <Pressable onPress={() => { setMode('webview'); setLoading(false); }} hitSlop={12} style={styles.barBtn}>
                <MaterialCommunityIcons name="web" size={22} color={colors.onSurfaceVariant} />
              </Pressable>
            )}
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

{/* Removed tap zone overlay - toggle bars via WebView JS tap detection */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  loadingText: { marginTop: 12, fontSize: 14 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBarRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  topBarSpacer: { flex: 1 },
  barBtn: { padding: 8 },
});
