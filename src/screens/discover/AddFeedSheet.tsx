import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface AddFeedSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (url: string, title: string) => void;
}

export function AddFeedSheet({ visible, onClose, onAdd }: AddFeedSheetProps) {
  const { colors } = useTheme();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('请输入 RSS 地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(trimmedUrl);
      if (!response.ok) {
        setError(`请求失败: HTTP ${response.status}`);
        setLoading(false);
        return;
      }

      const text = await response.text();
      // Check if it looks like an RSS/Atom feed
      const hasRssTags =
        text.includes('<rss') ||
        text.includes('<feed') ||
        text.includes('<channel') ||
        text.includes('<rdf:RDF');

      if (!hasRssTags) {
        setError('该地址似乎不是有效的 RSS 源');
        setLoading(false);
        return;
      }

      // Extract title
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : trimmedUrl;

      onAdd(trimmedUrl, title);
      setUrl('');
      setError('');
      onClose();
    } catch (err) {
      setError('无法访问该地址，请检查 URL 是否正确');
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.onSurface }]}>添加 RSS 源</Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.onSurface,
                backgroundColor: colors.surfaceVariant,
                borderColor: error ? colors.error : colors.outline,
              },
            ]}
            placeholder="输入 RSS 地址..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          {error ? (
            <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          ) : null}

          <Pressable
            onPress={validate}
            disabled={loading}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>验证并添加</Text>
            )}
          </Pressable>
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
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  error: {
    fontSize: 13,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
