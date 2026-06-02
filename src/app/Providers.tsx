import React, { useEffect, useState, type ReactNode } from 'react';
import { initDatabase } from '@/db/database';
import { cleanupOldArticles } from '@/db/articles';
import { ThemeProvider } from '@/theme/ThemeContext';
import { checkForUpdate, type ReleaseInfo } from '@/services/updater';
import { UpdateDialog } from '@/components/UpdateDialog';

export function Providers({ children }: { children: ReactNode }) {
  const [dbReady, setDbReady] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<ReleaseInfo | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        // Auto-cleanup articles older than 7 days on app start
        await cleanupOldArticles(7);
      } catch (err) {
        console.error('DB init failed:', err);
      }
      setDbReady(true);

      // Check for app updates after init (non-blocking)
      try {
        const release = await checkForUpdate();
        if (release) setUpdateInfo(release);
      } catch {
        // Silently ignore update check failures
      }
    })();
  }, []);

  if (!dbReady) return null;

  return (
    <ThemeProvider>
      {children}
      {updateInfo && (
        <UpdateDialog
          releaseInfo={updateInfo}
          onDismiss={() => setUpdateInfo(null)}
        />
      )}
    </ThemeProvider>
  );
}
