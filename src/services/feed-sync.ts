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

let instanceIndex = 0;

function getNextInstance(instances: string[]): string {
  const instance = instances[instanceIndex % instances.length];
  instanceIndex++;
  return instance;
}

async function getInstances(): Promise<string[]> {
  const custom = await getSetting('rsshub_url');
  const primary = custom || DEFAULT_RSSHUB_URL;
  return [primary, ...PUBLIC_RSSHUB_INSTANCES];
}

function buildFeedUrl(feed: Feed, baseUrl: string): string {
  if (feed.source_type === 'rsshub') {
    return `${baseUrl}${feed.url}`;
  }
  return feed.url;
}

async function fetchWithTimeout(url: string, timeoutMs: number = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithFailover(feed: Feed, instances: string[]): Promise<string> {
  if (feed.source_type !== 'rsshub') {
    const response = await fetchWithTimeout(feed.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }

  const errors: string[] = [];
  for (let attempt = 0; attempt < instances.length; attempt++) {
    const instance = getNextInstance(instances);
    const url = buildFeedUrl(feed, instance);
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) return response.text();
      errors.push(`${instance}: HTTP ${response.status}`);
    } catch (err: any) {
      errors.push(`${instance}: ${err.name === 'AbortError' ? 'timeout' : err.message}`);
    }
  }
  throw new Error(errors.join('; '));
}

export async function syncFeed(feed: Feed, instances: string[]): Promise<SyncResult> {
  try {
    const xml = await fetchWithFailover(feed, instances);
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
        published_at: item.publishedAt
          ? new Date(item.publishedAt).toISOString()
          : new Date().toISOString(),
      });
      if (id > 0) newArticles++;
    }

    await updateFeedLastFetched(feed.id);
    return { feedId: feed.id, feedTitle: feed.title, newArticles };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { feedId: feed.id, feedTitle: feed.title, newArticles: 0, error: message };
  }
}

export async function syncFeedsByTopic(topicId: number): Promise<SyncResult[]> {
  const feeds = await getFeedsByTopic(topicId);
  const instances = await getInstances();
  const results: SyncResult[] = [];

  const batchSize = 3;
  for (let i = 0; i < feeds.length; i += batchSize) {
    const batch = feeds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((feed) => syncFeed(feed, instances))
    );
    results.push(...batchResults);
  }

  return results;
}

export async function syncAllFeeds(): Promise<SyncResult[]> {
  const feeds = await getAllFeeds();
  const instances = await getInstances();
  const results: SyncResult[] = [];

  const batchSize = 3;
  for (let i = 0; i < feeds.length; i += batchSize) {
    const batch = feeds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((feed) => syncFeed(feed, instances))
    );
    results.push(...batchResults);
  }

  return results;
}
