import { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

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
 * - `textAlign`: Always set as `'right'` for AR subject, `'left'` for EN subject.
 *   This is because textAlign is NEVER auto-flipped by React Native.
 *
 * - `isContentRTL` (for explicit `marginLeft`/`marginRight` usage):
 *   Set to `directionsMismatch`, not `isSubjectRTL`. This is because:
 *   In RTL app mode, RN swaps physical marginLeft/marginRight, so we need
 *   to invert our margin logic to compensate.
 *
 * @param subjectLanguage The language code of the subject ('ar' or 'en')
 */
export const useSubjectTextAlign = (subjectLanguage?: string) => {
  const { isRTL: isAppRTL } = useLanguage();

  return useMemo(() => {
    const isSubjectRTL = subjectLanguage?.toLowerCase() === 'ar';

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
  }, [subjectLanguage, isAppRTL]);
};
