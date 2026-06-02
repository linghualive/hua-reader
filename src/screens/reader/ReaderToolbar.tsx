import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/ThemeContext';

interface ReaderToolbarProps {
  progress: number;
  onToggleTypography: () => void;
  onToggleNightMode: () => void;
  isNightMode: boolean;
}

export function ReaderToolbar({
  progress,
  onToggleTypography,
  onToggleNightMode,
  isNightMode,
}: ReaderToolbarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.toolbar, { backgroundColor: colors.surface, borderTopColor: colors.outline + '40' }]}>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.primary, width: `${progress}%` },
          ]}
        />
      </View>
      <View style={styles.controls}>
        <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
          {progress}%
        </Text>
        <View style={styles.buttons}>
          <Pressable onPress={onToggleTypography} hitSlop={12} style={styles.button}>
            <Text style={[styles.aaButton, { color: colors.onSurface }]}>Aa</Text>
          </Pressable>
          <Pressable onPress={onToggleNightMode} hitSlop={12} style={styles.button}>
            <MaterialCommunityIcons
              name={isNightMode ? 'weather-sunny' : 'weather-night'}
              size={22}
              color={colors.onSurface}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  progressBarContainer: {
    height: 2,
    width: '100%',
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 28,
  },
  progressText: {
    fontSize: 13,
  },
  buttons: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  button: {
    padding: 4,
  },
  aaButton: {
    fontSize: 18,
    fontWeight: '600',
  },
});
