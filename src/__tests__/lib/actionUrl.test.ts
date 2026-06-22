import { extractUserIdFromActionUrl } from '../../utils/actionUrl';

describe('extractUserIdFromActionUrl', () => {
  it('returns null for empty / nullish input', () => {
    expect(extractUserIdFromActionUrl(null)).toBeNull();
    expect(extractUserIdFromActionUrl(undefined)).toBeNull();
    expect(extractUserIdFromActionUrl('')).toBeNull();
    expect(extractUserIdFromActionUrl('   ')).toBeNull();
  });

  it('parses a numeric trailing path segment', () => {
    expect(extractUserIdFromActionUrl('/students/123')).toBe('123');
    expect(extractUserIdFromActionUrl('https://elbooklets.com/profile/456')).toBe('456');
    expect(extractUserIdFromActionUrl('/community/students/789/')).toBe('789');
  });

  it('parses a UUID trailing path segment', () => {
    const uuid = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    expect(extractUserIdFromActionUrl(`/profile/${uuid}`)).toBe(uuid);
  });

  it('parses an id from a query param', () => {
    expect(extractUserIdFromActionUrl('/profile?userId=42')).toBe('42');
    expect(extractUserIdFromActionUrl('app://open?user_id=42&ref=push')).toBe('42');
    expect(extractUserIdFromActionUrl('/x?student_id=99')).toBe('99');
    expect(extractUserIdFromActionUrl('/x?id=7')).toBe('7');
  });

  it('ignores non-id trailing segments', () => {
    expect(extractUserIdFromActionUrl('/profile/edit')).toBeNull();
    expect(extractUserIdFromActionUrl('/community')).toBeNull();
  });

  it('prefers an explicit query id over the path', () => {
    expect(extractUserIdFromActionUrl('/students/list?userId=55')).toBe('55');
  });
});
