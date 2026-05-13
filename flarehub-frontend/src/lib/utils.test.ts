import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cn, timeAgo, formatDate, formatFileSize, initials } from './utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('merges conflicting Tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-green-500')).toBe('text-green-500');
  });

  it('handles undefined and null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });
});

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-17T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns "just now" for < 60s', () => {
    const d = new Date('2026-04-17T11:59:30Z');
    expect(timeAgo(d)).toBe('just now');
  });

  it('returns minutes for < 1h', () => {
    const d = new Date('2026-04-17T11:30:00Z');
    expect(timeAgo(d)).toBe('30m ago');
  });

  it('returns hours for < 24h', () => {
    const d = new Date('2026-04-17T09:00:00Z');
    expect(timeAgo(d)).toBe('3h ago');
  });

  it('returns days for < 7d', () => {
    const d = new Date('2026-04-15T12:00:00Z');
    expect(timeAgo(d)).toBe('2d ago');
  });

  it('returns formatted date for >= 7d', () => {
    const d = new Date('2026-04-01T12:00:00Z');
    const result = timeAgo(d);
    expect(result).not.toMatch(/ago/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('accepts string dates', () => {
    expect(timeAgo('2026-04-17T11:59:30Z')).toBe('just now');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });

  it('formats fractional MB', () => {
    expect(formatFileSize(1572864)).toBe('1.5 MB');
  });
});

describe('initials', () => {
  it('returns initials for first and last name', () => {
    expect(initials('John', 'Doe')).toBe('JD');
  });

  it('returns single initial when only first name', () => {
    expect(initials('John', '')).toBe('J');
  });

  it('returns ? for empty names', () => {
    expect(initials('', '')).toBe('?');
  });

  it('handles null values', () => {
    expect(initials(null, null)).toBe('?');
  });

  it('uppercases initials', () => {
    expect(initials('alice', 'baker')).toBe('AB');
  });
});

describe('formatDate', () => {
  it('returns a non-empty string for a valid date', () => {
    const result = formatDate('2026-04-17T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('accepts a Date object', () => {
    const result = formatDate(new Date('2026-01-01'));
    expect(typeof result).toBe('string');
  });
});
