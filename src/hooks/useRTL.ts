import { I18nManager, FlexStyle } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

/**
 * useRTL Hook - Stable Hybrid Implementation
 */
export const useRTL = () => {
  const { isRTL } = useLanguage();
  const nativeRTL = I18nManager.isRTL;

  // Detect if the native layer differs from our desired JS state.
  const isMismatch = isRTL !== nativeRTL;

  // Helper for conditional physical properties
  const getPhysical = (rtlVal: any, ltrVal: any) => (isRTL ? rtlVal : ltrVal);

  return {
    isRTL,

    // DIRECTION:
    rowDirection: 'row' as FlexStyle['flexDirection'],

    // ALIGNMENT:
    alignStart: (isMismatch ? 'flex-end' : 'flex-start') as FlexStyle['alignItems'],
    alignEnd: (isMismatch ? 'flex-start' : 'flex-end') as FlexStyle['alignItems'],

    // TEXT ALIGNMENT
    textAlign: 'left' as 'left' | 'right' | 'center',

    // MARGINS/PADDING
    marginStart: (val: number) =>
      isMismatch ? getPhysical({ marginRight: val }, { marginLeft: val }) : { marginStart: val },
    marginEnd: (val: number) =>
      isMismatch ? getPhysical({ marginLeft: val }, { marginRight: val }) : { marginEnd: val },

    paddingStart: (val: number) =>
      isMismatch ? getPhysical({ paddingRight: val }, { paddingLeft: val }) : { paddingStart: val },
    paddingEnd: (val: number) =>
      isMismatch ? getPhysical({ paddingLeft: val }, { paddingRight: val }) : { paddingEnd: val },

    borderStartWidth: (val: number) =>
      isMismatch
        ? getPhysical({ borderRightWidth: val }, { borderLeftWidth: val })
        : { borderStartWidth: val },
    borderEndWidth: (val: number) =>
      isMismatch
        ? getPhysical({ borderLeftWidth: val }, { borderRightWidth: val })
        : { borderEndWidth: val },

    borderStartColor: (val: string) =>
      isMismatch
        ? getPhysical({ borderRightColor: val }, { borderLeftColor: val })
        : { borderStartColor: val },
    borderEndColor: (val: string) =>
      isMismatch
        ? getPhysical({ borderLeftColor: val }, { borderRightColor: val })
        : { borderEndColor: val },

    start: (val: number) => (isRTL ? { right: val } : { left: val }),
    end: (val: number) => (isRTL ? { left: val } : { right: val }),

    // ICONS
    arrowBack: isRTL ? 'chevron-forward' : 'chevron-back',
    arrowForward: isRTL ? 'chevron-back' : 'chevron-forward',
  };
};
