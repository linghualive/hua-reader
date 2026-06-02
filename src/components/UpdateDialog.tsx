import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { type ReleaseInfo, downloadAndInstallApk } from '@/services/updater';

interface UpdateDialogProps {
  releaseInfo: ReleaseInfo;
  onDismiss: () => void;
}

export function UpdateDialog({ releaseInfo, onDismiss }: UpdateDialogProps) {
  const { colors } = useTheme();
  const [downloading, setDownloading] = useState(false);

  const handleUpdate = async () => {
    setDownloading(true);
    try {
      await downloadAndInstallApk(releaseInfo.downloadUrl);
    } catch {
      // Install flow interrupted or failed; let user retry
    }
    setDownloading(false);
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            发现新版本 v{releaseInfo.version}
          </Text>

          {releaseInfo.releaseNotes ? (
            <ScrollView style={styles.notesContainer}>
              <Text style={[styles.notes, { color: colors.onSurfaceVariant }]}>
                {releaseInfo.releaseNotes}
              </Text>
            </ScrollView>
          ) : null}

          <View style={styles.buttons}>
            <Pressable
              onPress={onDismiss}
              disabled={downloading}
              style={[styles.button, { backgroundColor: colors.surfaceVariant }]}
            >
              <Text style={[styles.buttonText, { color: colors.onSurfaceVariant }]}>
                稍后
              </Text>
            </Pressable>

            <Pressable
              onPress={handleUpdate}
              disabled={downloading}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              {downloading ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                  立即更新
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dialog: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    maxWidth: 360,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  notesContainer: {
    maxHeight: 180,
    marginBottom: 20,
  },
  notes: {
    fontSize: 14,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
