import { relativeTime } from '@/lib/utils/relativeTime';

// Helper: returns ISO string for a date N seconds in the past
const secondsAgo = (s: number) => new Date(Date.now() - s * 1000).toISOString();
const minutesAgo = (m: number) => secondsAgo(m * 60);
const hoursAgo = (h: number) => secondsAgo(h * 3600);
const daysAgo = (d: number) => secondsAgo(d * 86400);

describe('relativeTime', () => {
  it('returns "just now" / seconds description for < 1 minute ago', () => {
    const result = relativeTime(secondsAgo(30));
    // Intl.RelativeTimeFormat with numeric:'auto' returns "X seconds ago" or "now"
    expect(result).toMatch(/second|now/i);
  });

  it('returns minutes description for 2 minutes ago', () => {
    const result = relativeTime(minutesAgo(2));
    expect(result).toMatch(/minute/i);
  });

  it('returns hours description for 3 hours ago', () => {
    const result = relativeTime(hoursAgo(3));
    expect(result).toMatch(/hour/i);
  });

  it('returns days description for 2 days ago', () => {
    const result = relativeTime(daysAgo(2));
    expect(result).toMatch(/day/i);
  });

  it('returns days description for 10 days ago', () => {
    const result = relativeTime(daysAgo(10));
    expect(result).toMatch(/day/i);
  });

  it('throws or returns a string for an invalid date string', () => {
    // NaN date produces Infinity, which Intl.RelativeTimeFormat cannot handle
    // The function is expected to throw a RangeError in this case
    expect(() => relativeTime('not-a-date')).toThrow(RangeError);
  });

  it('returns "just now" or 0 seconds for current time', () => {
    const result = relativeTime(new Date().toISOString());
    expect(result).toMatch(/now|second/i);
  });
});
