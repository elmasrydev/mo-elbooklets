import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  getTextStyle,
  resolveFontFamily,
  resolveFontWeight,
  TextStyleType,
  FontWeightInput,
} from '../config/fonts';

/**
 * A hook that provides language-aware typography styles.
 *
 * `typography(style, weight?)` — returns the full resolved text style including
 * fontFamily, fontSize, fontWeight. Pass an optional weight to override the
 * base style's weight in one atomic call (no need to spread fontWeight() separately).
 *
 * `fontWeight(weight)` — for standalone weight-only overrides with no base style.
 */
export const useTypography = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const typography = useCallback(
    (style: TextStyleType, weight?: FontWeightInput, forceArabic?: boolean) => {
      const activeIsArabic = forceArabic !== undefined ? forceArabic : isArabic;
      const base = getTextStyle(style, activeIsArabic);
      if (!weight) return base;

      // Override family + weight atomically (family/weight pairing rules live
      // in config/fonts.ts — static files need matched values per platform).
      return {
        ...base,
        fontFamily: resolveFontFamily(weight, activeIsArabic),
        fontWeight: resolveFontWeight(weight, activeIsArabic),
      };
    },
    [isArabic],
  );

  const fontWeight = useCallback(
    (weight: FontWeightInput, forceArabic?: boolean) => {
      const activeIsArabic = forceArabic !== undefined ? forceArabic : isArabic;
      // Android always needs the family+weight pair; so does Arabic on iOS,
      // because Plex Arabic is static-only (a bare fontWeight would make iOS
      // synthesize bold — or stay on Regular — instead of using the real face).
      if (Platform.OS === 'android' || activeIsArabic) {
        return {
          fontFamily: resolveFontFamily(weight, activeIsArabic),
          fontWeight: resolveFontWeight(weight, activeIsArabic),
        };
      }
      return { fontWeight: resolveFontWeight(weight, false) };
    },
    [isArabic],
  );

  return useMemo(
    () => ({ typography, fontWeight, isArabic, language }),
    [typography, fontWeight, isArabic, language],
  );
};
