import React, { useEffect, useState, type ReactNode } from 'react';
import { initDatabase } from '@/db/database';
import { cleanupOldArticles } from '@/db/articles';
import { getAllFeeds, insertFeed } from '@/db/feeds';
import { getAllTopics, insertTopic } from '@/db/topics';
import { BUILT_IN_TOPICS } from '@/services/built-in-topics';
import { ThemeProvider } from '@/theme/ThemeContext';

async function autoSubscribeIfEmpty() {
  const feeds = await getAllFeeds();
  if (feeds.length > 0) return;

  for (const topic of BUILT_IN_TOPICS) {
    const topics = await getAllTopics();
    let existing = topics.find((t) => t.name === topic.name);
    const topicId = existing ? existing.id : await insertTopic(topic.name, topic.icon, true);
    for (const feed of topic.feeds) {
      await insertFeed(feed.title, feed.route, topicId, feed.type || 'rsshub');
    }
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await cleanupOldArticles(30);
        await autoSubscribeIfEmpty();
      } catch (err) {
        console.error('DB init failed:', err);
      }
      setDbReady(true);
    })();
  }, []);

  if (!dbReady) return null;

  return <ThemeProvider>{children}</ThemeProvider>;
}
