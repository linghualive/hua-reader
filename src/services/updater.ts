import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
  const download = await FileSystem.downloadAsync(url, fileUri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: download.uri,
    type: 'application/vnd.android.package-archive',
    flags: 1,
  });
}
