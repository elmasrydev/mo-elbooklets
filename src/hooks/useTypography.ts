import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { getTextStyle, textStyles, TextStyleType } from '../config/fonts';

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
 * It automatically selects the correct font family (Lexend for LTR, Cairo for RTL).
 */
export const useTypography = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const typography = useCallback(
    (style: TextStyleType) => getTextStyle(style, isArabic),
    [isArabic],
  );

  const fontWeight = useCallback(
    (weight: 'normal' | '500' | '600' | '700' | '800' | '900' | 'bold') => {
      if (Platform.OS === 'android') {
        return {
          fontFamily: resolveWeightFamily(weight, isArabic),
          fontWeight: weight,
        };
      }
      return { fontWeight: weight };
    },
    [isArabic],
  );

  return useMemo(
    () => ({ typography, fontWeight, isArabic, language }),
    [typography, fontWeight, isArabic, language],
  );
};
