import { getTimeAgo, formatDate } from '../../lib/dateUtils';

// Fake i18n t(): echo the key, and append the count when provided, so we can
// assert which branch ran and with what value without pulling in real i18n.
const t = ((key: string, opts?: { count?: number }) =>
  opts && typeof opts.count === 'number' ? `${key}:${opts.count}` : key) as any;

const isoAgo = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();

describe('dateUtils.getTimeAgo', () => {
  it('returns empty string for invalid/empty input (no literal "Invalid Date")', () => {
    expect(getTimeAgo('', t, 'en')).toBe('');
    expect(getTimeAgo('not-a-date', t, 'en')).toBe('');
  });

  it('returns just_now under a minute', () => {
    expect(getTimeAgo(isoAgo(30), t, 'en')).toBe('time.just_now');
  });

  it('returns minutes_ago with the floored count', () => {
    expect(getTimeAgo(isoAgo(5 * 60 + 20), t, 'en')).toBe('time.minutes_ago:5');
  });

  it('returns hours_ago with the floored count', () => {
    expect(getTimeAgo(isoAgo(3 * 3600 + 200), t, 'en')).toBe('time.hours_ago:3');
  });

  it('returns days_ago with the floored count', () => {
    expect(getTimeAgo(isoAgo(2 * 86400 + 500), t, 'en')).toBe('time.days_ago:2');
  });

  it('falls back to a formatted date beyond a week', () => {
    const result = getTimeAgo(isoAgo(10 * 86400), t, 'en');
    expect(result).not.toMatch(/^time\./);
    expect(result).not.toBe('Invalid Date');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('dateUtils.formatDate', () => {
  it('returns empty string for invalid input', () => {
    expect(formatDate('', 'en')).toBe('');
    expect(formatDate('nope', 'en')).toBe('');
  });

  it('formats a valid date without rendering "Invalid Date"', () => {
    const result = formatDate('2026-06-14T00:00:00.000Z', 'en');
    expect(result).not.toBe('Invalid Date');
    expect(result.length).toBeGreaterThan(0);
  });
});
