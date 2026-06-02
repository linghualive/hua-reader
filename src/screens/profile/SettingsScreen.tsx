import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { SEED_COLORS } from '@/theme/colors';
import { getSetting, setSetting } from '@/db/settings';
import { cleanupOldArticles } from '@/db/articles';
import type { ColorMode } from '@/theme/colors';

const MODE_OPTIONS: { label: string; mode: ColorMode }[] = [
  { label: '亮色', mode: 'light' },
  { label: '暗色', mode: 'dark' },
  { label: '纯黑', mode: 'amoled' },
];

export default function SettingsScreen() {
  const { colors, seedColor, setSeedColor, colorMode, setColorMode } = useTheme();
  const [rsshubUrl, setRsshubUrl] = useState('');

  useEffect(() => {
    getSetting('rsshub_url').then((url) => {
      setRsshubUrl(url || 'http://linghua.icu:1200');
    });
  }, []);

  const saveRsshubUrl = useCallback(async () => {
    const trimmed = rsshubUrl.trim();
    if (trimmed) {
      await setSetting('rsshub_url', trimmed);
      Alert.alert('已保存', 'RSSHub 地址已更新');
    }
  }, [rsshubUrl]);

  const handleCleanup = useCallback(async () => {
    const deleted = await cleanupOldArticles(7);
    Alert.alert('清理完成', `已清理 ${deleted} 篇旧文章`);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Theme Color */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>主题颜色</Text>
      <View style={styles.colorRow}>
        {SEED_COLORS.map((sc) => (
          <Pressable
            key={sc.name}
            onPress={() => setSeedColor(sc)}
            style={[
              styles.colorCircle,
              {
                backgroundColor: sc.primary,
                borderColor: seedColor.name === sc.name ? colors.onSurface : 'transparent',
                borderWidth: seedColor.name === sc.name ? 3 : 0,
              },
            ]}
          />
        ))}
      </View>

      {/* Display Mode */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>显示模式</Text>
      <View style={styles.modeRow}>
        {MODE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.mode}
            onPress={() => setColorMode(opt.mode)}
            style={[
              styles.modeButton,
              {
                backgroundColor:
                  colorMode === opt.mode ? colors.primary : colors.surfaceVariant,
                borderColor:
                  colorMode === opt.mode ? colors.primary : colors.outline + '40',
              },
            ]}
          >
            <Text
              style={[
                styles.modeLabel,
                {
                  color: colorMode === opt.mode ? colors.onPrimary : colors.onSurfaceVariant,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* RSSHub URL */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>RSSHub 地址</Text>
      <View style={styles.rsshubRow}>
        <TextInput
          style={[
            styles.rsshubInput,
            {
              color: colors.onSurface,
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.outline + '40',
            },
          ]}
          value={rsshubUrl}
          onChangeText={setRsshubUrl}
          placeholder="http://localhost:1200"
          placeholderTextColor={colors.onSurfaceVariant}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Pressable
          onPress={saveRsshubUrl}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.saveButtonText, { color: colors.onPrimary }]}>保存</Text>
        </Pressable>
      </View>

      {/* Storage */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>存储管理</Text>
      <Pressable
        onPress={handleCleanup}
        style={[
          styles.cleanupButton,
          { backgroundColor: colors.surfaceVariant, borderColor: colors.outline + '30' },
        ]}
      >
        <Text style={[styles.cleanupText, { color: colors.onSurface }]}>
          清理 7 天前的旧文章
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 14,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rsshubRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rsshubInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  saveButton: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cleanupButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cleanupText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
