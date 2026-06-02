import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StatusBar, ActivityIndicator, Alert, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { READING_BG_OPTIONS } from '@/theme/reading';
import { getDatabase } from '@/db/database';
import { cacheArticleContent, toggleBookmark, markAsRead, type ArticleWithFeed } from '@/db/articles';
import { generateArticleHtml } from '@/services/article-html';
import { translateHtmlParagraphs } from '@/services/translate';
import { relativeTime } from '@/utils/time';
import { estimateReadingTime } from '@/utils/reading-time';
import type { RootStackParamList } from '@/app/Navigation';

type ReaderRoute = RouteProp<RootStackParamList, 'Reader'>;

// Readability extraction via hidden WebView
const EXTRACT_JS = `
(function() {
  function extract() {
    // Try semantic selectors first
    var selectors = [
      'article', '[role="article"]',
      '.article-content', '.post-content', '.entry-content', '.article-body',
      '.article_content', '.post_content', '.content-article',
      '.artical-content-wrap', '.article-detail', '.post-body',
      'main [class*="content"]', 'main article',
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.textContent.trim().length > 100) return el.innerHTML;
    }
    // Fallback: find the longest container of <p> tags
    var containers = document.querySelectorAll('div, section, main');
    var best = null, bestLen = 0;
    containers.forEach(function(c) {
      var ps = c.querySelectorAll('p');
      var len = 0;
      ps.forEach(function(p) { len += p.textContent.length; });
      if (len > bestLen && ps.length >= 2) { best = c; bestLen = len; }
    });
    if (best && bestLen > 100) return best.innerHTML;
    return null;
  }
  // Wait for dynamic content
  setTimeout(function() {
    var content = extract();
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'extracted', content: content }));
  }, 1500);
})(); true;
`;

const CLEAN_PAGE_JS = `
(function() {
  function clean() {
    var hide = [
      '[class*="ad"]', '[id*="ad"]',
      '[class*="banner"]', '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
      '[class*="sidebar"]', '[class*="recommend"]', '[class*="related"]',
      '[class*="share"]', '[class*="social"]', '[class*="comment"]',
      '[class*="toolbar"]', '[class*="sticky"]', '[class*="fixed"]',
      '[class*="download"]', '[class*="open-app"]', '[class*="openapp"]',
      '[class*="guide"]', '[class*="toast"]', '[class*="mask"]',
      '[class*="float"]', '[class*="qrcode"]', '[class*="wechat"]',
      '[class*="follow"]', '[class*="subscribe"]', '[class*="login"]',
      '[class*="promotion"]', '[class*="bottom-bar"]', '[class*="bottombar"]',
      '[class*="top-bar"]', '[class*="topbar"]', '[class*="dialog"]',
      'nav', 'footer', 'header:not(.article-header)',
      '[role="banner"]', '[role="navigation"]', 'iframe',
    ];
    hide.forEach(function(s) {
      try {
        document.querySelectorAll(s).forEach(function(el) {
          if (!el.closest('article, main, [class*="content"]') ||
              (el.className||'').toLowerCase().match(/ad|banner|share|download|recommend|comment|open.?app|qrcode|login|promo/)) {
            el.style.setProperty('display','none','important');
          }
        });
      } catch(e){}
    });
    var css = document.createElement('style');
    css.textContent = 'body,html{overflow:auto!important}[style*="position: fixed"],[style*="position:fixed"]{display:none!important}';
    document.head.appendChild(css);
  }
  clean(); setTimeout(clean,1500); setTimeout(clean,3500);
})(); true;
`;

const DARK_MODE_JS = `
(function() {
  var s = document.createElement('style');
  s.textContent = 'html,body{background-color:#121212!important;color:#e0e0e0!important}*{border-color:#333!important}img{opacity:0.9}a{color:#82b1ff!important}';
  document.head.appendChild(s);
})(); true;
`;

