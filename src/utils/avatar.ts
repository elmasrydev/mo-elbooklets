/**
 * Shared avatar helpers — colored-initials fallback used when a user has no
 * backend avatar image. On-brand palette (no purple / pink / neon).
 */
const AVATAR_PALETTE = [
  '#004A9A',
  '#1E54B8',
  '#2563eb',
  '#0d9488',
  '#16a34a',
  '#d97706',
  '#0e7490',
];

/** Deterministic on-brand color from a name (stable per user). */
export const avatarColor = (name: string): string => {
  const n = name || '';
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
};

/** Up to two uppercase initials from a name; falls back to "U". */
export const getAvatarInitials = (name: string): string => {
  const parts = (name || '')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean);
  return parts.join('').toUpperCase().substring(0, 2) || 'U';
};
