import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeContext';
import { getBookmarkedArticles, type ArticleWithFeed } from '@/db/articles';
import { ArticleCard } from '@/screens/home/ArticleCard';
import { EmptyState } from '@/components/EmptyState';
import type { RootStackParamList } from '@/app/Navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [query, setQuery] = useState('');

  const loadBookmarks = useCallback(async (searchQuery?: string) => {
    const results = await getBookmarkedArticles(searchQuery || undefined);
    setArticles(results);
  }, []);

  useEffect(() => {
    loadBookmarks(query);
  }, [query, loadBookmarks]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[
          styles.searchBar,
          {
            color: colors.onSurface,
            backgroundColor: colors.surfaceVariant,
            borderColor: colors.outline + '40',
          },
        ]}
        placeholder="搜索收藏..."
        placeholderTextColor={colors.onSurfaceVariant}
        value={query}
        onChangeText={setQuery}
      />

      {articles.length === 0 ? (
        <EmptyState icon="star-outline" message="还没有收藏文章" />
      ) : (
        <FlashList
          data={articles}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              onPress={() => navigation.navigate('Reader', { articleId: item.id })}
            />
          )}
          estimatedItemSize={100}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
  },
});