export default function ReaderScreen() {
  const { colors, readingPrefs, colorMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ReaderRoute>();
  const { articleId } = route.params;

  const [article, setArticle] = useState<ArticleWithFeed | null>(null);
  const [mode, setMode] = useState<'loading' | 'reader' | 'web'>('loading');
  const [readerHtml, setReaderHtml] = useState('');
  const [barsVisible, setBarsVisible] = useState(true);
  const [webLoading, setWebLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
  const extractRef = useRef<WebView>(null);
  const extractTimeout = useRef<ReturnType<typeof setTimeout>>();

  const isDark = colorMode !== 'light';
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

  const buildReaderHtml = useCallback((art: ArticleWithFeed, content: string) => {
    const bgOpt = READING_BG_OPTIONS.find(o => o.backgroundColor === readingPrefs.backgroundColor) || READING_BG_OPTIONS[0];
    return generateArticleHtml({
      title: art.title,
      feedName: art.feed_title,
      date: relativeTime(new Date(art.published_at)),
      readingTime: estimateReadingTime(content),
      content,
      fontSize: readingPrefs.fontSize,
      lineHeight: readingPrefs.lineHeight,
      backgroundColor: isDark ? '#121212' : bgOpt.backgroundColor,
      textColor: isDark ? '#e0e0e0' : bgOpt.textColor,
      secondaryColor: colors.onSurfaceVariant,
      accentColor: colors.primary,
    });
  }, [readingPrefs, colors, isDark]);

  const showReader = useCallback((art: ArticleWithFeed, content: string) => {
    setReaderHtml(buildReaderHtml(art, content));
    setMode('reader');
  }, [buildReaderHtml]);

  // Load article and decide mode
  useEffect(() => {
    (async () => {
      const db = getDatabase();
      const row = await db.getFirstAsync<ArticleWithFeed>(
        `SELECT a.*, f.title AS feed_title, f.icon_url AS feed_icon_url
         FROM articles a JOIN feeds f ON a.feed_id = f.id WHERE a.id = ?`,
        [articleId],
      );
      if (!row) return;
      setArticle(row);
      await markAsRead(row.id);

      // Check if we have cached full content
      const content = row.content || '';
      const plainLen = content.replace(/<[^>]*>/g, '').trim().length;

      if (plainLen > 300) {
        // Good cached content, show directly
        showReader(row, content);
      } else if (row.url) {
        // Need to extract full content from URL
        setMode('loading');
        // Safety timeout: fall back to web mode after 8s
        extractTimeout.current = setTimeout(() => {
          setMode((m) => {
            if (m === 'loading') return 'web';
            return m;
          });
        }, 8000);
      } else {
        // No URL, show whatever we have
        showReader(row, content || row.summary || '暂无内容');
      }
    })();

    return () => { if (extractTimeout.current) clearTimeout(extractTimeout.current); };
  }, [articleId]);

  // Re-render reader on theme change
  useEffect(() => {
    if (mode === 'reader' && article) {
      const content = article.content || article.summary || '';
      setReaderHtml(buildReaderHtml(article, content));
    }
  }, [readingPrefs, colors, isDark]);

  const handleExtractMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'extracted' && article) {
        if (extractTimeout.current) clearTimeout(extractTimeout.current);
        if (data.content && data.content.replace(/<[^>]*>/g, '').trim().length > 100) {
          // Cache the extracted content for future reads
          cacheArticleContent(article.id, data.content);
          const updatedArticle = { ...article, content: data.content };
          setArticle(updatedArticle);
          showReader(updatedArticle, data.content);
        } else {
          // Extraction got too little content, show original
          setMode('web');
        }
      }
    } catch {}
  }, [article, showReader]);

  const handleReaderMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'toggle_bars') setBarsVisible(v => !v);
    } catch {}
  }, []);

  const handleBookmark = useCallback(async () => {
    if (!article) return;
    await toggleBookmark(article.id);
    setArticle(prev => prev ? { ...prev, is_bookmarked: prev.is_bookmarked === 1 ? 0 : 1 } : prev);
  }, [article]);

  const toggleMode = useCallback(() => {
    if (mode === 'reader' && article?.url) setMode('web');
    else if (mode === 'web' && readerHtml) setMode('reader');
  }, [mode, article, readerHtml]);

  const handleTranslate = useCallback(async () => {
    if (!article) return;
    const content = article.content || article.summary || '';
    if (!content.trim()) return;

    if (isTranslated) {
      // Revert to original
      showReader(article, originalContent);
      setIsTranslated(false);
      return;
    }

    setOriginalContent(content);
    setTranslating(true);
    try {
      const translated = await translateHtmlParagraphs(content);
      showReader(article, translated);
      setIsTranslated(true);
    } catch (err) {
      Alert.alert('翻译失败', err instanceof Error ? err.message : '请检查网络连接');
    }
    setTranslating(false);
  }, [article, isTranslated, originalContent, showReader]);

  const isBookmarked = article?.is_bookmarked === 1;
  const canToggle = (mode === 'reader' && article?.url) || (mode === 'web' && readerHtml);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Hidden WebView for on-demand content extraction */}
      {mode === 'loading' && article?.url && (
        <WebView
          ref={extractRef}
          source={{ uri: article.url }}
          style={{ height: 0, width: 0, position: 'absolute', opacity: 0 }}
          onLoadEnd={() => extractRef.current?.injectJavaScript(EXTRACT_JS)}
          onMessage={handleExtractMessage}
          javaScriptEnabled
          originWhitelist={['*']}
          onError={() => setMode('web')}
          onHttpError={() => setMode('web')}
        />
      )}

      {/* Loading state */}
      {mode === 'loading' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>正在获取全文...</Text>
        </View>
      )}

      {/* Reader mode: clean themed content */}
      {mode === 'reader' && readerHtml ? (
        <WebView
          source={{ html: readerHtml }}
          style={styles.webView}
          onMessage={handleReaderMessage}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled
          originWhitelist={['*']}
        />
      ) : null}

      {/* Web mode: original page with ad removal */}
      {mode === 'web' && article?.url ? (
        <WebView
          source={{ uri: article.url }}
          style={[styles.webView, { marginTop: statusBarHeight + 44 }]}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          forceDarkOn={isDark}
          injectedJavaScript={CLEAN_PAGE_JS + (isDark ? DARK_MODE_JS : '')}
          onLoadStart={() => setWebLoading(true)}
          onLoadEnd={() => setWebLoading(false)}
        />
      ) : null}

      {/* Top bar */}
      {barsVisible && (
        <View style={[styles.topBar, { backgroundColor: (isDark ? '#121212' : colors.surface) + 'F0' }]}>
          <View style={{ height: statusBarHeight }} />
          <View style={styles.topBarRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.barBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#e0e0e0' : colors.onSurface} />
            </Pressable>
            <Text style={[styles.titleText, { color: isDark ? '#e0e0e0' : colors.onSurface }]} numberOfLines={1}>
              {article?.feed_title || ''}
            </Text>
            {mode === 'reader' && (
              <Pressable onPress={handleTranslate} disabled={translating} hitSlop={12} style={styles.barBtn}>
                {translating ? (
                  <ActivityIndicator size={18} color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons
                    name="translate"
                    size={22}
                    color={isTranslated ? colors.primary : (isDark ? '#aaa' : colors.onSurfaceVariant)}
                  />
                )}
              </Pressable>
            )}
            {canToggle && (
              <Pressable onPress={toggleMode} hitSlop={12} style={styles.barBtn}>
                <MaterialCommunityIcons
                  name={mode === 'reader' ? 'web' : 'text-box-outline'}
                  size={22}
                  color={isDark ? '#aaa' : colors.onSurfaceVariant}
                />
              </Pressable>
            )}
            <Pressable onPress={handleBookmark} hitSlop={12} style={styles.barBtn}>
              <MaterialCommunityIcons
                name={isBookmarked ? 'star' : 'star-outline'}
                size={24}
                color={isBookmarked ? colors.primary : (isDark ? '#e0e0e0' : colors.onSurface)}
              />
            </Pressable>
          </View>
        </View>
      )}

      {webLoading && mode === 'web' && (
        <View style={[styles.webLoadingBar, { top: statusBarHeight + 44 }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBarRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8 },
  barBtn: { padding: 8 },
  titleText: { flex: 1, fontSize: 15, fontWeight: '500', marginHorizontal: 4 },
  webLoadingBar: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 15, paddingVertical: 4 },
});
