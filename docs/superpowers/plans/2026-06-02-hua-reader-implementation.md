# Hua Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an immersive Android RSS reader app with TikTok-style article browsing, full-text reading, topic-based subscriptions, and Material Design 3 theming.

**Architecture:** Expo-managed React Native app. SQLite for local persistence. All RSS fetching and parsing happens on-device — the only external dependency is a self-hosted RSSHub instance. Articles are rendered in a WebView with injected CSS that mirrors the app's theme, so reading feels native rather than web-embedded.

**Tech Stack:** Expo SDK 53, React Native, React Native Paper (MD3), React Navigation 7, expo-sqlite, react-native-webview, react-native-pager-view, @shopify/flash-list, fast-xml-parser, @mozilla/readability

---

## File Structure

```
hua-reader/
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Root: wraps Providers → Navigation
│   │   ├── Providers.tsx           # ThemeProvider + DatabaseProvider
│   │   └── Navigation.tsx          # Bottom tabs + stack screens
│   ├── theme/
│   │   ├── ThemeContext.tsx         # Theme state, seed color switching, dark mode
│   │   ├── colors.ts               # 6 seed colors → MD3 palette generation
│   │   └── reading.ts              # Reading-specific prefs (fontSize, lineHeight, bgColor)
│   ├── db/
│   │   ├── database.ts             # SQLite init, schema creation, migrations
│   │   ├── topics.ts               # topics table CRUD
│   │   ├── feeds.ts                # feeds table CRUD
│   │   ├── articles.ts             # articles table CRUD + 7-day cleanup + bookmark ops
│   │   └── settings.ts             # key-value settings store
│   ├── services/
│   │   ├── rss-parser.ts           # Parse RSS 2.0 / Atom XML → normalized article objects
│   │   ├── feed-sync.ts            # Fetch all feeds, dedupe by guid, insert new articles
│   │   ├── readability.ts          # Extract full text from URL via Readability
│   │   ├── article-html.ts         # Generate themed HTML string for WebView rendering
│   │   ├── opml.ts                 # OPML import (parse XML → feeds) and export (feeds → XML)
│   │   └── built-in-topics.ts      # Static mapping: topic name → array of feed URLs/routes
│   ├── screens/
│   │   ├── home/
│   │   │   ├── HomeScreen.tsx      # Container: mode toggle + TopicFilter header
│   │   │   ├── SwipeMode.tsx       # PagerView vertical swipe, renders SwipeCards
│   │   │   ├── SwipeCard.tsx       # Full-screen article preview card
│   │   │   ├── ListMode.tsx        # FlashList of ArticleCards with topic tabs
│   │   │   └── ArticleCard.tsx     # Compact card for list mode
│   │   ├── reader/
│   │   │   ├── ReaderScreen.tsx    # Full article: header + WebView + toolbar
│   │   │   ├── ReaderToolbar.tsx   # Bottom bar: progress, Aa, night mode
│   │   │   └── TypographyPanel.tsx # Bottom sheet: font size, line height, bg color
│   │   ├── discover/
│   │   │   ├── DiscoverScreen.tsx  # Container: TopicGrid + AddFeed + OPML buttons
│   │   │   ├── TopicGrid.tsx       # Grid of topic cards
│   │   │   ├── TopicDetail.tsx     # Expanded: individual feed toggles within a topic
│   │   │   └── AddFeedSheet.tsx    # Bottom sheet: paste URL, validate, assign topic
│   │   └── profile/
│   │       ├── ProfileScreen.tsx   # Container: stats summary + menu list
│   │       ├── BookmarksScreen.tsx  # Bookmarked articles list with search
│   │       ├── FeedManagerScreen.tsx # All feeds grouped by topic, swipe delete, reorder
│   │       └── SettingsScreen.tsx  # Theme color, display mode, RSSHub URL, storage
│   ├── components/
│   │   ├── EmptyState.tsx          # Reusable empty state with icon + message + action
│   │   └── SwipeableRow.tsx        # Left-swipe to reveal action button
│   └── utils/
│       ├── time.ts                 # relativeTime(date): "2小时前", "昨天" etc.
│       └── reading-time.ts         # estimateReadingTime(text): "3 分钟"
├── __tests__/
│   ├── db/
│   │   ├── database.test.ts
│   │   ├── articles.test.ts
│   │   └── feeds.test.ts
│   ├── services/
│   │   ├── rss-parser.test.ts
│   │   ├── feed-sync.test.ts
│   │   ├── opml.test.ts
│   │   └── article-html.test.ts
│   └── utils/
│       ├── time.test.ts
│       └── reading-time.test.ts
├── assets/
│   └── topic-icons/                # SVG icons for built-in topics
├── app.json
├── package.json
├── tsconfig.json
└── docs/
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `hua-reader/` (Expo project root)
- Create: `src/app/App.tsx`
- Modify: `app.json`, `package.json`, `tsconfig.json`

- [ ] **Step 1: Initialize Expo project**

```bash
cd /Users/linghua
npx create-expo-app@latest hua-reader --template blank-typescript
```

- [ ] **Step 2: Install core dependencies**

```bash
cd /Users/linghua/hua-reader
npx expo install react-native-paper react-native-safe-area-context react-native-vector-icons
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-gesture-handler react-native-reanimated
npx expo install expo-sqlite react-native-webview react-native-pager-view
npx expo install @shopify/flash-list expo-file-system expo-document-picker expo-sharing expo-haptics
npm install fast-xml-parser @mozilla/readability linkedom
npm install -D @types/jest jest
```

- [ ] **Step 3: Create source directory structure**

```bash
mkdir -p src/{app,theme,db,services,screens/{home,reader,discover,profile},components,utils}
mkdir -p __tests__/{db,services,utils}
mkdir -p assets/topic-icons
```

- [ ] **Step 4: Configure path aliases in tsconfig.json**

Replace `tsconfig.json` contents:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 5: Create minimal App entry point**

Create `src/app/App.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Hua Reader</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
```

Update the root `App.tsx` (or `app/_layout.tsx` depending on Expo template) to import from `src/app/App.tsx`.

- [ ] **Step 6: Verify the app builds and runs on Android**

```bash
npx expo start --android
```

Expected: App launches on Android emulator/device showing "Hua Reader" centered text.

- [ ] **Step 7: Commit**

```bash
git init
echo "node_modules/\n.expo/\nandroid/\nios/\n*.log" > .gitignore
git add .
git commit -m "chore: scaffold Expo project with all dependencies"
```

---

## Task 2: Utility Functions

**Files:**
- Create: `src/utils/time.ts`
- Create: `src/utils/reading-time.ts`
- Test: `__tests__/utils/time.test.ts`
- Test: `__tests__/utils/reading-time.test.ts`

- [ ] **Step 1: Write failing test for relativeTime**

Create `__tests__/utils/time.test.ts`:

```ts
import { relativeTime } from '@/utils/time';

