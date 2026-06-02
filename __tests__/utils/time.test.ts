import { relativeTime } from '@/utils/time';

describe('relativeTime', () => {
  const now = new Date('2026-06-02T12:00:00Z');

  it('returns 刚刚 for less than 1 minute ago', () => {
    const date = new Date('2026-06-02T11:59:30Z');
    expect(relativeTime(date, now)).toBe('刚刚');
  });

  it('returns minutes ago for less than 1 hour', () => {
    const date = new Date('2026-06-02T11:30:00Z');
    expect(relativeTime(date, now)).toBe('30分钟前');
  });

  it('returns 1分钟前 for exactly 1 minute', () => {
    const date = new Date('2026-06-02T11:59:00Z');
    expect(relativeTime(date, now)).toBe('1分钟前');
  });

  it('returns 59分钟前 for 59 minutes', () => {
    const date = new Date('2026-06-02T11:01:00Z');
    expect(relativeTime(date, now)).toBe('59分钟前');
  });

  it('returns hours ago for less than 24 hours', () => {
    const date = new Date('2026-06-02T06:00:00Z');
    expect(relativeTime(date, now)).toBe('6小时前');
  });

  it('returns 1小时前 for exactly 1 hour', () => {
    const date = new Date('2026-06-02T11:00:00Z');
    expect(relativeTime(date, now)).toBe('1小时前');
  });

  it('returns 昨天 for 1-2 days ago', () => {
    const date = new Date('2026-06-01T10:00:00Z');
    expect(relativeTime(date, now)).toBe('昨天');
  });

  it('returns MM-DD for dates older than 2 days', () => {
    const date = new Date('2026-05-15T10:00:00Z');
    expect(relativeTime(date, now)).toBe('05-15');
  });

  it('returns MM-DD for dates more than 2 days ago', () => {
    const date = new Date('2026-01-03T00:00:00Z');
    expect(relativeTime(date, now)).toBe('01-03');
  });

  it('uses current time as default for now parameter', () => {
    const recentDate = new Date(Date.now() - 10000); // 10 seconds ago
    expect(relativeTime(recentDate)).toBe('刚刚');
  });
});
