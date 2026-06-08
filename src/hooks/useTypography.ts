import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { getTextStyle, textStyles, TextStyleType } from '../config/fonts';

type FontWeightValue = 'normal' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'black';

/**
 * Maps a fontWeight value to the correct static font-family name on Android.
 * On iOS, variable fonts handle fontWeight natively, so we return the base family.
 */
const resolveWeightFamily = (weight: string, isArabic: boolean): string => {
  const base = isArabic ? 'Cairo' : 'Lexend';
  if (Platform.OS !== 'android') return base;

  switch (weight) {
    case '700':
    case '800':
    case '900':
    case 'bold':
    case 'black':
      return `${base}-Bold`;
    case '600':
      return `${base}-SemiBold`;
    case '500':
      return `${base}-Medium`;
    default:
      return `${base}-Regular`;
  }
};

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
    (style: TextStyleType, weight?: FontWeightValue, forceArabic?: boolean) => {
      const activeIsArabic = forceArabic !== undefined ? forceArabic : isArabic;
      const base = getTextStyle(style, activeIsArabic);
      if (!weight) return base;

      // Resolve the correct fontFamily for the overridden weight atomically
      const resolvedFamily = resolveWeightFamily(weight, activeIsArabic);
      return {
        ...base,
        fontFamily: resolvedFamily,
        // On Android, fontWeight MUST be 'normal' — the weight is encoded in fontFamily.
        // Any other value causes Android to synthesize bold on top of the named font file.
        fontWeight:
          Platform.OS === 'android'
            ? ('normal' as const)
            : weight === 'black'
              ? ('900' as const)
              : weight,
      };
    },
    [isArabic],
  );

  const fontWeight = useCallback(
    (weight: FontWeightValue, forceArabic?: boolean) => {
      const activeIsArabic = forceArabic !== undefined ? forceArabic : isArabic;
      if (Platform.OS === 'android') {
        return {
          fontFamily: resolveWeightFamily(weight, activeIsArabic),
          // fontWeight 'normal' — weight is encoded in fontFamily, avoid synthetic bold.
          fontWeight: 'normal' as const,
        };
      }
      return { fontWeight: weight === 'black' ? ('900' as const) : weight };
    },
    [isArabic],
  );

  return useMemo(
    () => ({ typography, fontWeight, isArabic, language }),
    [typography, fontWeight, isArabic, language],
  );
};
