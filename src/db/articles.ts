import { getDatabase } from './database';

export interface Article {
  id: number;
  feed_id: number;
  guid: string;
  title: string;
  summary: string;
  content: string | null;
  url: string;
  image_url: string;
  published_at: string;
  fetched_at: string;
  is_read: number;
  is_bookmarked: number;
  bookmarked_at: string | null;
  read_at: string | null;
}

export interface ArticleWithFeed extends Article {
  feed_title: string;
  feed_icon_url: string;
}

export async function getUnreadArticles(topicId?: number): Promise<ArticleWithFeed[]> {
  const db = getDatabase();
  if (topicId != null) {
    return db.getAllAsync<ArticleWithFeed>(
      `
      SELECT a.*, f.title AS feed_title, f.icon_url AS feed_icon_url
      FROM articles a
      JOIN feeds f ON a.feed_id = f.id
      WHERE a.is_read = 0 AND f.topic_id = ?
      ORDER BY a.published_at DESC
      `,
      [topicId],
    );
  }
  return db.getAllAsync<ArticleWithFeed>(
    `
    SELECT a.*, f.title AS feed_title, f.icon_url AS feed_icon_url
    FROM articles a
    JOIN feeds f ON a.feed_id = f.id
    WHERE a.is_read = 0
    ORDER BY a.published_at DESC
    `,
  );
}

export async function getArticlesByFeed(feedId: number): Promise<ArticleWithFeed[]> {
  const db = getDatabase();
  return db.getAllAsync<ArticleWithFeed>(
    `
    SELECT a.*, f.title AS feed_title, f.icon_url AS feed_icon_url
    FROM articles a
    JOIN feeds f ON a.feed_id = f.id
    WHERE a.feed_id = ?
    ORDER BY a.published_at DESC
    `,
    [feedId],
  );
}

export async function getBookmarkedArticles(searchQuery?: string): Promise<ArticleWithFeed[]> {
  const db = getDatabase();
  if (searchQuery) {
    const like = `%${searchQuery}%`;
    return db.getAllAsync<ArticleWithFeed>(
      `
      SELECT a.*, f.title AS feed_title, f.icon_url AS feed_icon_url
      FROM articles a
      JOIN feeds f ON a.feed_id = f.id
      WHERE a.is_bookmarked = 1
        AND (a.title LIKE ? OR a.content LIKE ?)
      ORDER BY a.bookmarked_at DESC
      `,
      [like, like],
    );
  }
  return db.getAllAsync<ArticleWithFeed>(
    `
    SELECT a.*, f.title AS feed_title, f.icon_url AS feed_icon_url
    FROM articles a
    JOIN feeds f ON a.feed_id = f.id
    WHERE a.is_bookmarked = 1
    ORDER BY a.bookmarked_at DESC
    `,
  );
}

export async function insertArticle(article: {
  feed_id: number;
  guid: string;
  title: string;
  summary?: string;
  content?: string;
  url?: string;
  image_url?: string;
  published_at?: string;
}): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO articles
      (feed_id, guid, title, summary, content, url, image_url, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      article.feed_id,
      article.guid,
      article.title,
      article.summary ?? '',
      article.content ?? null,
      article.url ?? '',
      article.image_url ?? '',
      article.published_at ?? new Date().toISOString(),
    ],
  );
  return result.lastInsertRowId;
}

export async function markAsRead(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync("UPDATE articles SET is_read = 1, read_at = datetime('now') WHERE id = ?", [id]);
}

export async function getRecentlyRead(limit: number = 50): Promise<ArticleWithFeed[]> {
  const db = getDatabase();
  return db.getAllAsync<ArticleWithFeed>(
    `SELECT a.*, f.title AS feed_title, f.icon_url AS feed_icon_url
     FROM articles a JOIN feeds f ON a.feed_id = f.id
     WHERE a.is_read = 1 AND a.read_at IS NOT NULL
     ORDER BY a.read_at DESC
     LIMIT ?`,
    [limit],
  );
}

export async function toggleBookmark(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `UPDATE articles SET
      is_bookmarked = CASE WHEN is_bookmarked = 1 THEN 0 ELSE 1 END,
      bookmarked_at = CASE WHEN is_bookmarked = 1 THEN NULL ELSE datetime('now') END
    WHERE id = ?`,
    [id],
  );
}

export async function removeBookmark(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE articles SET is_bookmarked = 0, bookmarked_at = NULL WHERE id = ?',
    [id],
  );
}

export async function cacheArticleContent(id: number, content: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE articles SET content = ? WHERE id = ?', [content, id]);
}

export async function cleanupOldArticles(daysToKeep: number = 7): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    `DELETE FROM articles
    WHERE is_bookmarked = 0
      AND fetched_at < datetime('now', '-' || ? || ' days')`,
    [daysToKeep],
  );
  return result.changes;
}

export async function getReadingStats(): Promise<{ today: number; week: number }> {
  const db = getDatabase();
  const todayResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM articles
    WHERE is_read = 1 AND published_at >= date('now')`,
  );
  const weekResult = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM articles
    WHERE is_read = 1 AND published_at >= date('now', '-7 days')`,
  );
  return {
    today: todayResult?.count ?? 0,
    week: weekResult?.count ?? 0,
  };
}
