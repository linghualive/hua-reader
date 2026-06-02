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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.max(0, Math.round(r * (1 - amount)));
  const ng = Math.max(0, Math.round(g * (1 - amount)));
  const nb = Math.max(0, Math.round(b * (1 - amount)));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

export function generatePalette(seedHex: string, mode: ColorMode): AppColors {
  switch (mode) {
    case 'light':
      return {
        primary: seedHex,
        onPrimary: '#FFFFFF',
        surface: '#FFFFFF',
        onSurface: '#1C1B1F',
        surfaceVariant: '#F3F3F6',
        onSurfaceVariant: '#49454F',
        background: '#F8F8FA',
        outline: '#CAC4D0',
        error: '#B3261E',
        cardBackground: '#FFFFFF',
      };
    case 'dark':
      return {
        primary: lighten(seedHex, 0.3),
        onPrimary: '#FFFFFF',
        surface: '#18181B',
        onSurface: '#E6E1E5',
        surfaceVariant: '#252529',
        onSurfaceVariant: '#CAC4D0',
        background: '#111113',
        outline: '#49454F',
        error: '#F2B8B5',
        cardBackground: '#1E1E22',
      };
    case 'amoled':
      return {
        primary: lighten(seedHex, 0.35),
        onPrimary: '#FFFFFF',
        surface: '#000000',
        onSurface: '#E6E1E5',
        surfaceVariant: '#1A1A1A',
        onSurfaceVariant: '#CAC4D0',
        background: '#000000',
        outline: '#49454F',
        error: '#F2B8B5',
        cardBackground: '#0D0D0D',
      };
  }
}
