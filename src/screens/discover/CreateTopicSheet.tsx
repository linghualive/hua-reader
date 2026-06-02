import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

const ICON_OPTIONS = [
  'folder', 'star', 'heart', 'bookmark', 'tag', 'lightbulb', 'school',
  'briefcase', 'chart-line', 'flask', 'palette', 'music', 'gamepad-variant',
  'food-apple', 'car', 'airplane', 'home', 'hospital-box', 'soccer',
  'dumbbell', 'camera', 'cellphone', 'earth', 'leaf', 'book-open-variant',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, icon: string) => void;
}

export function CreateTopicSheet({ visible, onClose, onCreate }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, selectedIcon);
    setName('');
    setSelectedIcon('folder');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.onSurface }]}>新建话题</Text>

          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>话题名称</Text>
          <TextInput
            style={[styles.input, { color: colors.onSurface, backgroundColor: colors.surfaceVariant, borderColor: colors.outline + '40' }]}
            placeholder="输入话题名称"
            placeholderTextColor={colors.onSurfaceVariant}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>选择图标</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: selectedIcon === icon ? colors.primary + '20' : colors.surfaceVariant,
                      borderColor: selectedIcon === icon ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={20}
                    color={selectedIcon === icon ? colors.primary : colors.onSurfaceVariant}
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Pressable
            onPress={handleCreate}
            disabled={!name.trim()}
            style={[styles.createBtn, { backgroundColor: name.trim() ? colors.primary : colors.surfaceVariant }]}
          >
            <Text style={[styles.createBtnText, { color: name.trim() ? colors.onPrimary : colors.onSurfaceVariant }]}>
              创建话题
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 12 },
  input: { fontSize: 15, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  iconScroll: { marginTop: 4, marginBottom: 16 },
  iconGrid: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  createBtn: { paddingVertical: 14, borderRadius: 24, alignItems: 'center', marginTop: 8 },
  createBtnText: { fontSize: 16, fontWeight: '600' },
});
