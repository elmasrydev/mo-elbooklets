import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { isArabicText } from '../config/fonts';

/**
 * useSubjectTextAlign Hook
 *
 * Provides alignment values for subject-specific content based on the subject's
 * language, correctly accounting for the app's current UI language (RTL/LTR).
 *
 * ## The Problem
 * React Native automatically flips layout properties in RTL mode:
 *   - `flexDirection: 'row'` → visually becomes right-to-left
 *   - `alignItems: 'flex-start'` → visually anchors to the right side
 *   - `marginLeft`/`marginRight` → are physically swapped
 *   - `textAlign: 'left'`/`'right'` → are NOT auto-flipped (always absolute)
 *
 * ## Decision Logic
 * We compute `directionsMismatch = isSubjectRTL !== isAppRTL`.
 *
 * - When they MATCH (e.g., AR app + AR subject, EN app + EN subject):
 *     → Use `row` + `flex-start`. RN's built-in RTL handling makes it correct
 *       visually for both cases.
 *
 * - When they MISMATCH (e.g., EN app + AR subject, AR app + EN subject):
 *     → Use `row-reverse` + `flex-end` to counteract or force the opposite direction.
 *       In EN app: `row-reverse` forces RTL for AR content.
 *       In AR app: `row-reverse` counteracts RN's auto-flip, resulting in LTR for EN content.
 *
 * - `textAlign`: follows the same mismatch rule, because RN DOES flip
 *   `left`/`right` for `<Text>` in RTL (only TextInput keeps them physical —
 *   see src/lib/rtl.ts / BKLT-312). So in an Arabic UI, `'left'` renders on the
 *   right; the mismatch value is what makes each of the four combinations land
 *   on the correct edge.
 *
 * - `isContentRTL` (for explicit `marginLeft`/`marginRight` usage):
 *   Set to `directionsMismatch`, not `isSubjectRTL`. This is because:
 *   In RTL app mode, RN swaps physical marginLeft/marginRight, so we need
 *   to invert our margin logic to compensate.
 *
 * ## Unknown subject language
 * The backend often leaves `language` empty. Treating that as English made
 * Arabic content mismatch the Arabic UI, which flipped it to the wrong edge —
 * so fall back to the script of the content itself (CLAUDE.md: the script, not
 * the UI language), and only then to the app's own direction.
 *
 * @param subjectLanguage The language code of the subject ('ar' or 'en')
 * @param sampleText Subject/lesson text used to detect the script when
 *   `subjectLanguage` is missing
 */
export const useSubjectTextAlign = (
  subjectLanguage?: string | null,
  sampleText?: string | null,
) => {
  const { isRTL: isAppRTL } = useLanguage();

  return useMemo(() => {
    const isSubjectRTL = subjectLanguage
      ? subjectLanguage.toLowerCase() === 'ar'
      : sampleText
        ? isArabicText(sampleText)
        : isAppRTL;

    // When subject direction differs from app direction, we must explicitly override.
    // When they match, React Native's built-in RTL handling is correct by default.
    const directionsMismatch = isSubjectRTL !== isAppRTL;

    return {
      // textAlign is ABSOLUTE in React Native — never auto-flipped.
      // Always derive from subject language only.
      contentAlign: (directionsMismatch ? 'right' : 'left') as 'left' | 'right',

      // flexDirection IS auto-flipped by RN in RTL mode.
      // Use 'row-reverse' only when directions mismatch, so that:
      //   - EN app + AR subject: forces visual RTL
      //   - AR app + EN subject: counteracts RN's RTL flip → visual LTR
      //   - Matching pairs: 'row' — RN handles it correctly
      contentRowDirection: (directionsMismatch ? 'row-reverse' : 'row') as 'row' | 'row-reverse',

      // alignItems IS affected by RN's RTL in a row container.
      // 'flex-start' in RTL app = visually RIGHT. 'flex-end' in RTL app = visually LEFT.
      // Use 'flex-end' only when directions mismatch (same reason as above).
      contentFlexAlign: (directionsMismatch ? 'flex-end' : 'flex-start') as
        | 'flex-start'
        | 'flex-end',

      // isContentRTL is used for explicit marginLeft/marginRight in screen styles.
      // In RTL app mode, RN physically swaps marginLeft and marginRight.
      // So to get the correct physical margin, we invert our logic when directions mismatch.
      // Result: isContentRTL === directionsMismatch ensures correct physical gaps in all 4 cases.
      isContentRTL: directionsMismatch,
    };
  }, [subjectLanguage, sampleText, isAppRTL]);
};
