import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { Platform, Alert, Linking } from 'react-native';

const GITHUB_REPO = 'linghualive/hua-reader';
const RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export interface ReleaseInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

export function getCurrentVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function checkForUpdate(): Promise<ReleaseInfo | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const response = await fetch(RELEASES_API, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    if (!response.ok) return null;
    const release = await response.json();
    const tagVersion = (release.tag_name ?? '').replace(/^v/, '');
    const currentVersion = getCurrentVersion();
    if (compareVersions(tagVersion, currentVersion) <= 0) return null;
    const apkAsset = release.assets?.find((a: any) => a.name?.endsWith('.apk'));
    if (!apkAsset) return null;
    return {
      version: tagVersion,
      downloadUrl: apkAsset.browser_download_url,
      releaseNotes: release.body ?? '',
      publishedAt: release.published_at ?? '',
    };
  } catch {
    return null;
  }
}

export async function downloadAndInstallApk(url: string): Promise<void> {
  const fileUri = FileSystem.cacheDirectory + 'hua-reader-update.apk';

  const callback = (progress: FileSystem.DownloadProgressData) => {
    const pct = Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100);
    // Could emit progress here if needed
  };

  const downloadResumable = FileSystem.createDownloadResumable(url, fileUri, {}, callback);
  const result = await downloadResumable.downloadAsync();

  if (!result?.uri) {
    Alert.alert('下载失败', '请稍后重试');
    return;
  }

  // Use Sharing to open the APK file - this triggers Android's package installer
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/vnd.android.package-archive',
      dialogTitle: '安装更新',
    });
  } else {
    // Fallback: open the download URL in browser
    Alert.alert(
      '下载完成',
      '无法自动安装，是否在浏览器中下载？',
      [
        { text: '取消' },
        { text: '打开浏览器', onPress: () => Linking.openURL(url) },
      ]
    );
  }
}
