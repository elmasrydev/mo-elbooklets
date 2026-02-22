import { useLanguage } from '../context/LanguageContext';
import { getTextStyle, textStyles, TextStyleType } from '../config/fonts';

/**
 * A hook that provides language-aware typography styles.
 * It automatically selects the correct font family (Inter for LTR, Cairo for RTL).
 */
export const useTypography = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  /**
   * Returns a complete style object (fontSize, fontWeight, lineHeight, fontFamily)
   * for the requested typography style preset.
   */
  const typography = (style: TextStyleType) => getTextStyle(style, isArabic);

  return { typography, isArabic, language };
};
