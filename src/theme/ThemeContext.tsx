import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getSetting, setSetting } from '@/db/settings';
import {
  SEED_COLORS,
  generatePalette,
  type SeedColor,
  type ColorMode,
  type AppColors,
} from './colors';
import { DEFAULT_READING_PREFS, type ReadingPrefs } from './reading';

interface ThemeContextValue {
  seedColor: SeedColor;
  colorMode: ColorMode;
  colors: AppColors;
  readingPrefs: ReadingPrefs;
  setSeedColor: (color: SeedColor) => void;
  setColorMode: (mode: ColorMode) => void;
  setReadingPrefs: (prefs: ReadingPrefs) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [seedColor, setSeedColorState] = useState<SeedColor>(SEED_COLORS[0]);
  const [colorMode, setColorModeState] = useState<ColorMode>('light');
  const [readingPrefs, setReadingPrefsState] = useState<ReadingPrefs>(DEFAULT_READING_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedSeed = await getSetting('theme_seed_color');
        if (savedSeed) {
          const found = SEED_COLORS.find((c) => c.name === savedSeed);
          if (found) setSeedColorState(found);
        }

        const savedMode = await getSetting('theme_color_mode');
        if (savedMode && ['light', 'dark', 'amoled'].includes(savedMode)) {
          setColorModeState(savedMode as ColorMode);
        }

        const savedReading = await getSetting('reading_prefs');
        if (savedReading) {
          setReadingPrefsState({ ...DEFAULT_READING_PREFS, ...JSON.parse(savedReading) });
        }
      } catch {
        // Use defaults on error
      }
      setLoaded(true);
    })();
  }, []);

  const setSeedColor = useCallback((color: SeedColor) => {
    setSeedColorState(color);
    setSetting('theme_seed_color', color.name).catch(() => {});
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    setSetting('theme_color_mode', mode).catch(() => {});
  }, []);

  const setReadingPrefs = useCallback((prefs: ReadingPrefs) => {
    setReadingPrefsState(prefs);
    setSetting('reading_prefs', JSON.stringify(prefs)).catch(() => {});
  }, []);

  const colors = generatePalette(seedColor.primary, colorMode);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider
      value={{
        seedColor,
        colorMode,
        colors,
        readingPrefs,
        setSeedColor,
        setColorMode,
        setReadingPrefs,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
