import { PASSWORD_REGEX } from './validators';

/**
 * Client-side gate for the in-profile change-password form.
 *
 * Returns the translation key of the first problem, or `null` when the form is
 * ready to submit. Keeping it here rather than inline in the screen means the
 * rules are testable without mounting the whole profile editor, and they cannot
 * drift from `PASSWORD_REGEX`, which is the single source of truth for the
 * 8-character policy.
 *
 * This is a UX guard, not a security boundary — the backend still verifies the
 * current password and re-applies the policy.
 */
export const validatePasswordChange = ({
  currentPassword,
  newPassword,
  confirmPassword,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): string | null => {
  if (!currentPassword || !newPassword) return 'auth.fill_all_fields';
  if (!PASSWORD_REGEX.test(newPassword)) return 'auth.password_min_8';
  if (newPassword !== confirmPassword) return 'profile.passwords_dont_match';
  return null;
};
