import { getAllFeeds, updateFeedLastFetched, type Feed } from '@/db/feeds';
import { insertArticle } from '@/db/articles';
import { getSetting } from '@/db/settings';
import { parseRssFeed } from './rss-parser';
import { DEFAULT_RSSHUB_URL } from './built-in-topics';

export interface SyncResult {
  feedId: number;
  feedTitle: string;
  newArticles: number;
  error?: string;
}

async function getRssHubBaseUrl(): Promise<string> {
  const custom = await getSetting('rsshub_url');
  return custom || DEFAULT_RSSHUB_URL;
}

function buildFeedUrl(feed: Feed, rsshubBaseUrl: string): string {
  if (feed.source_type === 'rsshub') {
    // RSSHub route: prepend the base URL
    return `${rsshubBaseUrl}${feed.url}`;
  }
  // Native RSS/Atom feed URL: use directly
  return feed.url;
}

export async function syncFeed(feed: Feed): Promise<SyncResult> {
  const rsshubBaseUrl = await getRssHubBaseUrl();
  const url = buildFeedUrl(feed, rsshubBaseUrl);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const xml = await response.text();
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

    return {
      feedId: feed.id,
      feedTitle: feed.title,
      newArticles,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      feedId: feed.id,
      feedTitle: feed.title,
      newArticles: 0,
      error: message,
    };
  }
}

export async function syncAllFeeds(): Promise<SyncResult[]> {
  const feeds = await getAllFeeds();
  const results: SyncResult[] = [];

  for (const feed of feeds) {
    const result = await syncFeed(feed);
    results.push(result);
  }

  return results;
}
