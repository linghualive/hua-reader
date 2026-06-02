import { getAllFeeds, getFeedsByTopic, updateFeedLastFetched, type Feed } from '@/db/feeds';
import { insertArticle } from '@/db/articles';
import { getSetting } from '@/db/settings';
import { parseRssFeed } from './rss-parser';
import { DEFAULT_RSSHUB_URL } from './built-in-topics';

const PUBLIC_RSSHUB_INSTANCES = [
  'https://rsshub.rssforever.com',
  'https://rsshub.liumingye.cn',
  'https://rsshub.ktachibana.party',
];

export interface SyncResult {
  feedId: number;
  feedTitle: string;
  newArticles: number;
  error?: string;
}

// Track last sync time per topic to avoid re-syncing within 10 minutes
const lastSyncByTopic = new Map<number, number>();
const STALE_TIME = 10 * 60 * 1000;

let instanceIndex = 0;

function getNextInstance(instances: string[]): string {
  const inst = instances[instanceIndex % instances.length];
  instanceIndex++;
  return inst;
}

async function getInstances(): Promise<string[]> {
  const custom = await getSetting('rsshub_url');
  return [custom || DEFAULT_RSSHUB_URL, ...PUBLIC_RSSHUB_INSTANCES];
}

function buildFeedUrl(feed: Feed, baseUrl: string): string {
  if (feed.source_type === 'rsshub') return `${baseUrl}${feed.url}`;
  return feed.url;
}

async function fetchWithTimeout(url: string, timeoutMs: number = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFeedXml(feed: Feed, instances: string[]): Promise<string> {
  if (feed.source_type !== 'rsshub') {
    const resp = await fetchWithTimeout(feed.url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.text();
  }

  const errors: string[] = [];
  for (let i = 0; i < instances.length; i++) {
    const inst = getNextInstance(instances);
    try {
      const resp = await fetchWithTimeout(buildFeedUrl(feed, inst));
      if (resp.ok) return resp.text();
      errors.push(`${inst}: ${resp.status}`);
    } catch (err: any) {
      errors.push(`${inst}: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
    }
  }
  throw new Error(errors.join('; '));
}

async function syncSingleFeed(feed: Feed, instances: string[]): Promise<SyncResult> {
  try {
    const xml = await fetchFeedXml(feed, instances);
    const parsed = parseRssFeed(xml);

    let newArticles = 0;
    for (const item of parsed.items) {
      const id = await insertArticle({
        feed_id: feed.id,
        guid: item.guid,
        title: item.title,
        summary: item.summary,
        content: item.content,
        url: item.url,
        image_url: item.imageUrl,
        published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
      });
      if (id > 0) newArticles++;
    }

    await updateFeedLastFetched(feed.id);
    return { feedId: feed.id, feedTitle: feed.title, newArticles };
  } catch (err) {
    return { feedId: feed.id, feedTitle: feed.title, newArticles: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function syncFeedsByTopic(topicId: number, force: boolean = false): Promise<SyncResult[]> {
  if (!force) {
    const lastSync = lastSyncByTopic.get(topicId);
    if (lastSync && Date.now() - lastSync < STALE_TIME) return [];
  }

  const feeds = await getFeedsByTopic(topicId);
  const instances = await getInstances();
  const results: SyncResult[] = [];

  const batchSize = 3;
  for (let i = 0; i < feeds.length; i += batchSize) {
    const batch = feeds.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((f) => syncSingleFeed(f, instances)));
    results.push(...batchResults);
  }

  lastSyncByTopic.set(topicId, Date.now());
  return results;
}

export async function syncAllFeeds(force: boolean = false): Promise<SyncResult[]> {
  const feeds = await getAllFeeds();
  const instances = await getInstances();
  const results: SyncResult[] = [];

  const batchSize = 3;
  for (let i = 0; i < feeds.length; i += batchSize) {
    const batch = feeds.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((f) => syncSingleFeed(f, instances)));
    results.push(...batchResults);
  }

  return results;
}
