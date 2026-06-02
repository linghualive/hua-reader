import { getDatabase } from './database';

export interface Feed {
  id: number;
  title: string;
  url: string;
  source_type: string;
  topic_id: number;
  icon_url: string;
  last_fetched: string | null;
  created_at: string;
}

export interface FeedWithMeta extends Feed {
  topic_name: string;
  unread_count: number;
}

export async function getAllFeeds(): Promise<FeedWithMeta[]> {
  const db = getDatabase();
  return db.getAllAsync<FeedWithMeta>(`
    SELECT
      f.*,
      t.name AS topic_name,
      COALESCE(
        (SELECT COUNT(*) FROM articles a WHERE a.feed_id = f.id AND a.is_read = 0),
        0
      ) AS unread_count
    FROM feeds f
    JOIN topics t ON f.topic_id = t.id
    ORDER BY f.created_at ASC
  `);
}

export async function getFeedsByTopic(topicId: number): Promise<FeedWithMeta[]> {
  const db = getDatabase();
  return db.getAllAsync<FeedWithMeta>(
    `
    SELECT
      f.*,
      t.name AS topic_name,
      COALESCE(
        (SELECT COUNT(*) FROM articles a WHERE a.feed_id = f.id AND a.is_read = 0),
        0
      ) AS unread_count
    FROM feeds f
    JOIN topics t ON f.topic_id = t.id
    WHERE f.topic_id = ?
    ORDER BY f.created_at ASC
    `,
    [topicId],
  );
}

export async function insertFeed(
  title: string,
  url: string,
  topicId: number,
  sourceType: string = 'native',
): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT OR IGNORE INTO feeds (title, url, topic_id, source_type) VALUES (?, ?, ?, ?)',
    [title, url, topicId, sourceType],
  );
  return result.lastInsertRowId;
}

export async function deleteFeed(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM feeds WHERE id = ?', [id]);
}

export async function updateFeedLastFetched(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    "UPDATE feeds SET last_fetched = datetime('now') WHERE id = ?",
    [id],
  );
}
