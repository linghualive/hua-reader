import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/theme/ThemeContext';
import { READING_BG_OPTIONS, type ReadingPrefs } from '@/theme/reading';

interface TypographyPanelProps {
  visible: boolean;
  onClose: () => void;
  prefs: ReadingPrefs;
  onChangePrefs: (prefs: ReadingPrefs) => void;
}

export function TypographyPanel({ visible, onClose, prefs, onChangePrefs }: TypographyPanelProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.panel, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <Text style={[styles.label, { color: colors.onSurface }]}>
            字号: {Math.round(prefs.fontSize)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={14}
            maximumValue={24}
            step={1}
            value={prefs.fontSize}
            onValueChange={(v) => onChangePrefs({ ...prefs, fontSize: v })}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.outline}
            thumbTintColor={colors.primary}
          />

          <Text style={[styles.label, { color: colors.onSurface }]}>
            行距: {prefs.lineHeight.toFixed(1)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={1.4}
            maximumValue={2.0}
            step={0.1}
            value={prefs.lineHeight}
            onValueChange={(v) =>
              onChangePrefs({ ...prefs, lineHeight: Math.round(v * 10) / 10 })
            }
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.outline}
            thumbTintColor={colors.primary}
          />

          <Text style={[styles.label, { color: colors.onSurface }]}>背景</Text>
          <View style={styles.bgRow}>
            {READING_BG_OPTIONS.map((opt) => (
              <Pressable
                key={opt.backgroundColor}
                onPress={() => onChangePrefs({ ...prefs, backgroundColor: opt.backgroundColor })}
                style={[
                  styles.bgCircle,
                  {
                    backgroundColor: opt.backgroundColor,
                    borderColor:
                      prefs.backgroundColor === opt.backgroundColor
                        ? colors.primary
                        : colors.outline,
                    borderWidth: prefs.backgroundColor === opt.backgroundColor ? 3 : 1,
                  },
                ]}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  bgRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  bgCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
