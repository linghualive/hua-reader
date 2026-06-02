import Constants from 'expo-constants';
import { Platform, Linking, Alert } from 'react-native';

const GITHUB_REPO = 'linghualive/hua-reader';
const RELEASES_APIS = [
  `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
  `https://ghproxy.net/https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
];

export interface ReleaseInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

export function getCurrentVersion(): string {
  return Constants.expoConfig?.version ?? Constants.manifest?.version ?? '0.0.0';
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
    const currentVersion = getCurrentVersion();
    console.log('[Updater] Current version:', currentVersion);

    let release: any = null;
    for (const api of RELEASES_APIS) {
      try {
        console.log('[Updater] Trying:', api);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(api, {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.ok) {
          release = await response.json();
          console.log('[Updater] Success from:', api);
          break;
        }
      } catch (e) {
        console.log('[Updater] Failed:', api, e instanceof Error ? e.message : '');
      }
    }
    if (!release) return null;

    const tagVersion = (release.tag_name ?? '').replace(/^v/, '');
    console.log('[Updater] Latest release:', tagVersion, 'Current:', currentVersion);
    if (compareVersions(tagVersion, currentVersion) <= 0) return null;

    const apkAsset = release.assets?.find((a: any) => a.name?.endsWith('.apk'));
    if (!apkAsset) return null;

    return {
      version: tagVersion,
      downloadUrl: apkAsset.browser_download_url,
      releaseNotes: release.body ?? '',
      publishedAt: release.published_at ?? '',
    };
  } catch (err) {
    console.log('[Updater] Error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function downloadAndInstallApk(url: string): Promise<void> {
  // Directly open the download URL in browser - browser handles download + install
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('无法打开下载链接', '请手动在浏览器中访问 GitHub Release 页面下载');
  }
}
