import { validatePasswordChange } from '../../utils/passwordChange';

const form = (over: Partial<Record<string, string>> = {}) => ({
  currentPassword: 'OldPass1!',
  newPassword: 'DemoPass1!',
  confirmPassword: 'DemoPass1!',
  ...over,
});

describe('validatePasswordChange', () => {
  it('accepts a complete, policy-compliant form', () => {
    expect(validatePasswordChange(form())).toBeNull();
  });

  it('requires the current password', () => {
    expect(validatePasswordChange(form({ currentPassword: '' }))).toBe('auth.fill_all_fields');
  });

  it('requires a new password', () => {
    expect(validatePasswordChange(form({ newPassword: '' }))).toBe('auth.fill_all_fields');
  });

  it('enforces the 8-character policy', () => {
    expect(validatePasswordChange(form({ newPassword: 'short', confirmPassword: 'short' }))).toBe(
      'auth.password_min_8',
    );
  });

  it('accepts exactly 8 characters', () => {
    expect(
      validatePasswordChange(form({ newPassword: 'eightchr', confirmPassword: 'eightchr' })),
    ).toBeNull();
  });

  it('rejects a mismatched confirmation', () => {
    expect(validatePasswordChange(form({ confirmPassword: 'DemoPass2!' }))).toBe(
      'profile.passwords_dont_match',
    );
  });

  it('reports the length problem before the mismatch', () => {
    // A too-short password is the more actionable message of the two.
    expect(validatePasswordChange(form({ newPassword: 'short', confirmPassword: 'other' }))).toBe(
      'auth.password_min_8',
    );
  });
});
