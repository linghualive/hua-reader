import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeContext';
import { getReadingStats } from '@/db/articles';
import type { RootStackParamList } from '@/app/Navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.outline + '20',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon as any} size={22} color={colors.onSurfaceVariant} />
      <Text style={[styles.menuLabel, { color: colors.onSurface }]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const [stats, setStats] = useState({ today: 0, week: 0 });

  useFocusEffect(
    useCallback(() => {
      getReadingStats().then(setStats);
    }, []),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statsTitle, { color: colors.onSurface }]}>阅读统计</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.today}</Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>今日已读</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.outline + '30' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.week}</Text>
              <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>本周已读</Text>
            </View>
          </View>
        </View>

        {/* Menu List */}
        <View style={styles.menuGroup}>
          <MenuItem
            icon="star-outline"
            label="我的收藏"
            onPress={() => navigation.navigate('Bookmarks')}
          />
          <MenuItem
            icon="rss"
            label="订阅源管理"
            onPress={() => navigation.navigate('FeedManager')}
          />
          <MenuItem
            icon="cog-outline"
            label="设置"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  menuGroup: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
