export interface ReadingPrefs {
  fontSize: number;
  lineHeight: number;
  backgroundColor: string;
}

export interface ReadingBgOption {
  name: string;
  backgroundColor: string;
  textColor: string;
}

export const READING_BG_OPTIONS: ReadingBgOption[] = [
  { name: '白色', backgroundColor: '#FFFFFF', textColor: '#1C1B1F' },
  { name: '米黄', backgroundColor: '#FFF8E7', textColor: '#3D3426' },
  { name: '灰色', backgroundColor: '#F5F5F5', textColor: '#2C2C2C' },
  { name: '暗色', backgroundColor: '#1a1a1a', textColor: '#D4D4D4' },
];

export const DEFAULT_READING_PREFS: ReadingPrefs = {
  fontSize: 17,
  lineHeight: 1.8,
  backgroundColor: '#FFFFFF',
};
