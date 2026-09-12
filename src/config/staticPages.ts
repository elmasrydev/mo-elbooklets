import type { Ionicons } from '@expo/vector-icons';

export interface StaticPageEntry {
  /** CMS slug, passed to `page(slug:)`. */
  slug: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Bundled label for the menu row and the screen header. */
  labelKey: string;
}

/**
 * The CMS pages the app links to, in menu order (BKLT-300).
 *
 * An explicit list rather than the CMS's own `pages` query, for three reasons:
 * - its `order` field is 0 for refund-policy and shipping-policy (created
 *   2026-07-08, after the rest were numbered 1–5 on 2026-02-24), so sorting
 *   on it puts the newest pages first;
 * - its `icon` values are web heroicon names (`heroicon-o-banknotes`), which
 *   Ionicons cannot draw;
 * - a page someone adds to the CMS later should not appear in the app
 *   unannounced.
 *
 * `faq` and `contact-us` also exist in the CMS; the app has its own screens
 * for both, so they are not listed here.
 */
export const STATIC_PAGES: readonly StaticPageEntry[] = [
  { slug: 'about-us', icon: 'information-circle-outline', labelKey: 'static_pages.about_us' },
  { slug: 'terms-and-conditions', icon: 'document-text-outline', labelKey: 'static_pages.terms' },
  { slug: 'privacy-policy', icon: 'shield-checkmark-outline', labelKey: 'static_pages.privacy' },
  { slug: 'refund-policy', icon: 'cash-outline', labelKey: 'static_pages.refund' },
  { slug: 'shipping-policy', icon: 'cube-outline', labelKey: 'static_pages.shipping' },
];
