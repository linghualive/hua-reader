import React, { useEffect, useState, type ReactNode } from 'react';
import { initDatabase } from '@/db/database';
import { ThemeProvider } from '@/theme/ThemeContext';

export function Providers({ children }: { children: ReactNode }) {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => console.error('DB init failed:', err));
  }, []);

  if (!dbReady) return null;

  return <ThemeProvider>{children}</ThemeProvider>;
}
