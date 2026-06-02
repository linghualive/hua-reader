import { estimateReadingTime } from '@/utils/reading-time';

describe('estimateReadingTime', () => {
  it('returns "1 分钟" for empty string', () => {
    expect(estimateReadingTime('')).toBe('1 分钟');
  });

  it('returns "1 分钟" for very short text', () => {
    expect(estimateReadingTime('你好世界')).toBe('1 分钟');
  });

  it('returns "1 分钟" for text under 600 chars', () => {
    const text = '中'.repeat(500);
    expect(estimateReadingTime(text)).toBe('1 分钟');
  });

  it('returns "1 分钟" for exactly 600 chars', () => {
    const text = '中'.repeat(600);
    expect(estimateReadingTime(text)).toBe('1 分钟');
  });

  it('returns "2 分钟" for 601-1200 chars', () => {
    const text = '中'.repeat(601);
    expect(estimateReadingTime(text)).toBe('2 分钟');
  });

  it('returns "5 分钟" for 3000 chars', () => {
    const text = '中'.repeat(3000);
    expect(estimateReadingTime(text)).toBe('5 分钟');
  });

  it('ignores whitespace characters when counting', () => {
    const text = '中 '.repeat(600); // 600 中 + 600 spaces = strips to 600
    expect(estimateReadingTime(text)).toBe('1 分钟');
  });

  it('handles newlines and tabs as whitespace', () => {
    const text = '中\n中\t中 中';
    expect(estimateReadingTime(text)).toBe('1 分钟');
  });
});
