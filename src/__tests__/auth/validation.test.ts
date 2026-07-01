// Tests the SHARED regexes the auth screens actually use (src/utils/validators.ts),
// not a local copy — so a regex drift in production is caught here.
import { EGYPT_MOBILE_REGEX, EMAIL_REGEX, PASSWORD_REGEX } from '../../utils/validators';

describe('EGYPT_MOBILE_REGEX', () => {
  test.each([
    ['01007867184', 'Vodafone 010'],
    ['01123456789', 'Etisalat 011'],
    ['01234567890', 'Orange 012'],
    ['01555555555', 'WE 015'],
  ])('accepts %s (%s)', (num) => {
    expect(EGYPT_MOBILE_REGEX.test(num)).toBe(true);
  });

  test.each([
    ['01307867184', 'invalid 013 prefix'],
    ['0100786718', 'too short (10 digits)'],
    ['010078671845', 'too long (12 digits)'],
    ['1007867184', 'missing leading zero'],
    ['abcdefghijk', 'non-numeric'],
    ['', 'empty'],
  ])('rejects %s (%s)', (num) => {
    expect(EGYPT_MOBILE_REGEX.test(num)).toBe(false);
  });
});

describe('EMAIL_REGEX', () => {
  test.each([
    'test@test.com',
    'user.name@domain.co.uk',
    'first-last@sub.domain.org',
    'student123@elbooklets.com',
  ])('accepts %s', (email) => {
    expect(EMAIL_REGEX.test(email)).toBe(true);
  });

  test.each([
    ['test.com', 'missing @'],
    ['test@', 'missing domain'],
    ['@domain.com', 'missing local part'],
    ['test@domain', 'missing TLD'],
    ['test @domain.com', 'contains space'],
    ['', 'empty'],
  ])('rejects %s (%s)', (email) => {
    expect(EMAIL_REGEX.test(email)).toBe(false);
  });
});

describe('PASSWORD_REGEX (min 6 characters, nothing else required — BKLT-284)', () => {
  // No uppercase / digit / special requirement: 6+ chars of any kind is valid.
  test.each(['abcdef', '123456', 'password', 'ABCDEF', 'aB3$xy', 'DemoPass1!', 'مرورسر'])(
    'accepts %s (>= 6 chars)',
    (pwd) => {
      expect(PASSWORD_REGEX.test(pwd)).toBe(true);
    },
  );

  test.each([
    ['', 'empty'],
    ['a', '1 char'],
    ['abc12', '5 chars'],
  ])('rejects %s (%s)', (pwd) => {
    expect(PASSWORD_REGEX.test(pwd)).toBe(false);
  });
});
