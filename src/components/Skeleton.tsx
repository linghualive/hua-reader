import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: any }) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius: 6, backgroundColor: colors.onSurfaceVariant, opacity: pulse }, style]}
    />
  );
}

export function ArticleSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.metaRow}>
        <SkeletonBlock width={60} height={12} />
        <SkeletonBlock width={40} height={12} />
      </View>
      <SkeletonBlock width="90%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="70%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="100%" height={14} />
    </View>
  );
}

export function ArticleListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <ArticleSkeleton key={i} />
      ))}
    </View>
  );
}

export function TopicGridSkeleton() {
  return (
    <View style={styles.topicGrid}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={styles.topicCard}>
          <SkeletonBlock width={36} height={36} style={{ borderRadius: 18 }} />
          <SkeletonBlock width={50} height={14} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 20, paddingVertical: 16 },
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  topicCard: { width: '30%', alignItems: 'center', paddingVertical: 14 },
});