describe('relativeTime', () => {
  const now = new Date('2026-06-02T12:00:00Z');

  it('shows "刚刚" for times within 1 minute', () => {
    const date = new Date('2026-06-02T11:59:30Z');
    expect(relativeTime(date, now)).toBe('刚刚');
  });

  it('shows minutes for times within 1 hour', () => {
    const date = new Date('2026-06-02T11:30:00Z');
    expect(relativeTime(date, now)).toBe('30分钟前');
  });

  it('shows hours for times within 24 hours', () => {
    const date = new Date('2026-06-02T09:00:00Z');
    expect(relativeTime(date, now)).toBe('3小时前');
  });

  it('shows "昨天" for yesterday', () => {
    const date = new Date('2026-06-01T15:00:00Z');
    expect(relativeTime(date, now)).toBe('昨天');
  });

  it('shows date for older times', () => {
    const date = new Date('2026-05-20T12:00:00Z');
    expect(relativeTime(date, now)).toBe('05-20');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/utils/time.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement relativeTime**

Create `src/utils/time.ts`:

```ts
export function relativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHr < 24) return `${diffHr}小时前`;
  if (diffDay < 2) return '昨天';

  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/utils/time.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Write failing test for estimateReadingTime**

Create `__tests__/utils/reading-time.test.ts`:

```ts
import { estimateReadingTime } from '@/utils/reading-time';

describe('estimateReadingTime', () => {
  it('returns "1 分钟" for short text', () => {
    const text = '测试'.repeat(100); // 200 chars ≈ 100 words CN
    expect(estimateReadingTime(text)).toBe('1 分钟');
  });

  it('returns correct minutes for longer text', () => {
    const text = '测试文字内容'.repeat(500); // ~3000 chars
    expect(estimateReadingTime(text)).toBe('5 分钟');
  });

  it('returns "1 分钟" for empty text', () => {
    expect(estimateReadingTime('')).toBe('1 分钟');
  });
});
```

- [ ] **Step 6: Implement estimateReadingTime**

Create `src/utils/reading-time.ts`:

```ts
const CN_CHARS_PER_MINUTE = 600;

export function estimateReadingTime(text: string): string {
  if (!text) return '1 分钟';
  const charCount = text.replace(/\s/g, '').length;
  const minutes = Math.max(1, Math.ceil(charCount / CN_CHARS_PER_MINUTE));
  return `${minutes} 分钟`;
}
```

- [ ] **Step 7: Run all util tests**

```bash
npx jest __tests__/utils/
```

Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/utils/ __tests__/utils/
git commit -m "feat: add relativeTime and estimateReadingTime utilities"
```

---

## Task 3: Database Layer — Schema and Init

**Files:**
- Create: `src/db/database.ts`
- Test: `__tests__/db/database.test.ts`

- [ ] **Step 1: Write failing test for database initialization**

Create `__tests__/db/database.test.ts`:

```ts
import { initDatabase, getDatabase } from '@/db/database';

describe('database', () => {
  beforeEach(async () => {
    await initDatabase(':memory:');
  });

  it('creates all required tables', async () => {
    const db = getDatabase();
    const result = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const names = result.map((r) => r.name);
    expect(names).toContain('topics');
    expect(names).toContain('feeds');
    expect(names).toContain('articles');
    expect(names).toContain('settings');
  });
});
```

- [ ] **Step 2: Implement database.ts**

Create `src/db/database.ts`:

```ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export async function initDatabase(name: string = 'hua-reader.db'): Promise<void> {
  db = await SQLite.openDatabaseAsync(name);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_builtin INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      source_type TEXT NOT NULL DEFAULT 'native',
      topic_id INTEGER NOT NULL,
      icon_url TEXT NOT NULL DEFAULT '',
      last_fetched TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_id INTEGER NOT NULL,
      guid TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      content TEXT,
      url TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      published_at TEXT NOT NULL DEFAULT (datetime('now')),
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_read INTEGER NOT NULL DEFAULT 0,
      is_bookmarked INTEGER NOT NULL DEFAULT 0,
      bookmarked_at TEXT,
      FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE,
      UNIQUE(feed_id, guid)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_articles_feed ON articles(feed_id);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_bookmarked ON articles(is_bookmarked);
    CREATE INDEX IF NOT EXISTS idx_feeds_topic ON feeds(topic_id);
  `);
}
```

- [ ] **Step 3: Run test**

```bash
npx jest __tests__/db/database.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/db/database.ts __tests__/db/database.test.ts
git commit -m "feat: SQLite schema with topics, feeds, articles, settings tables"
```

---

## Task 4: Database Layer — Topics and Feeds CRUD

**Files:**
- Create: `src/db/topics.ts`
- Create: `src/db/feeds.ts`
- Test: `__tests__/db/feeds.test.ts`

- [ ] **Step 1: Implement topics CRUD**

Create `src/db/topics.ts`:

```ts
import { getDatabase } from './database';

export interface Topic {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  is_builtin: number;
}

export async function getAllTopics(): Promise<Topic[]> {
  const db = getDatabase();
  return db.getAllAsync<Topic>('SELECT * FROM topics ORDER BY sort_order ASC');
}

export async function insertTopic(name: string, icon: string, isBuiltin: boolean): Promise<number> {
  const db = getDatabase();
  const maxOrder = await db.getFirstAsync<{ m: number }>('SELECT COALESCE(MAX(sort_order),0) as m FROM topics');
  const result = await db.runAsync(
    'INSERT INTO topics (name, icon, sort_order, is_builtin) VALUES (?, ?, ?, ?)',
    name, icon, (maxOrder?.m ?? 0) + 1, isBuiltin ? 1 : 0
  );
  return result.lastInsertRowId;
}

export async function deleteTopic(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM topics WHERE id = ?', id);
}
```

- [ ] **Step 2: Implement feeds CRUD**

Create `src/db/feeds.ts`:

```ts
import { getDatabase } from './database';

export interface Feed {
  id: number;
  title: string;
  url: string;
  source_type: 'rsshub' | 'native';
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
    SELECT f.*, t.name as topic_name,
      (SELECT COUNT(*) FROM articles a WHERE a.feed_id = f.id AND a.is_read = 0) as unread_count
    FROM feeds f
    JOIN topics t ON f.topic_id = t.id
    ORDER BY t.sort_order, f.title
  `);
}

export async function getFeedsByTopic(topicId: number): Promise<Feed[]> {
  const db = getDatabase();
  return db.getAllAsync<Feed>('SELECT * FROM feeds WHERE topic_id = ? ORDER BY title', topicId);
}

export async function insertFeed(
  title: string, url: string, sourceType: 'rsshub' | 'native', topicId: number
): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    'INSERT OR IGNORE INTO feeds (title, url, source_type, topic_id) VALUES (?, ?, ?, ?)',
    title, url, sourceType, topicId
  );
  return result.lastInsertRowId;
}

export async function deleteFeed(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('DELETE FROM feeds WHERE id = ?', id);
}

export async function updateFeedLastFetched(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync("UPDATE feeds SET last_fetched = datetime('now') WHERE id = ?", id);
}
```

- [ ] **Step 3: Write test for feeds CRUD**

Create `__tests__/db/feeds.test.ts`:

```ts
import { initDatabase } from '@/db/database';
import { insertTopic } from '@/db/topics';
import { insertFeed, getAllFeeds, deleteFeed } from '@/db/feeds';

describe('feeds CRUD', () => {
  beforeEach(async () => {
    await initDatabase(':memory:');
  });

  it('inserts and retrieves feeds with topic name', async () => {
    const topicId = await insertTopic('财经', 'cash', true);
    await insertFeed('36氪快讯', '/36kr/newsflashes', 'rsshub', topicId);
    const feeds = await getAllFeeds();
    expect(feeds).toHaveLength(1);
    expect(feeds[0].title).toBe('36氪快讯');
    expect(feeds[0].topic_name).toBe('财经');
    expect(feeds[0].unread_count).toBe(0);
  });

  it('ignores duplicate feed URLs', async () => {
    const topicId = await insertTopic('科技', 'cpu', true);
    await insertFeed('少数派', 'https://sspai.com/feed', 'native', topicId);
    await insertFeed('少数派', 'https://sspai.com/feed', 'native', topicId);
    const feeds = await getAllFeeds();
    expect(feeds).toHaveLength(1);
  });

  it('deletes a feed and its articles', async () => {
    const topicId = await insertTopic('科技', 'cpu', true);
    const feedId = await insertFeed('Test', 'http://test.com/rss', 'native', topicId);
    await deleteFeed(feedId);
    const feeds = await getAllFeeds();
    expect(feeds).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/db/feeds.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/topics.ts src/db/feeds.ts __tests__/db/
git commit -m "feat: topics and feeds CRUD with deduplication"
```

---

## Task 5: Database Layer — Articles CRUD and Lifecycle

**Files:**
- Create: `src/db/articles.ts`
- Create: `src/db/settings.ts`
- Test: `__tests__/db/articles.test.ts`

- [ ] **Step 1: Implement articles CRUD**

Create `src/db/articles.ts`:

```ts
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
}

export interface ArticleWithFeed extends Article {
  feed_title: string;
  feed_icon_url: string;
  topic_id: number;
}

export async function getUnreadArticles(topicId?: number): Promise<ArticleWithFeed[]> {
  const db = getDatabase();
  const where = topicId ? 'AND f.topic_id = ?' : '';
  const params = topicId ? [topicId] : [];
  return db.getAllAsync<ArticleWithFeed>(`
    SELECT a.*, f.title as feed_title, f.icon_url as feed_icon_url, f.topic_id
    FROM articles a
    JOIN feeds f ON a.feed_id = f.id
    WHERE a.is_read = 0 ${where}
    ORDER BY a.published_at DESC
  `, ...params);
}

export async function getArticlesByFeed(feedId: number): Promise<Article[]> {
  const db = getDatabase();
  return db.getAllAsync<Article>(
    'SELECT * FROM articles WHERE feed_id = ? ORDER BY published_at DESC', feedId
  );
}

export async function getBookmarkedArticles(searchQuery?: string): Promise<ArticleWithFeed[]> {
  const db = getDatabase();
  if (searchQuery) {
    const like = `%${searchQuery}%`;
    return db.getAllAsync<ArticleWithFeed>(`
      SELECT a.*, f.title as feed_title, f.icon_url as feed_icon_url, f.topic_id
      FROM articles a JOIN feeds f ON a.feed_id = f.id
      WHERE a.is_bookmarked = 1 AND (a.title LIKE ? OR a.content LIKE ?)
      ORDER BY a.bookmarked_at DESC
    `, like, like);
  }
  return db.getAllAsync<ArticleWithFeed>(`
    SELECT a.*, f.title as feed_title, f.icon_url as feed_icon_url, f.topic_id
    FROM articles a JOIN feeds f ON a.feed_id = f.id
    WHERE a.is_bookmarked = 1
    ORDER BY a.bookmarked_at DESC
  `);
}

export async function insertArticle(
  feedId: number, guid: string, title: string, summary: string,
  url: string, imageUrl: string, publishedAt: string, content?: string
): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO articles (feed_id, guid, title, summary, url, image_url, published_at, content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    feedId, guid, title, summary, url, imageUrl, publishedAt, content ?? null
  );
  return result.lastInsertRowId;
}

export async function markAsRead(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE articles SET is_read = 1 WHERE id = ?', id);
}

export async function toggleBookmark(id: number): Promise<boolean> {
  const db = getDatabase();
  const article = await db.getFirstAsync<{ is_bookmarked: number }>(
    'SELECT is_bookmarked FROM articles WHERE id = ?', id
  );
  if (!article) return false;
  const newState = article.is_bookmarked ? 0 : 1;
  const bookmarkedAt = newState ? new Date().toISOString() : null;
  await db.runAsync(
    'UPDATE articles SET is_bookmarked = ?, bookmarked_at = ? WHERE id = ?',
    newState, bookmarkedAt, id
  );
  return !!newState;
}

export async function cacheArticleContent(id: number, content: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync('UPDATE articles SET content = ? WHERE id = ?', content, id);
}

export async function cleanupOldArticles(daysToKeep: number = 7): Promise<number> {
  const db = getDatabase();
  const result = await db.runAsync(
    `DELETE FROM articles
     WHERE is_bookmarked = 0
     AND fetched_at < datetime('now', '-' || ? || ' days')`,
    daysToKeep
  );
  return result.changes;
}

export async function removeBookmark(id: number): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'UPDATE articles SET is_bookmarked = 0, bookmarked_at = NULL WHERE id = ?', id
  );
}

export async function getReadingStats(): Promise<{ today: number; week: number }> {
  const db = getDatabase();
  const today = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM articles WHERE is_read = 1 AND date(fetched_at) = date('now')"
  );
  const week = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM articles WHERE is_read = 1 AND fetched_at >= datetime('now', '-7 days')"
  );
  return { today: today?.c ?? 0, week: week?.c ?? 0 };
}
```

- [ ] **Step 2: Implement settings store**

Create `src/db/settings.ts`:

```ts
import { getDatabase } from './database';

export async function getSetting(key: string): Promise<string | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    key, value, value
  );
}
```

- [ ] **Step 3: Write tests for articles lifecycle**

Create `__tests__/db/articles.test.ts`:

```ts
import { initDatabase } from '@/db/database';
import { insertTopic } from '@/db/topics';
import { insertFeed } from '@/db/feeds';
import {
  insertArticle, getUnreadArticles, markAsRead, toggleBookmark,
  getBookmarkedArticles, cleanupOldArticles
} from '@/db/articles';

describe('articles lifecycle', () => {
  let feedId: number;

  beforeEach(async () => {
    await initDatabase(':memory:');
    const topicId = await insertTopic('科技', 'cpu', true);
    feedId = await insertFeed('Test Feed', 'http://test.com/rss', 'native', topicId);
  });

  it('inserts and retrieves unread articles', async () => {
    await insertArticle(feedId, 'guid-1', 'Title 1', 'Summary', 'http://a.com', '', '2026-06-02');
    const articles = await getUnreadArticles();
    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe('Title 1');
    expect(articles[0].feed_title).toBe('Test Feed');
  });

  it('deduplicates by feed_id + guid', async () => {
    await insertArticle(feedId, 'guid-1', 'Title 1', '', 'http://a.com', '', '2026-06-02');
    await insertArticle(feedId, 'guid-1', 'Title 1 Updated', '', 'http://a.com', '', '2026-06-02');
    const articles = await getUnreadArticles();
    expect(articles).toHaveLength(1);
  });

  it('marks article as read and excludes from unread', async () => {
    await insertArticle(feedId, 'guid-1', 'Title', '', 'http://a.com', '', '2026-06-02');
    const articles = await getUnreadArticles();
    await markAsRead(articles[0].id);
    const unread = await getUnreadArticles();
    expect(unread).toHaveLength(0);
  });

  it('toggles bookmark and retrieves bookmarked articles', async () => {
    await insertArticle(feedId, 'guid-1', 'Title', '', 'http://a.com', '', '2026-06-02');
    const articles = await getUnreadArticles();
    const isNowBookmarked = await toggleBookmark(articles[0].id);
    expect(isNowBookmarked).toBe(true);
    const bookmarked = await getBookmarkedArticles();
    expect(bookmarked).toHaveLength(1);
  });

  it('cleanup removes old non-bookmarked articles', async () => {
    const db = (await import('@/db/database')).getDatabase();
    await db.runAsync(
      `INSERT INTO articles (feed_id, guid, title, url, fetched_at)
       VALUES (?, 'old-guid', 'Old Article', 'http://old.com', datetime('now', '-10 days'))`,
      feedId
    );
    await insertArticle(feedId, 'new-guid', 'New Article', '', 'http://new.com', '', '2026-06-02');
    const deleted = await cleanupOldArticles(7);
    expect(deleted).toBe(1);
    const remaining = await getUnreadArticles();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('New Article');
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/db/articles.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/articles.ts src/db/settings.ts __tests__/db/articles.test.ts
git commit -m "feat: articles CRUD with 7-day cleanup and bookmark persistence"
```

---

## Task 6: RSS Parser Service

**Files:**
- Create: `src/services/rss-parser.ts`
- Test: `__tests__/services/rss-parser.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/services/rss-parser.test.ts`:

```ts
import { parseRssFeed } from '@/services/rss-parser';

const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://test.com</link>
    <item>
      <title>Article One</title>
      <description>Summary of article one</description>
      <link>https://test.com/1</link>
      <guid>guid-001</guid>
      <pubDate>Mon, 02 Jun 2026 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Article Two</title>
      <description><![CDATA[<p>HTML summary</p>]]></description>
      <link>https://test.com/2</link>
      <guid>guid-002</guid>
      <pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const ATOM_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <entry>
    <title>Atom Article</title>
    <summary>Atom summary</summary>
    <link href="https://atom.com/1" />
    <id>atom-001</id>
    <updated>2026-06-02T12:00:00Z</updated>
  </entry>
</feed>`;

describe('parseRssFeed', () => {
  it('parses RSS 2.0 feed', () => {
    const result = parseRssFeed(RSS_SAMPLE);
    expect(result.title).toBe('Test Feed');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe('Article One');
    expect(result.items[0].guid).toBe('guid-001');
    expect(result.items[0].summary).toBe('Summary of article one');
    expect(result.items[0].url).toBe('https://test.com/1');
  });

  it('strips HTML from description', () => {
    const result = parseRssFeed(RSS_SAMPLE);
    expect(result.items[1].summary).toBe('HTML summary');
  });

  it('parses Atom feed', () => {
    const result = parseRssFeed(ATOM_SAMPLE);
    expect(result.title).toBe('Atom Feed');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Atom Article');
    expect(result.items[0].guid).toBe('atom-001');
  });
});
```

- [ ] **Step 2: Implement RSS parser**

Create `src/services/rss-parser.ts`:

```ts
import { XMLParser } from 'fast-xml-parser';

export interface ParsedFeed {
  title: string;
  items: ParsedItem[];
}

export interface ParsedItem {
  title: string;
  summary: string;
  content: string;
  url: string;
  guid: string;
  imageUrl: string;
  publishedAt: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function extractImageUrl(html: string): string {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? '';
}

function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export function parseRssFeed(xml: string): ParsedFeed {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const parsed = parser.parse(xml);

  if (parsed.rss?.channel) {
    return parseRss2(parsed.rss.channel);
  }
  if (parsed.feed) {
    return parseAtom(parsed.feed);
  }
  throw new Error('Unknown feed format');
}

function parseRss2(channel: any): ParsedFeed {
  const items = ensureArray(channel.item).map((item: any): ParsedItem => {
    const descHtml = item.description ?? item['content:encoded'] ?? '';
    const contentHtml = item['content:encoded'] ?? item.description ?? '';
    return {
      title: String(item.title ?? ''),
      summary: stripHtml(String(descHtml)).slice(0, 300),
      content: String(contentHtml),
      url: String(item.link ?? ''),
      guid: String(item.guid?.['#text'] ?? item.guid ?? item.link ?? ''),
      imageUrl: extractImageUrl(String(contentHtml)) || String(item.enclosure?.['@_url'] ?? ''),
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    };
  });

  return { title: String(channel.title ?? ''), items };
}

function parseAtom(feed: any): ParsedFeed {
  const items = ensureArray(feed.entry).map((entry: any): ParsedItem => {
    const contentHtml = entry.content?.['#text'] ?? entry.content ?? entry.summary ?? '';
    const link = ensureArray(entry.link).find((l: any) => l['@_rel'] !== 'self')
      ?? ensureArray(entry.link)[0];
    const url = link?.['@_href'] ?? String(link ?? '');

    return {
      title: String(entry.title?.['#text'] ?? entry.title ?? ''),
      summary: stripHtml(String(entry.summary?.['#text'] ?? entry.summary ?? '')).slice(0, 300),
      content: String(contentHtml),
      url,
      guid: String(entry.id ?? url),
      imageUrl: extractImageUrl(String(contentHtml)),
      publishedAt: entry.updated ?? entry.published
        ? new Date(entry.updated ?? entry.published).toISOString()
        : new Date().toISOString(),
    };
  });

  return { title: String(feed.title?.['#text'] ?? feed.title ?? ''), items };
}
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/services/rss-parser.test.ts
```

Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/rss-parser.ts __tests__/services/rss-parser.test.ts
git commit -m "feat: RSS 2.0 and Atom feed parser with HTML stripping"
```

---

## Task 7: Feed Sync Service

**Files:**
- Create: `src/services/feed-sync.ts`
- Create: `src/services/built-in-topics.ts`
- Test: `__tests__/services/feed-sync.test.ts`

- [ ] **Step 1: Create built-in topics mapping**

Create `src/services/built-in-topics.ts`:

```ts
export interface BuiltInFeed {
  title: string;
  route: string;
}

export interface BuiltInTopic {
  name: string;
  icon: string;
  feeds: BuiltInFeed[];
}

export const BUILT_IN_TOPICS: BuiltInTopic[] = [
  {
    name: '财经',
    icon: 'cash',
    feeds: [
      { title: '36氪快讯', route: '/36kr/newsflashes' },
      { title: '36氪资讯', route: '/36kr/information/web_news' },
      { title: '华尔街见闻', route: '/wallstreetcn/news/global' },
      { title: '财新网', route: '/caixin/latest' },
      { title: '第一财经', route: '/yicai/brief' },
      { title: '东方财富研报', route: '/eastmoney/report/strategyreport' },
      { title: '格隆汇', route: '/gelonghui/live' },
    ],
  },
  {
    name: '科技',
    icon: 'cpu',
    feeds: [
      { title: '少数派', route: '/sspai/index' },
      { title: '少数派 Matrix', route: '/sspai/matrix' },
      { title: 'IT之家', route: '/ithome/it' },
      { title: 'Solidot', route: '/solidot/www' },
      { title: '开源中国', route: '/oschina/news' },
      { title: '虎嗅', route: '/huxiu/article' },
      { title: 'Readhub', route: '/readhub/topic' },
    ],
  },
  {
    name: '热榜',
    icon: 'fire',
    feeds: [
      { title: '知乎热榜', route: '/zhihu/hot' },
      { title: '知乎日报', route: '/zhihu/daily' },
      { title: '豆瓣正在上映', route: '/douban/movie/playing' },
    ],
  },
  {
    name: '新闻',
    icon: 'newspaper',
    feeds: [
      { title: '澎湃新闻', route: '/thepaper/featured' },
      { title: '南方周末', route: '/infzm/1' },
    ],
  },
  {
    name: '加密货币',
    icon: 'bitcoin',
    feeds: [
      { title: '金色财经', route: '/jinse/lives' },
    ],
  },
];

export const DEFAULT_RSSHUB_URL = 'http://linghua.icu:1200';
```

- [ ] **Step 2: Implement feed sync service**

Create `src/services/feed-sync.ts`:

```ts
import { getAllFeeds, updateFeedLastFetched, type Feed } from '@/db/feeds';
import { insertArticle } from '@/db/articles';
import { getSetting } from '@/db/settings';
import { parseRssFeed } from './rss-parser';
import { DEFAULT_RSSHUB_URL } from './built-in-topics';

export interface SyncResult {
  feedId: number;
  newArticles: number;
  error?: string;
}

function buildFeedUrl(feed: Feed, rsshubBaseUrl: string): string {
  if (feed.source_type === 'rsshub') {
    const base = rsshubBaseUrl.replace(/\/$/, '');
    const route = feed.url.startsWith('/') ? feed.url : `/${feed.url}`;
    return `${base}${route}`;
  }
  return feed.url;
}

export async function syncFeed(feed: Feed): Promise<SyncResult> {
  const rsshubUrl = (await getSetting('rsshub_url')) ?? DEFAULT_RSSHUB_URL;
  const url = buildFeedUrl(feed, rsshubUrl);

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/xml, text/xml, application/rss+xml, application/atom+xml' },
    });
    if (!response.ok) {
      return { feedId: feed.id, newArticles: 0, error: `HTTP ${response.status}` };
    }
    const xml = await response.text();
    const parsed = parseRssFeed(xml);

    let newCount = 0;
    for (const item of parsed.items) {
      const rowId = await insertArticle(
        feed.id, item.guid, item.title, item.summary,
        item.url, item.imageUrl, item.publishedAt,
        item.content || undefined
      );
      if (rowId > 0) newCount++;
    }

    await updateFeedLastFetched(feed.id);
    return { feedId: feed.id, newArticles: newCount };
  } catch (err: any) {
    return { feedId: feed.id, newArticles: 0, error: err.message };
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
```

- [ ] **Step 3: Commit**

```bash
git add src/services/built-in-topics.ts src/services/feed-sync.ts
git commit -m "feat: feed sync service with RSSHub and native RSS support"
```

---

## Task 8: OPML Import/Export

**Files:**
- Create: `src/services/opml.ts`
- Test: `__tests__/services/opml.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/services/opml.test.ts`:

```ts
import { parseOpml, generateOpml } from '@/services/opml';

const OPML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="科技" title="科技">
      <outline text="少数派" title="少数派" type="rss" xmlUrl="https://sspai.com/feed" htmlUrl="https://sspai.com"/>
      <outline text="IT之家" title="IT之家" type="rss" xmlUrl="https://ithome.com/rss" />
    </outline>
    <outline text="新闻" title="新闻">
      <outline text="澎湃" title="澎湃" type="rss" xmlUrl="https://thepaper.cn/rss" />
    </outline>
  </body>
</opml>`;

describe('OPML', () => {
  it('parses OPML into categorized feeds', () => {
    const result = parseOpml(OPML_SAMPLE);
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('科技');
    expect(result[0].feeds).toHaveLength(2);
    expect(result[0].feeds[0].title).toBe('少数派');
    expect(result[0].feeds[0].xmlUrl).toBe('https://sspai.com/feed');
  });

  it('generates valid OPML from feed data', () => {
    const data = [
      { category: '科技', feeds: [{ title: '少数派', xmlUrl: 'https://sspai.com/feed' }] },
    ];
    const xml = generateOpml(data);
    expect(xml).toContain('<opml version="2.0">');
    expect(xml).toContain('xmlUrl="https://sspai.com/feed"');
    expect(xml).toContain('text="科技"');
  });
});
```

- [ ] **Step 2: Implement OPML service**

Create `src/services/opml.ts`:

```ts
import { XMLParser } from 'fast-xml-parser';

export interface OpmlFeed {
  title: string;
  xmlUrl: string;
}

export interface OpmlCategory {
  category: string;
  feeds: OpmlFeed[];
}

function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export function parseOpml(xml: string): OpmlCategory[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(xml);
  const body = parsed.opml?.body;
  if (!body) throw new Error('Invalid OPML');

  const outlines = ensureArray(body.outline);
  const categories: OpmlCategory[] = [];

  for (const outline of outlines) {
    if (outline.outline) {
      const feeds = ensureArray(outline.outline).map((f: any) => ({
        title: f['@_text'] || f['@_title'] || '',
        xmlUrl: f['@_xmlUrl'] || '',
      })).filter((f: OpmlFeed) => f.xmlUrl);
      if (feeds.length > 0) {
        categories.push({ category: outline['@_text'] || outline['@_title'] || '未分类', feeds });
      }
    } else if (outline['@_xmlUrl']) {
      categories.push({
        category: '未分类',
        feeds: [{ title: outline['@_text'] || '', xmlUrl: outline['@_xmlUrl'] }],
      });
    }
  }

  return categories;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function generateOpml(categories: OpmlCategory[]): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '<head><title>Hua Reader Subscriptions</title></head>',
    '<body>',
  ];
  for (const cat of categories) {
    lines.push(`  <outline text="${escapeXml(cat.category)}" title="${escapeXml(cat.category)}">`);
    for (const feed of cat.feeds) {
      lines.push(`    <outline text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" type="rss" xmlUrl="${escapeXml(feed.xmlUrl)}" />`);
    }
    lines.push('  </outline>');
  }
  lines.push('</body>', '</opml>');
  return lines.join('\n');
}
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/services/opml.test.ts
```

Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/opml.ts __tests__/services/opml.test.ts
git commit -m "feat: OPML import/export for feed migration"
```

---

## Task 9: Article HTML Renderer (Themed WebView Content)

This is the key to making full-text reading feel native to the app, not like a web page.

**Files:**
- Create: `src/services/article-html.ts`
- Test: `__tests__/services/article-html.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/services/article-html.test.ts`:

```ts
import { generateArticleHtml } from '@/services/article-html';

describe('generateArticleHtml', () => {
  it('generates HTML with title, meta, and content', () => {
    const html = generateArticleHtml({
      title: '测试文章标题',
      feedTitle: '36氪',
      publishedAt: '2026-06-02T12:00:00Z',
      content: '<p>这是正文内容</p>',
      fontSize: 17,
      lineHeight: 1.8,
      backgroundColor: '#FFFFFF',
      textColor: '#1a1a1a',
      secondaryColor: '#666666',
      accentColor: '#4F46E5',
    });
    expect(html).toContain('测试文章标题');
    expect(html).toContain('36氪');
    expect(html).toContain('这是正文内容');
    expect(html).toContain('font-size: 17px');
    expect(html).toContain('line-height: 1.8');
    expect(html).toContain('background-color: #FFFFFF');
  });

  it('applies max-width to images', () => {
    const html = generateArticleHtml({
      title: 'Test',
      feedTitle: 'Feed',
      publishedAt: '2026-06-02',
      content: '<img src="https://example.com/img.jpg" />',
      fontSize: 17,
      lineHeight: 1.8,
      backgroundColor: '#FFFFFF',
      textColor: '#1a1a1a',
      secondaryColor: '#666666',
      accentColor: '#4F46E5',
    });
    expect(html).toContain('max-width: 100%');
  });
});
```

- [ ] **Step 2: Implement article HTML generator**

Create `src/services/article-html.ts`:

```ts
export interface ArticleHtmlOptions {
  title: string;
  feedTitle: string;
  publishedAt: string;
  content: string;
  fontSize: number;
  lineHeight: number;
  backgroundColor: string;
  textColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function generateArticleHtml(opts: ArticleHtmlOptions): string {
  const readingTime = estimateMinutes(opts.content);
  const pubDate = formatDate(opts.publishedAt);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      font-size: ${opts.fontSize}px;
      line-height: ${opts.lineHeight};
      color: ${opts.textColor};
      background-color: ${opts.backgroundColor};
      padding: 24px 20px 80px 20px;
      max-width: 680px;
      margin: 0 auto;
      -webkit-font-smoothing: antialiased;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .article-header { margin-bottom: 28px; }

    .article-title {
      font-size: ${opts.fontSize * 1.4}px;
      font-weight: 700;
      line-height: 1.35;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .article-meta {
      font-size: ${opts.fontSize * 0.78}px;
      color: ${opts.secondaryColor};
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .article-meta .dot { color: ${opts.secondaryColor}; }

    .divider {
      height: 1px;
      background: ${opts.secondaryColor}22;
      margin: 20px 0;
    }

    .article-body p {
      margin-bottom: 1.2em;
    }

    .article-body h1, .article-body h2, .article-body h3,
    .article-body h4, .article-body h5, .article-body h6 {
      font-weight: 700;
      margin: 1.6em 0 0.8em;
      line-height: 1.35;
    }

    .article-body h1 { font-size: 1.5em; }
    .article-body h2 { font-size: 1.3em; }
    .article-body h3 { font-size: 1.15em; }

    .article-body img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 16px 0;
      display: block;
    }

    .article-body a {
      color: ${opts.accentColor};
      text-decoration: none;
      border-bottom: 1px solid ${opts.accentColor}44;
    }

    .article-body blockquote {
      border-left: 3px solid ${opts.accentColor};
      padding: 8px 16px;
      margin: 16px 0;
      color: ${opts.secondaryColor};
      background: ${opts.textColor}08;
      border-radius: 0 6px 6px 0;
    }

    .article-body pre, .article-body code {
      font-family: "SF Mono", "Fira Code", monospace;
      font-size: 0.88em;
      background: ${opts.textColor}0a;
      border-radius: 4px;
    }

    .article-body pre {
      padding: 14px;
      overflow-x: auto;
      margin: 16px 0;
    }

    .article-body code { padding: 2px 6px; }
    .article-body pre code { padding: 0; background: none; }

    .article-body ul, .article-body ol {
      padding-left: 1.6em;
      margin-bottom: 1.2em;
    }

    .article-body li { margin-bottom: 0.5em; }

    .article-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 0.92em;
    }

    .article-body th, .article-body td {
      border: 1px solid ${opts.secondaryColor}33;
      padding: 8px 12px;
      text-align: left;
    }

    .article-body th {
      background: ${opts.textColor}06;
      font-weight: 600;
    }

    .article-body figure {
      margin: 16px 0;
    }

    .article-body figcaption {
      font-size: 0.85em;
      color: ${opts.secondaryColor};
      text-align: center;
      margin-top: 8px;
    }

    .article-body iframe, .article-body video {
      max-width: 100%;
      border-radius: 8px;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="article-header">
    <h1 class="article-title">${escapeHtml(opts.title)}</h1>
    <div class="article-meta">
      <span>${escapeHtml(opts.feedTitle)}</span>
      <span class="dot">·</span>
      <span>${pubDate}</span>
      <span class="dot">·</span>
      <span>${readingTime} 分钟</span>
    </div>
  </div>
  <div class="divider"></div>
  <div class="article-body">
    ${opts.content}
  </div>
  <script>
    document.querySelectorAll('img').forEach(function(img) {
      img.setAttribute('loading', 'lazy');
      img.removeAttribute('width');
      img.removeAttribute('height');
    });
    document.addEventListener('scroll', function() {
      var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      var scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', progress: progress }));
    });
  </script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function estimateMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  return Math.max(1, Math.ceil(text.length / 600));
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}-${day}`;
  } catch {
    return '';
  }
}
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/services/article-html.test.ts
```

Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/article-html.ts __tests__/services/article-html.test.ts
git commit -m "feat: themed article HTML renderer for native-feeling reading experience"
```

---

## Task 10: Theme System

**Files:**
- Create: `src/theme/colors.ts`
- Create: `src/theme/reading.ts`
- Create: `src/theme/ThemeContext.tsx`

- [ ] **Step 1: Define seed colors and palette generation**

Create `src/theme/colors.ts`:

```ts
export interface SeedColor {
  name: string;
  label: string;
  primary: string;
}

export const SEED_COLORS: SeedColor[] = [
  { name: 'indigo', label: '靛蓝', primary: '#4F46E5' },
  { name: 'green', label: '森绿', primary: '#059669' },
  { name: 'orange', label: '暖橙', primary: '#EA580C' },
  { name: 'rose', label: '玫红', primary: '#E11D48' },
  { name: 'violet', label: '紫罗兰', primary: '#7C3AED' },
  { name: 'slate', label: '墨黑', primary: '#334155' },
];

export type ColorMode = 'light' | 'dark' | 'amoled';

export interface AppColors {
  primary: string;
  onPrimary: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  background: string;
  outline: string;
  error: string;
  cardBackground: string;
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xFF) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function generatePalette(seedHex: string, mode: ColorMode): AppColors {
  if (mode === 'amoled') {
    return {
      primary: seedHex,
      onPrimary: '#FFFFFF',
      surface: '#000000',
      onSurface: '#E4E4E7',
      surfaceVariant: '#111111',
      onSurfaceVariant: '#A1A1AA',
      background: '#000000',
      outline: '#27272A',
      error: '#EF4444',
      cardBackground: '#0A0A0A',
    };
  }
  if (mode === 'dark') {
    return {
      primary: lighten(seedHex, 0.2),
      onPrimary: '#FFFFFF',
      surface: '#18181B',
      onSurface: '#E4E4E7',
      surfaceVariant: '#27272A',
      onSurfaceVariant: '#A1A1AA',
      background: '#0F0F12',
      outline: '#3F3F46',
      error: '#EF4444',
      cardBackground: '#1E1E22',
    };
  }
  return {
    primary: seedHex,
    onPrimary: '#FFFFFF',
    surface: '#FFFFFF',
    onSurface: '#18181B',
    surfaceVariant: '#F4F4F5',
    onSurfaceVariant: '#71717A',
    background: '#FAFAFA',
    outline: '#E4E4E7',
    error: '#EF4444',
    cardBackground: '#FFFFFF',
  };
}
```

- [ ] **Step 2: Define reading preferences**

Create `src/theme/reading.ts`:

```ts
export interface ReadingPrefs {
  fontSize: number;
  lineHeight: number;
  backgroundColor: string;
}

export const READING_BG_OPTIONS = [
  { name: 'white', label: '纯白', color: '#FFFFFF', textColor: '#1a1a1a' },
  { name: 'sepia', label: '米黄', color: '#FFF8E7', textColor: '#3d3222' },
  { name: 'gray', label: '浅灰', color: '#F5F5F5', textColor: '#1a1a1a' },
  { name: 'dark', label: '深色', color: '#1a1a1a', textColor: '#d4d4d8' },
];

export const DEFAULT_READING_PREFS: ReadingPrefs = {
  fontSize: 17,
  lineHeight: 1.8,
  backgroundColor: '#FFFFFF',
};
```

- [ ] **Step 3: Create ThemeContext provider**

Create `src/theme/ThemeContext.tsx`:

```tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import {
  SEED_COLORS, generatePalette,
  type SeedColor, type ColorMode, type AppColors,
} from './colors';
import { DEFAULT_READING_PREFS, type ReadingPrefs } from './reading';
import { getSetting, setSetting } from '@/db/settings';

interface ThemeState {
  seedColor: SeedColor;
  colorMode: ColorMode;
  colors: AppColors;
  readingPrefs: ReadingPrefs;
  setSeedColor: (name: string) => void;
  setColorMode: (mode: ColorMode) => void;
  setReadingPrefs: (prefs: Partial<ReadingPrefs>) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [seedColor, setSeedColorState] = useState<SeedColor>(SEED_COLORS[0]);
  const [colorMode, setColorModeState] = useState<ColorMode>('light');
  const [readingPrefs, setReadingPrefsState] = useState<ReadingPrefs>(DEFAULT_READING_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const savedSeed = await getSetting('seed_color');
      const savedMode = await getSetting('color_mode');
      const savedReading = await getSetting('reading_prefs');
      if (savedSeed) {
        const found = SEED_COLORS.find((c) => c.name === savedSeed);
        if (found) setSeedColorState(found);
      }
      if (savedMode) setColorModeState(savedMode as ColorMode);
      if (savedReading) {
        try { setReadingPrefsState({ ...DEFAULT_READING_PREFS, ...JSON.parse(savedReading) }); } catch {}
      }
      setLoaded(true);
    })();
  }, []);

  const setSeedColor = useCallback((name: string) => {
    const found = SEED_COLORS.find((c) => c.name === name);
    if (found) {
      setSeedColorState(found);
      setSetting('seed_color', name);
    }
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    setSetting('color_mode', mode);
  }, []);

  const setReadingPrefs = useCallback((prefs: Partial<ReadingPrefs>) => {
    setReadingPrefsState((prev) => {
      const next = { ...prev, ...prefs };
      setSetting('reading_prefs', JSON.stringify(next));
      return next;
    });
  }, []);

  const colors = generatePalette(seedColor.primary, colorMode);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ seedColor, colorMode, colors, readingPrefs, setSeedColor, setColorMode, setReadingPrefs }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/theme/
git commit -m "feat: MD3 theme system with seed colors, dark/amoled modes, and reading prefs"
```

---

## Task 11: App Shell — Providers and Navigation

**Files:**
- Create: `src/app/Providers.tsx`
- Modify: `src/app/Navigation.tsx`
- Modify: `src/app/App.tsx`
- Create: `src/screens/home/HomeScreen.tsx` (placeholder)
- Create: `src/screens/discover/DiscoverScreen.tsx` (placeholder)
- Create: `src/screens/profile/ProfileScreen.tsx` (placeholder)

- [ ] **Step 1: Create Providers wrapper**

Create `src/app/Providers.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { initDatabase } from '@/db/database';
import { ThemeProvider } from '@/theme/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
  }, []);

  if (!dbReady) return null;

  return <ThemeProvider>{children}</ThemeProvider>;
}
```

- [ ] **Step 2: Create Navigation with bottom tabs**

Create `src/app/Navigation.tsx`:

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/ThemeContext';
import HomeScreen from '@/screens/home/HomeScreen';
import DiscoverScreen from '@/screens/discover/DiscoverScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

export type RootTabParamList = {
  HomeTab: undefined;
  DiscoverTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Reader: { articleId: number };
  TopicDetail: { topicId: number; topicName: string };
  Bookmarks: undefined;
  FeedManager: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.outline },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="DiscoverTab"
        component={DiscoverScreen}
        options={{
          tabBarLabel: '发现',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="compass" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { colors } = useTheme();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 3: Create placeholder screens**

Create `src/screens/home/HomeScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export default function HomeScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.onSurface }}>首页</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
```

Create `src/screens/discover/DiscoverScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.onSurface }}>发现</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
```

Create `src/screens/profile/ProfileScreen.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export default function ProfileScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.onSurface }}>我的</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
```

- [ ] **Step 4: Wire up App.tsx**

Replace `src/app/App.tsx`:

```tsx
import React from 'react';
import { StatusBar } from 'react-native';
import { Providers } from './Providers';
import Navigation from './Navigation';

export default function App() {
  return (
    <Providers>
      <StatusBar translucent backgroundColor="transparent" />
      <Navigation />
    </Providers>
  );
}
```

- [ ] **Step 5: Run on Android emulator to verify bottom tabs work**

```bash
npx expo start --android
```

Expected: App shows three tabs (首页, 发现, 我的) with placeholder text, themed background.

- [ ] **Step 6: Commit**

```bash
git add src/app/ src/screens/
git commit -m "feat: app shell with providers, navigation, and themed bottom tabs"
```

---

## Task 12: Home Screen — List Mode

**Files:**
- Create: `src/screens/home/ArticleCard.tsx`
- Create: `src/screens/home/ListMode.tsx`
- Modify: `src/screens/home/HomeScreen.tsx`

- [ ] **Step 1: Create ArticleCard component**

Create `src/screens/home/ArticleCard.tsx`:

```tsx
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { relativeTime } from '@/utils/time';
import type { ArticleWithFeed } from '@/db/articles';

interface Props {
  article: ArticleWithFeed;
  onPress: (article: ArticleWithFeed) => void;
}

export default function ArticleCard({ article, onPress }: Props) {
  const { colors } = useTheme();
  const isRead = !!article.is_read;

  return (
    <Pressable
      onPress={() => onPress(article)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.cardBackground, borderBottomColor: colors.outline },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.meta}>
        <Text style={[styles.source, { color: colors.onSurfaceVariant }]}>
          {article.feed_title}
        </Text>
        <Text style={[styles.dot, { color: colors.onSurfaceVariant }]}> · </Text>
        <Text style={[styles.time, { color: colors.onSurfaceVariant }]}>
          {relativeTime(new Date(article.published_at))}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.textCol}>
          <Text
            style={[
              styles.title,
              { color: isRead ? colors.onSurfaceVariant : colors.onSurface },
              !isRead && { fontWeight: '700' },
            ]}
            numberOfLines={2}
          >
            {article.title}
          </Text>
          <Text style={[styles.summary, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
            {article.summary}
          </Text>
        </View>
        {article.image_url ? (
          <Image source={{ uri: article.image_url }} style={styles.thumb} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  source: { fontSize: 12 },
  dot: { fontSize: 12 },
  time: { fontSize: 12 },
  body: { flexDirection: 'row' },
  textCol: { flex: 1, marginRight: 12 },
  title: { fontSize: 16, lineHeight: 22, marginBottom: 4 },
  summary: { fontSize: 13, lineHeight: 18 },
  thumb: { width: 72, height: 72, borderRadius: 6, backgroundColor: '#eee' },
});
```

- [ ] **Step 2: Create ListMode component**

Create `src/screens/home/ListMode.tsx`:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/theme/ThemeContext';
import { getUnreadArticles, type ArticleWithFeed } from '@/db/articles';
import { getAllTopics, type Topic } from '@/db/topics';
import { syncAllFeeds } from '@/services/feed-sync';
import ArticleCard from './ArticleCard';
import EmptyState from '@/components/EmptyState';

interface Props {
  onArticlePress: (article: ArticleWithFeed) => void;
}

export default function ListMode({ onArticlePress }: Props) {
  const { colors } = useTheme();
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const loadArticles = useCallback(async () => {
    const data = await getUnreadArticles(selectedTopicId);
    setArticles(data);
  }, [selectedTopicId]);

  const loadTopics = useCallback(async () => {
    const data = await getAllTopics();
    setTopics(data);
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);
  useEffect(() => { loadTopics(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncAllFeeds();
    await loadArticles();
    setRefreshing(false);
  }, [loadArticles]);

  const renderTopicTabs = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
      <Pressable
        onPress={() => setSelectedTopicId(undefined)}
        style={[styles.tab, !selectedTopicId && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
      >
        <Text style={[styles.tabText, { color: !selectedTopicId ? colors.primary : colors.onSurfaceVariant }]}>
          全部
        </Text>
      </Pressable>
      {topics.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => setSelectedTopicId(t.id)}
          style={[styles.tab, selectedTopicId === t.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={[styles.tabText, { color: selectedTopicId === t.id ? colors.primary : colors.onSurfaceVariant }]}>
            {t.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderTopicTabs()}
      <FlashList
        data={articles}
        renderItem={({ item }) => <ArticleCard article={item} onPress={onArticlePress} />}
        estimatedItemSize={120}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="newspaper" message="暂无内容，下拉刷新试试" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 12 },
  tabText: { fontSize: 14 },
});
```

Note: This file uses `Pressable` and `Text` from react-native — add them to the import at the top:

```tsx
import { View, Text, Pressable, RefreshControl, StyleSheet } from 'react-native';
```

- [ ] **Step 3: Create EmptyState component**

Create `src/components/EmptyState.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  icon: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, message, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={64} color={colors.onSurfaceVariant} />
      <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>
      {actionLabel && onAction && (
        <Text style={[styles.action, { color: colors.primary }]} onPress={onAction}>
          {actionLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120 },
  message: { fontSize: 15, marginTop: 16 },
  action: { fontSize: 15, marginTop: 12, fontWeight: '600' },
});
```

- [ ] **Step 4: Update HomeScreen with ListMode**

Replace `src/screens/home/HomeScreen.tsx`:

```tsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import ListMode from './ListMode';
import type { ArticleWithFeed } from '@/db/articles';

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const handleArticlePress = (article: ArticleWithFeed) => {
    navigation.navigate('Reader', { articleId: article.id });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ListMode onArticlePress={handleArticlePress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/home/ src/components/EmptyState.tsx
git commit -m "feat: home screen list mode with topic tabs, article cards, pull-to-refresh"
```

---

## Task 13: Home Screen — Swipe Mode

**Files:**
- Create: `src/screens/home/SwipeCard.tsx`
- Create: `src/screens/home/SwipeMode.tsx`
- Modify: `src/screens/home/HomeScreen.tsx`

- [ ] **Step 1: Create SwipeCard component**

Create `src/screens/home/SwipeCard.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/ThemeContext';
import { relativeTime } from '@/utils/time';
import type { ArticleWithFeed } from '@/db/articles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  article: ArticleWithFeed;
  onReadMore: (article: ArticleWithFeed) => void;
  onBookmark: (article: ArticleWithFeed) => void;
}

export default function SwipeCard({ article, onReadMore, onBookmark }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, height: SCREEN_HEIGHT - 120 }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={3}>
          {article.title}
        </Text>

        <Text style={[styles.preview, { color: colors.onSurfaceVariant }]} numberOfLines={6}>
          {article.summary || article.content?.replace(/<[^>]*>/g, '').slice(0, 300)}
        </Text>

        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
            {article.feed_title}
          </Text>
          <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}> · </Text>
          <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
            {relativeTime(new Date(article.published_at))}
          </Text>
        </View>

        <Pressable
          onPress={() => onReadMore(article)}
          style={[styles.readButton, { borderColor: colors.primary }]}
        >
          <Text style={[styles.readButtonText, { color: colors.primary }]}>继续阅读全文</Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable onPress={() => onBookmark(article)} style={styles.actionButton}>
            <MaterialCommunityIcons
              name={article.is_bookmarked ? 'star' : 'star-outline'}
              size={28}
              color={article.is_bookmarked ? colors.primary : colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 34, marginBottom: 20 },
  preview: { fontSize: 16, lineHeight: 26, marginBottom: 24 },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  metaText: { fontSize: 13 },
  readButton: {
    borderWidth: 1.5, borderRadius: 24, paddingVertical: 14,
    alignItems: 'center', marginBottom: 24,
  },
  readButtonText: { fontSize: 16, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 32 },
  actionButton: { padding: 8 },
});
```

- [ ] **Step 2: Create SwipeMode component**

Create `src/screens/home/SwipeMode.tsx`:

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useTheme } from '@/theme/ThemeContext';
import { getUnreadArticles, markAsRead, toggleBookmark, type ArticleWithFeed } from '@/db/articles';
import SwipeCard from './SwipeCard';
import EmptyState from '@/components/EmptyState';

interface Props {
  topicId?: number;
  onReadMore: (article: ArticleWithFeed) => void;
}

export default function SwipeMode({ topicId, onReadMore }: Props) {
  const { colors } = useTheme();
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const loadArticles = useCallback(async () => {
    const data = await getUnreadArticles(topicId);
    setArticles(interleave(data));
  }, [topicId]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const onPageSelected = useCallback(async (e: any) => {
    const index = e.nativeEvent.position;
    setCurrentIndex(index);
    if (articles[index]) {
      await markAsRead(articles[index].id);
    }
  }, [articles]);

  const handleBookmark = useCallback(async (article: ArticleWithFeed) => {
    await toggleBookmark(article.id);
    setArticles((prev) =>
      prev.map((a) => a.id === article.id ? { ...a, is_bookmarked: a.is_bookmarked ? 0 : 1 } : a)
    );
  }, []);

  if (articles.length === 0) {
    return <EmptyState icon="check-circle" message="已经刷完了，去发现更多话题？" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        orientation="vertical"
        onPageSelected={onPageSelected}
        initialPage={0}
      >
        {articles.map((article, idx) => (
          <View key={article.id} collapsable={false}>
            <SwipeCard article={article} onReadMore={onReadMore} onBookmark={handleBookmark} />
          </View>
        ))}
      </PagerView>
    </View>
  );
}

function interleave(articles: ArticleWithFeed[]): ArticleWithFeed[] {
  const byFeed = new Map<number, ArticleWithFeed[]>();
  for (const a of articles) {
    const list = byFeed.get(a.feed_id) ?? [];
    list.push(a);
    byFeed.set(a.feed_id, list);
  }
  const result: ArticleWithFeed[] = [];
  const queues = Array.from(byFeed.values());
  let idx = 0;
  while (queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      if (q.length > 0) result.push(q.shift()!);
    }
  }
  return result;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pager: { flex: 1 },
});
```

- [ ] **Step 3: Update HomeScreen with mode switching**

Replace `src/screens/home/HomeScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { markAsRead, type ArticleWithFeed } from '@/db/articles';
import SwipeMode from './SwipeMode';
import ListMode from './ListMode';

type ViewMode = 'swipe' | 'list';

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<ViewMode>('swipe');

  const handleArticlePress = async (article: ArticleWithFeed) => {
    await markAsRead(article.id);
    navigation.navigate('Reader', { articleId: article.id });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Pressable
          onPress={() => setMode(mode === 'swipe' ? 'list' : 'swipe')}
          style={styles.modeToggle}
        >
          <MaterialCommunityIcons
            name={mode === 'swipe' ? 'view-list' : 'cards'}
            size={24}
            color={colors.onSurface}
          />
        </Pressable>
      </View>
      {mode === 'swipe' ? (
        <SwipeMode onReadMore={handleArticlePress} />
      ) : (
        <ListMode onArticlePress={handleArticlePress} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 },
  modeToggle: { padding: 8 },
});
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/home/
git commit -m "feat: swipe mode with vertical paging, interleaved articles, mode toggle"
```

---

## Task 14: Reader Screen

**Files:**
- Create: `src/screens/reader/ReaderScreen.tsx`
- Create: `src/screens/reader/ReaderToolbar.tsx`
- Create: `src/screens/reader/TypographyPanel.tsx`
- Create: `src/services/readability.ts`
- Modify: `src/app/Navigation.tsx` (add Reader route)

- [ ] **Step 1: Create Readability service**

Create `src/services/readability.ts`:

```ts
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

export async function extractFullText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36' },
    });
    const html = await response.text();
    const { document } = parseHTML(html);
    const reader = new Readability(document as any);
    const article = reader.parse();
    return article?.content ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Create TypographyPanel**

Create `src/screens/reader/TypographyPanel.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/theme/ThemeContext';
import { READING_BG_OPTIONS } from '@/theme/reading';

export default function TypographyPanel() {
  const { colors, readingPrefs, setReadingPrefs } = useTheme();

  return (
    <View style={[styles.panel, { backgroundColor: colors.surfaceVariant }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.onSurface }]}>字号</Text>
        <Slider
          style={styles.slider}
          minimumValue={14}
          maximumValue={24}
          step={1}
          value={readingPrefs.fontSize}
          onValueChange={(v) => setReadingPrefs({ fontSize: v })}
          minimumTrackTintColor={colors.primary}
          thumbTintColor={colors.primary}
        />
        <Text style={[styles.value, { color: colors.onSurfaceVariant }]}>{readingPrefs.fontSize}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.onSurface }]}>行距</Text>
        <Slider
          style={styles.slider}
          minimumValue={1.4}
          maximumValue={2.0}
          step={0.1}
          value={readingPrefs.lineHeight}
          onValueChange={(v) => setReadingPrefs({ lineHeight: Math.round(v * 10) / 10 })}
          minimumTrackTintColor={colors.primary}
          thumbTintColor={colors.primary}
        />
        <Text style={[styles.value, { color: colors.onSurfaceVariant }]}>{readingPrefs.lineHeight}</Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.onSurface }]}>背景</Text>
        <View style={styles.bgOptions}>
          {READING_BG_OPTIONS.map((opt) => (
            <Pressable
              key={opt.name}
              onPress={() => setReadingPrefs({ backgroundColor: opt.color })}
              style={[
                styles.bgCircle,
                { backgroundColor: opt.color, borderColor: colors.outline },
                readingPrefs.backgroundColor === opt.color && { borderColor: colors.primary, borderWidth: 2.5 },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 14, width: 40 },
  slider: { flex: 1, marginHorizontal: 8 },
  value: { fontSize: 14, width: 30, textAlign: 'right' },
  bgOptions: { flexDirection: 'row', gap: 12, marginLeft: 8 },
  bgCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1 },
});
```

- [ ] **Step 3: Create ReaderToolbar**

Create `src/screens/reader/ReaderToolbar.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/ThemeContext';
import TypographyPanel from './TypographyPanel';

interface Props {
  progress: number;
  visible: boolean;
}

export default function ReaderToolbar({ progress, visible }: Props) {
  const { colors, colorMode, setColorMode } = useTheme();
  const [showTypography, setShowTypography] = useState(false);

  if (!visible) return null;

  return (
    <>
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
        </View>
        <View style={styles.controls}>
          <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>{progress}%</Text>
          <Pressable onPress={() => setShowTypography(true)} style={styles.button}>
            <Text style={[styles.buttonText, { color: colors.onSurface }]}>Aa</Text>
          </Pressable>
          <Pressable
            onPress={() => setColorMode(colorMode === 'light' ? 'dark' : 'light')}
            style={styles.button}
          >
            <MaterialCommunityIcons
              name={colorMode === 'light' ? 'weather-night' : 'white-balance-sunny'}
              size={22}
              color={colors.onSurface}
            />
          </Pressable>
        </View>
      </View>

      <Modal visible={showTypography} transparent animationType="slide" onRequestClose={() => setShowTypography(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTypography(false)}>
          <View style={styles.modalContent}>
            <TypographyPanel />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: { borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 20 },
  progressBar: { height: 2, backgroundColor: '#e0e0e0' },
  progressFill: { height: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, gap: 20 },
  progressText: { fontSize: 13, flex: 1 },
  button: { padding: 8 },
  buttonText: { fontSize: 18, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: {},
});
```

- [ ] **Step 4: Create ReaderScreen**

Create `src/screens/reader/ReaderScreen.tsx`:

```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { getDatabase } from '@/db/database';
import { toggleBookmark, cacheArticleContent, type ArticleWithFeed } from '@/db/articles';
import { generateArticleHtml } from '@/services/article-html';
import { extractFullText } from '@/services/readability';
import { READING_BG_OPTIONS } from '@/theme/reading';
import ReaderToolbar from './ReaderToolbar';

export default function ReaderScreen() {
  const { colors, readingPrefs } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const articleId = route.params.articleId;

  const [article, setArticle] = useState<ArticleWithFeed | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [barsVisible, setBarsVisible] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    (async () => {
      const db = getDatabase();
      const row = await db.getFirstAsync<ArticleWithFeed>(`
        SELECT a.*, f.title as feed_title, f.icon_url as feed_icon_url, f.topic_id
        FROM articles a JOIN feeds f ON a.feed_id = f.id WHERE a.id = ?
      `, articleId);
      if (row) {
        setArticle(row);
        setIsBookmarked(!!row.is_bookmarked);
        let content = row.content;
        if (!content || content.length < 100) {
          const extracted = await extractFullText(row.url);
          if (extracted) {
            content = extracted;
            await cacheArticleContent(row.id, extracted);
          }
        }
        if (content) {
          const bgOpt = READING_BG_OPTIONS.find((o) => o.color === readingPrefs.backgroundColor) ?? READING_BG_OPTIONS[0];
          setHtmlContent(generateArticleHtml({
            title: row.title,
            feedTitle: row.feed_title,
            publishedAt: row.published_at,
            content,
            fontSize: readingPrefs.fontSize,
            lineHeight: readingPrefs.lineHeight,
            backgroundColor: bgOpt.color,
            textColor: bgOpt.textColor,
            secondaryColor: colors.onSurfaceVariant,
            accentColor: colors.primary,
          }));
        }
      }
    })();
  }, [articleId, readingPrefs, colors]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'scroll') setProgress(data.progress);
    } catch {}
  }, []);

  const handleBookmark = useCallback(async () => {
    if (!article) return;
    const result = await toggleBookmark(article.id);
    setIsBookmarked(result);
  }, [article]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: readingPrefs.backgroundColor }]} edges={['top']}>
      {barsVisible && (
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
          </Pressable>
          <View style={styles.headerRight}>
            <Pressable onPress={handleBookmark} style={styles.headerButton}>
              <MaterialCommunityIcons
                name={isBookmarked ? 'star' : 'star-outline'}
                size={24}
                color={isBookmarked ? colors.primary : colors.onSurface}
              />
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.webviewWrap} onPress={() => setBarsVisible((v) => !v)}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          onMessage={handleMessage}
          showsVerticalScrollIndicator={false}
          scrollEnabled
        />
      </Pressable>

      <ReaderToolbar progress={progress} visible={barsVisible} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  headerButton: { padding: 8 },
  headerRight: { flexDirection: 'row', gap: 4 },
  webviewWrap: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
```

- [ ] **Step 5: Add Reader route to Navigation**

In `src/app/Navigation.tsx`, import ReaderScreen and add it to the Stack navigator:

```tsx
import ReaderScreen from '@/screens/reader/ReaderScreen';

// Inside the Stack.Navigator, after the Main screen:
<Stack.Screen name="Reader" component={ReaderScreen} options={{ animation: 'slide_from_right' }} />
```

- [ ] **Step 6: Commit**

```bash
git add src/screens/reader/ src/services/readability.ts src/app/Navigation.tsx
git commit -m "feat: immersive reader with themed WebView, readability extraction, typography controls"
```

---

## Task 15: Discover Screen

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx`
- Create: `src/screens/discover/TopicGrid.tsx`
- Create: `src/screens/discover/TopicDetail.tsx`
- Create: `src/screens/discover/AddFeedSheet.tsx`

- [ ] **Step 1: Create TopicGrid**

Create `src/screens/discover/TopicGrid.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/ThemeContext';
import { BUILT_IN_TOPICS, type BuiltInTopic } from '@/services/built-in-topics';

interface Props {
  subscribedTopics: Set<string>;
  onTopicPress: (topic: BuiltInTopic) => void;
}

export default function TopicGrid({ subscribedTopics, onTopicPress }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {BUILT_IN_TOPICS.map((topic) => {
        const isSubscribed = subscribedTopics.has(topic.name);
        return (
          <Pressable
            key={topic.name}
            onPress={() => onTopicPress(topic)}
            style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: isSubscribed ? colors.primary : colors.outline }]}
          >
            <MaterialCommunityIcons name={topic.icon as any} size={28} color={isSubscribed ? colors.primary : colors.onSurfaceVariant} />
            <Text style={[styles.topicName, { color: colors.onSurface }]}>{topic.name}</Text>
            <Text style={[styles.feedCount, { color: colors.onSurfaceVariant }]}>{topic.feeds.length}个源</Text>
            <Text style={[styles.status, { color: isSubscribed ? colors.primary : colors.onSurfaceVariant }]}>
              {isSubscribed ? '已订阅' : '订阅'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  card: {
    width: '47%', borderRadius: 12, borderWidth: 1, padding: 16,
    alignItems: 'center', gap: 6,
  },
  topicName: { fontSize: 16, fontWeight: '600' },
  feedCount: { fontSize: 12 },
  status: { fontSize: 13, fontWeight: '500', marginTop: 4 },
});
```

- [ ] **Step 2: Create TopicDetail**

Create `src/screens/discover/TopicDetail.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { BuiltInTopic, BuiltInFeed } from '@/services/built-in-topics';

interface Props {
  topic: BuiltInTopic | null;
  enabledFeeds: Set<string>;
  onToggleFeed: (route: string, enabled: boolean) => void;
  onSubscribeAll: () => void;
  onClose: () => void;
}

export default function TopicDetail({ topic, enabledFeeds, onToggleFeed, onSubscribeAll, onClose }: Props) {
  const { colors } = useTheme();
  if (!topic) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onSurface }]}>{topic.name}</Text>
            <Pressable onPress={onSubscribeAll} style={[styles.allBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.allBtnText, { color: colors.onPrimary }]}>全部订阅</Text>
            </Pressable>
          </View>
          <ScrollView>
            {topic.feeds.map((feed) => (
              <View key={feed.route} style={[styles.feedRow, { borderBottomColor: colors.outline }]}>
                <Text style={[styles.feedTitle, { color: colors.onSurface }]}>{feed.title}</Text>
                <Switch
                  value={enabledFeeds.has(feed.route)}
                  onValueChange={(v) => onToggleFeed(feed.route, v)}
                  trackColor={{ true: colors.primary }}
                />
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { maxHeight: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  allBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  allBtnText: { fontSize: 14, fontWeight: '600' },
  feedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  feedTitle: { fontSize: 15 },
});
```

- [ ] **Step 3: Create AddFeedSheet**

Create `src/screens/discover/AddFeedSheet.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (url: string, title: string) => Promise<void>;
}

export default function AddFeedSheet({ visible, onClose, onAdd }: Props) {
  const { colors } = useTheme();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(url.trim());
      if (!resp.ok) throw new Error('无法访问该地址');
      const text = await resp.text();
      if (!text.includes('<rss') && !text.includes('<feed') && !text.includes('<channel')) {
        throw new Error('不是有效的 RSS/Atom 源');
      }
      const titleMatch = text.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch?.[1] ?? url.trim();
      await onAdd(url.trim(), title);
      setUrl('');
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: colors.onSurface }]}>添加 RSS 源</Text>
          <TextInput
            style={[styles.input, { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surfaceVariant }]}
            placeholder="粘贴 RSS/Atom 地址"
            placeholderTextColor={colors.onSurfaceVariant}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            onPress={handleAdd}
            disabled={loading}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            {loading ? <ActivityIndicator color={colors.onPrimary} /> : (
              <Text style={[styles.addBtnText, { color: colors.onPrimary }]}>验证并添加</Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 12 },
  error: { color: '#EF4444', fontSize: 13, marginBottom: 8 },
  addBtn: { borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 4: Wire up DiscoverScreen**

Replace `src/screens/discover/DiscoverScreen.tsx`:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/theme/ThemeContext';
import { getAllTopics, insertTopic } from '@/db/topics';
import { insertFeed, getAllFeeds } from '@/db/feeds';
import { DEFAULT_RSSHUB_URL, type BuiltInTopic } from '@/services/built-in-topics';
import { parseOpml, generateOpml } from '@/services/opml';
import TopicGrid from './TopicGrid';
import TopicDetail from './TopicDetail';
import AddFeedSheet from './AddFeedSheet';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const [subscribedTopics, setSubscribedTopics] = useState<Set<string>>(new Set());
  const [subscribedFeeds, setSubscribedFeeds] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<BuiltInTopic | null>(null);
  const [showAddFeed, setShowAddFeed] = useState(false);

  const refresh = useCallback(async () => {
    const feeds = await getAllFeeds();
    const topicNames = new Set<string>();
    const feedUrls = new Set<string>();
    const topics = await getAllTopics();
    for (const f of feeds) {
      feedUrls.add(f.url);
      const t = topics.find((t) => t.id === f.topic_id);
      if (t) topicNames.add(t.name);
    }
    setSubscribedTopics(topicNames);
    setSubscribedFeeds(feedUrls);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSubscribeTopic = useCallback(async (topic: BuiltInTopic) => {
    setSelectedTopic(topic);
  }, []);

  const handleToggleFeed = useCallback(async (route: string, enabled: boolean) => {
    if (!selectedTopic) return;
    if (enabled) {
      let topicRow = (await getAllTopics()).find((t) => t.name === selectedTopic.name);
      if (!topicRow) {
        const id = await insertTopic(selectedTopic.name, selectedTopic.icon, true);
        topicRow = { id, name: selectedTopic.name, icon: selectedTopic.icon, sort_order: 0, is_builtin: 1 };
      }
      const feed = selectedTopic.feeds.find((f) => f.route === route);
      if (feed) await insertFeed(feed.title, route, 'rsshub', topicRow.id);
    }
    await refresh();
  }, [selectedTopic, refresh]);

  const handleSubscribeAll = useCallback(async () => {
    if (!selectedTopic) return;
    let topicRow = (await getAllTopics()).find((t) => t.name === selectedTopic.name);
    if (!topicRow) {
      const id = await insertTopic(selectedTopic.name, selectedTopic.icon, true);
      topicRow = { id, name: selectedTopic.name, icon: selectedTopic.icon, sort_order: 0, is_builtin: 1 };
    }
    for (const feed of selectedTopic.feeds) {
      await insertFeed(feed.title, feed.route, 'rsshub', topicRow.id);
    }
    await refresh();
  }, [selectedTopic, refresh]);

  const handleAddFeed = useCallback(async (url: string, title: string) => {
    const topics = await getAllTopics();
    let defaultTopic = topics.find((t) => t.name === '自定义');
    if (!defaultTopic) {
      const id = await insertTopic('自定义', 'rss', false);
      defaultTopic = { id, name: '自定义', icon: 'rss', sort_order: 0, is_builtin: 0 };
    }
    await insertFeed(title, url, 'native', defaultTopic.id);
    await refresh();
  }, [refresh]);

  const handleImportOpml = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['text/xml', 'application/xml', 'text/x-opml'] });
    if (result.canceled) return;
    const file = result.assets[0];
    const content = await FileSystem.readAsStringAsync(file.uri);
    const categories = parseOpml(content);
    for (const cat of categories) {
      const topics = await getAllTopics();
      let topic = topics.find((t) => t.name === cat.category);
      if (!topic) {
        const id = await insertTopic(cat.category, 'rss', false);
        topic = { id, name: cat.category, icon: 'rss', sort_order: 0, is_builtin: 0 };
      }
      for (const feed of cat.feeds) {
        await insertFeed(feed.title, feed.xmlUrl, 'native', topic.id);
      }
    }
    await refresh();
  }, [refresh]);

  const handleExportOpml = useCallback(async () => {
    const feeds = await getAllFeeds();
    const topics = await getAllTopics();
    const catMap = new Map<string, { title: string; xmlUrl: string }[]>();
    for (const f of feeds) {
      const tName = topics.find((t) => t.id === f.topic_id)?.name ?? '未分类';
      const list = catMap.get(tName) ?? [];
      list.push({ title: f.title, xmlUrl: f.url });
      catMap.set(tName, list);
    }
    const categories = Array.from(catMap.entries()).map(([category, feeds]) => ({ category, feeds }));
    const xml = generateOpml(categories);
    const path = FileSystem.documentDirectory + 'hua-reader-subscriptions.opml';
    await FileSystem.writeAsStringAsync(path, xml);
    await Sharing.shareAsync(path);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView>
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>话题订阅</Text>
        <TopicGrid subscribedTopics={subscribedTopics} onTopicPress={handleSubscribeTopic} />

        <View style={styles.actions}>
          <Pressable onPress={() => setShowAddFeed(true)} style={[styles.actionBtn, { borderColor: colors.outline }]}>
            <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.onSurface }]}>添加 RSS 地址</Text>
          </Pressable>
          <Pressable onPress={handleImportOpml} style={[styles.actionBtn, { borderColor: colors.outline }]}>
            <MaterialCommunityIcons name="download" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.onSurface }]}>导入 OPML</Text>
          </Pressable>
          <Pressable onPress={handleExportOpml} style={[styles.actionBtn, { borderColor: colors.outline }]}>
            <MaterialCommunityIcons name="upload" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.onSurface }]}>导出 OPML</Text>
          </Pressable>
        </View>
      </ScrollView>

      <TopicDetail
        topic={selectedTopic}
        enabledFeeds={subscribedFeeds}
        onToggleFeed={handleToggleFeed}
        onSubscribeAll={handleSubscribeAll}
        onClose={() => setSelectedTopic(null)}
      />
      <AddFeedSheet visible={showAddFeed} onClose={() => setShowAddFeed(false)} onAdd={handleAddFeed} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  actions: { padding: 16, gap: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12, padding: 16,
  },
  actionText: { fontSize: 15 },
});
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/discover/
git commit -m "feat: discover screen with topic grid, feed management, OPML import/export"
```

---

## Task 16: Profile Screen — Bookmarks, Feed Manager, Settings

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`
- Create: `src/screens/profile/BookmarksScreen.tsx`
- Create: `src/screens/profile/FeedManagerScreen.tsx`
- Create: `src/screens/profile/SettingsScreen.tsx`
- Modify: `src/app/Navigation.tsx` (add stack routes)

- [ ] **Step 1: Create BookmarksScreen**

Create `src/screens/profile/BookmarksScreen.tsx`:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { getBookmarkedArticles, type ArticleWithFeed } from '@/db/articles';
import ArticleCard from '@/screens/home/ArticleCard';
import EmptyState from '@/components/EmptyState';

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [articles, setArticles] = useState<ArticleWithFeed[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    const data = await getBookmarkedArticles(searchQuery || undefined);
    setArticles(data);
  }, [searchQuery]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[styles.search, { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outline }]}
        placeholder="搜索收藏..."
        placeholderTextColor={colors.onSurfaceVariant}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlashList
        data={articles}
        renderItem={({ item }) => (
          <ArticleCard article={item} onPress={(a) => navigation.navigate('Reader', { articleId: a.id })} />
        )}
        estimatedItemSize={120}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<EmptyState icon="star-outline" message="还没有收藏，阅读时双击可收藏" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { margin: 16, padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15 },
});
```

- [ ] **Step 2: Create SettingsScreen**

Create `src/screens/profile/SettingsScreen.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { SEED_COLORS, type ColorMode } from '@/theme/colors';
import { getSetting, setSetting } from '@/db/settings';
import { cleanupOldArticles } from '@/db/articles';

export default function SettingsScreen() {
  const { colors, seedColor, colorMode, setSeedColor, setColorMode } = useTheme();
  const [rsshubUrl, setRsshubUrl] = useState('');

  useEffect(() => {
    getSetting('rsshub_url').then((v) => setRsshubUrl(v ?? 'http://linghua.icu:1200'));
  }, []);

  const saveRsshubUrl = () => {
    setSetting('rsshub_url', rsshubUrl);
    Alert.alert('已保存');
  };

  const handleCleanup = async () => {
    const deleted = await cleanupOldArticles(7);
    Alert.alert(`已清理 ${deleted} 篇文章`);
  };

  const modes: { key: ColorMode; label: string }[] = [
    { key: 'light', label: '亮色' },
    { key: 'dark', label: '暗色' },
    { key: 'amoled', label: '纯黑' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.section, { color: colors.onSurface }]}>主题色</Text>
        <View style={styles.colorRow}>
          {SEED_COLORS.map((c) => (
            <Pressable
              key={c.name}
              onPress={() => setSeedColor(c.name)}
              style={[
                styles.colorCircle,
                { backgroundColor: c.primary },
                seedColor.name === c.name && { borderWidth: 3, borderColor: colors.onSurface },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.section, { color: colors.onSurface }]}>显示模式</Text>
        <View style={styles.modeRow}>
          {modes.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => setColorMode(m.key)}
              style={[
                styles.modeBtn,
                { borderColor: colorMode === m.key ? colors.primary : colors.outline },
                colorMode === m.key && { backgroundColor: colors.primary + '18' },
              ]}
            >
              <Text style={{ color: colorMode === m.key ? colors.primary : colors.onSurface }}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.section, { color: colors.onSurface }]}>RSSHub 地址</Text>
        <View style={styles.urlRow}>
          <TextInput
            style={[styles.urlInput, { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surfaceVariant }]}
            value={rsshubUrl}
            onChangeText={setRsshubUrl}
            autoCapitalize="none"
          />
          <Pressable onPress={saveRsshubUrl} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary }}>保存</Text>
          </Pressable>
        </View>

        <Text style={[styles.section, { color: colors.onSurface }]}>存储管理</Text>
        <Pressable onPress={handleCleanup} style={[styles.cleanupBtn, { borderColor: colors.outline }]}>
          <Text style={{ color: colors.error }}>清理 7 天前的已读文章</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  section: { fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  colorRow: { flexDirection: 'row', gap: 14 },
  colorCircle: { width: 40, height: 40, borderRadius: 20 },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  urlRow: { flexDirection: 'row', gap: 8 },
  urlInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  saveBtn: { paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  cleanupBtn: { borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
});
```

- [ ] **Step 3: Update ProfileScreen as a menu hub**

Replace `src/screens/profile/ProfileScreen.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { getReadingStats } from '@/db/articles';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState({ today: 0, week: 0 });

  useEffect(() => { getReadingStats().then(setStats); }, []);

  const menuItems = [
    { icon: 'star', label: '我的收藏', screen: 'Bookmarks' },
    { icon: 'rss', label: '订阅源管理', screen: 'FeedManager' },
    { icon: 'cog', label: '设置', screen: 'Settings' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{stats.today}</Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>今日已读</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.outline }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{stats.week}</Text>
          <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>本周已读</Text>
        </View>
      </View>

      {menuItems.map((item) => (
        <Pressable
          key={item.screen}
          onPress={() => navigation.navigate(item.screen)}
          style={[styles.menuItem, { borderBottomColor: colors.outline }]}
        >
          <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.onSurface} />
          <Text style={[styles.menuLabel, { color: colors.onSurface }]}>{item.label}</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsCard: {
    flexDirection: 'row', margin: 16, borderRadius: 12, padding: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 32, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 4 },
  divider: { width: 1, height: 40 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  menuLabel: { flex: 1, fontSize: 16 },
});
```

- [ ] **Step 4: Add all stack routes to Navigation.tsx**

In `src/app/Navigation.tsx`, add the new imports and Stack screens:

```tsx
import BookmarksScreen from '@/screens/profile/BookmarksScreen';
import FeedManagerScreen from '@/screens/profile/FeedManagerScreen';
import SettingsScreen from '@/screens/profile/SettingsScreen';

// Inside Stack.Navigator, after Reader:
<Stack.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: '我的收藏', headerShown: true }} />
<Stack.Screen name="FeedManager" component={FeedManagerScreen} options={{ title: '订阅源管理', headerShown: true }} />
<Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '设置', headerShown: true }} />
```

Note: FeedManagerScreen is similar to the feed list in DiscoverScreen but with edit/delete — create a minimal version:

Create `src/screens/profile/FeedManagerScreen.tsx`:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/ThemeContext';
import { getAllFeeds, deleteFeed, type FeedWithMeta } from '@/db/feeds';
import EmptyState from '@/components/EmptyState';

export default function FeedManagerScreen() {
  const { colors } = useTheme();
  const [feeds, setFeeds] = useState<FeedWithMeta[]>([]);

  const load = useCallback(async () => {
    setFeeds(await getAllFeeds());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (feed: FeedWithMeta) => {
    Alert.alert('删除订阅', `确定删除「${feed.title}」？`, [
      { text: '取消' },
      { text: '删除', style: 'destructive', onPress: async () => { await deleteFeed(feed.id); load(); } },
    ]);
  };

  const renderItem = ({ item }: { item: FeedWithMeta }) => (
    <View style={[styles.row, { borderBottomColor: colors.outline }]}>
      <View style={styles.info}>
        <Text style={[styles.feedTitle, { color: colors.onSurface }]}>{item.title}</Text>
        <Text style={[styles.feedMeta, { color: colors.onSurfaceVariant }]}>
          {item.topic_name} · {item.unread_count} 未读
        </Text>
      </View>
      <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
        <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[]}>
      <FlashList
        data={feeds}
        renderItem={renderItem}
        estimatedItemSize={70}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<EmptyState icon="rss" message="还没有订阅源" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1 },
  feedTitle: { fontSize: 15, fontWeight: '500' },
  feedMeta: { fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 8 },
});
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/profile/ src/app/Navigation.tsx
git commit -m "feat: profile screen with bookmarks, feed manager, settings, and reading stats"
```

---

## Task 17: First-Run Experience and Final Integration

**Files:**
- Modify: `src/screens/home/HomeScreen.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add first-run detection to HomeScreen**

In `src/screens/home/HomeScreen.tsx`, after loading articles, check if there are any feeds. If none, show an empty state pointing to Discover:

```tsx
import { getAllFeeds } from '@/db/feeds';

// Inside HomeScreen component, add:
const [hasFeeds, setHasFeeds] = useState(true);

useEffect(() => {
  getAllFeeds().then((feeds) => setHasFeeds(feeds.length > 0));
}, []);

// In render, before the mode content:
if (!hasFeeds) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <EmptyState
        icon="rss"
        message="欢迎使用华读！先去发现页订阅一些话题吧"
        actionLabel="去发现"
        onAction={() => navigation.navigate('DiscoverTab' as any)}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Add auto-cleanup on app start**

In `src/app/Providers.tsx`, run cleanup after DB init:

```tsx
import { cleanupOldArticles } from '@/db/articles';

// Inside the useEffect, after initDatabase():
await initDatabase();
await cleanupOldArticles(7);
setDbReady(true);
```

- [ ] **Step 3: Run full app on Android and verify**

```bash
npx expo start --android
```

Verify:
- Bottom tabs navigate correctly
- First-run shows "go to discover" prompt
- Can subscribe to topics in Discover
- Articles appear after sync
- Swipe mode works
- List mode works
- Reader displays themed content
- Settings change theme colors
- Bookmarks persist

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: first-run experience and auto article cleanup"
```

---

## Task 18: App Auto-Update from GitHub Releases

**Files:**
- Create: `src/services/updater.ts`
- Create: `src/components/UpdateDialog.tsx`
- Modify: `src/app/Providers.tsx`

- [ ] **Step 1: Create updater service**

Create `src/services/updater.ts`:

```ts
import * as FileSystem from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';
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

    const apkAsset = release.assets?.find(
      (a: any) => a.name?.endsWith('.apk')
    );
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

  await startActivityAsync('android.intent.action.VIEW', {
    data: download.uri,
    type: 'application/vnd.android.package-archive',
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
  });
}
```

- [ ] **Step 2: Create UpdateDialog component**

Create `src/components/UpdateDialog.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { ReleaseInfo } from '@/services/updater';
import { downloadAndInstallApk } from '@/services/updater';

interface Props {
  release: ReleaseInfo;
  onDismiss: () => void;
}

export default function UpdateDialog({ release, onDismiss }: Props) {
  const { colors } = useTheme();
  const [downloading, setDownloading] = useState(false);

  const handleUpdate = async () => {
    setDownloading(true);
    try {
      await downloadAndInstallApk(release.downloadUrl);
    } catch {
      setDownloading(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.onSurface }]}>发现新版本 v{release.version}</Text>
          {release.releaseNotes ? (
            <Text style={[styles.notes, { color: colors.onSurfaceVariant }]} numberOfLines={6}>
              {release.releaseNotes}
            </Text>
          ) : null}
          <View style={styles.buttons}>
            <Pressable onPress={onDismiss} style={[styles.btn, { borderColor: colors.outline }]}>
              <Text style={{ color: colors.onSurface }}>稍后</Text>
            </Pressable>
            <Pressable
              onPress={handleUpdate}
              disabled={downloading}
              style={[styles.btn, styles.primaryBtn, { backgroundColor: colors.primary }]}
            >
              {downloading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>立即更新</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  dialog: { width: '82%', borderRadius: 16, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  notes: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 24, alignItems: 'center', borderWidth: 1 },
  primaryBtn: { borderWidth: 0 },
});
```

- [ ] **Step 3: Integrate update check into Providers.tsx**

In `src/app/Providers.tsx`, after DB init and cleanup, check for updates:

```tsx
import { checkForUpdate, type ReleaseInfo } from '@/services/updater';
import UpdateDialog from '@/components/UpdateDialog';

// Add state:
const [updateInfo, setUpdateInfo] = useState<ReleaseInfo | null>(null);

// In useEffect, after cleanup:
const release = await checkForUpdate();
if (release) setUpdateInfo(release);

// In render, after children:
{updateInfo && <UpdateDialog release={updateInfo} onDismiss={() => setUpdateInfo(null)} />}
```

- [ ] **Step 4: Install expo-intent-launcher**

```bash
npx expo install expo-intent-launcher
```

- [ ] **Step 5: Commit**

```bash
git add src/services/updater.ts src/components/UpdateDialog.tsx src/app/Providers.tsx
git commit -m "feat: auto-update from GitHub Releases with download and install"
```

---

## Task 19: GitHub Actions CI — Build APK and Create Release

**Files:**
- Create: `.github/workflows/build-release.yml`

- [ ] **Step 1: Create GitHub Actions workflow**

Create `.github/workflows/build-release.yml`:

```yaml
name: Build and Release APK

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build APK
        run: |
          npx expo prebuild --platform android --clean
          cd android
          ./gradlew assembleRelease

      - name: Get version from tag
        id: version
        run: echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          name: "v${{ steps.version.outputs.version }}"
          body: "Hua Reader v${{ steps.version.outputs.version }}"
          files: android/app/build/outputs/apk/release/*.apk
```

- [ ] **Step 2: Commit the workflow**

```bash
git add .github/
git commit -m "ci: GitHub Actions workflow to build APK and publish to Releases"
```

- [ ] **Step 3: Document the release process**

To release a new version:
1. Update `version` in `app.json` (e.g., `"1.0.1"`)
2. Commit the change
3. Tag and push:
```bash
git tag v1.0.1
git push origin main --tags
```
4. GitHub Actions will automatically build the APK and create a Release
5. Users running the app will see the update dialog on next launch

---

## Dependency Summary

```
Task 1  (scaffold)
  └→ Task 2  (utils)
  └→ Task 3  (DB schema)
      └→ Task 4  (topics + feeds CRUD)
      └→ Task 5  (articles CRUD)
          └→ Task 6  (RSS parser)
              └→ Task 7  (feed sync + built-in topics)
          └→ Task 8  (OPML)
          └→ Task 9  (article HTML renderer)
      └→ Task 10 (theme system)
          └→ Task 11 (app shell + navigation)
              └→ Task 12 (list mode)
              └→ Task 13 (swipe mode)
              └→ Task 14 (reader screen)
              └→ Task 15 (discover screen)
              └→ Task 16 (profile + settings)
                  └→ Task 17 (first-run + integration)
                      └→ Task 18 (auto-update from GitHub Releases)
                          └→ Task 19 (GitHub Actions CI)
```
