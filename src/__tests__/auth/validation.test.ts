// NOTE: these regexes mirror the inline validation used across the auth screens
// (LoginScreen, RegisterScreen, ParentLoginScreen, ParentRegisterScreen, ...).
// They are duplicated here because the app does not yet expose a shared validator
// module. TODO: extract `src/utils/validators.ts` as the single source of truth and
// import it both here and in the screens, so this suite tests production code directly.
const EGYPT_MOBILE_REGEX = /^01[0125]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

describe('Auth Validation Rules', () => {
  describe('Egyptian mobile', () => {
    test.each([
      ['01007867184', 'Vodafone 010 prefix'],
      ['01123456789', 'Etisalat 011 prefix'],
      ['01234567890', 'Orange 012 prefix'],
      ['01555555555', 'WE 015 prefix'],
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

  describe('Email', () => {
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

  describe('Strong password (min 8, upper, lower, digit, special)', () => {
    test.each(['DemoPass1!', 'Aabcd4#z', 'SecurePassword123$', 'My$p@ssw0rd!'])(
      'accepts %s',
      (pwd) => {
        expect(STRONG_PASSWORD_REGEX.test(pwd)).toBe(true);
      },
    );

    test.each([
      ['demopass1!', 'no uppercase'],
      ['DEMOPASS1!', 'no lowercase'],
      ['DemoPass!', 'no digit'],
      ['DemoPass123', 'no special char'],
      ['Short1!', 'fewer than 8 chars'],
      ['', 'empty'],
    ])('rejects %s (%s)', (pwd) => {
      expect(STRONG_PASSWORD_REGEX.test(pwd)).toBe(false);
    });
  });
});
