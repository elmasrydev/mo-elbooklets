const EGYPT_MOBILE_REGEX = /^01[0125]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

describe('Auth Validation Rules', () => {
  describe('Egyptian Mobile Regex', () => {
    it('should validate correct Egyptian mobile numbers', () => {
      const validNumbers = ['01007867184', '01123456789', '01234567890', '01555555555'];
      validNumbers.forEach((num) => {
        expect(EGYPT_MOBILE_REGEX.test(num)).toBe(true);
      });
    });

    it('should reject invalid mobile numbers', () => {
      const invalidNumbers = [
        '01307867184', // Invalid prefix (013)
        '0100786718', // Too short (10 digits)
        '010078671845', // Too long (12 digits)
        '1007867184', // Missing leading zero
        'abcdefghijk', // Non-numeric
        '', // Empty
      ];
      invalidNumbers.forEach((num) => {
        expect(EGYPT_MOBILE_REGEX.test(num)).toBe(false);
      });
    });
  });

  describe('Email Regex', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@test.com',
        'user.name@domain.co.uk',
        'first-last@sub.domain.org',
        'student123@elbooklets.com',
      ];
      validEmails.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'test.com', // Missing @
        'test@', // Missing domain
        '@domain.com', // Missing local part
        'test@domain', // Missing TLD extension
        'test @domain.com', // Contains space
        '', // Empty
      ];
      invalidEmails.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(false);
      });
    });
  });

  describe('Strong Password Regex', () => {
    it('should validate strong passwords conforming to policy (min 8 chars, uppercase, lowercase, digit, special)', () => {
      const strongPasswords = ['DemoPass1!', 'Aabcd4#z', 'SecurePassword123$', 'My$p@ssw0rd!'];
      strongPasswords.forEach((pwd) => {
        expect(STRONG_PASSWORD_REGEX.test(pwd)).toBe(true);
      });
    });

    it('should reject weak passwords failing the policy', () => {
      const weakPasswords = [
        'demopass1!', // No uppercase
        'DEMOPASS1!', // No lowercase
        'DemoPass!', // No digit
        'DemoPass123', // No special char
        'Short1!', // Less than 8 characters (7 chars)
        '', // Empty
      ];
      weakPasswords.forEach((pwd) => {
        expect(STRONG_PASSWORD_REGEX.test(pwd)).toBe(false);
      });
    });
  });
});
