import React, { useEffect, useState, type ReactNode } from 'react';
import { initDatabase } from '@/db/database';
import { cleanupOldArticles } from '@/db/articles';
import { ThemeProvider } from '@/theme/ThemeContext';

export function Providers({ children }: { children: ReactNode }) {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await cleanupOldArticles(30);
      } catch (err) {
        console.error('DB init failed:', err);
      }
      setDbReady(true);
    })();
  }, []);

  if (!dbReady) return null;

  return <ThemeProvider>{children}</ThemeProvider>;
}
