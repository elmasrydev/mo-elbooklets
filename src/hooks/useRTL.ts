import { I18nManager, FlexStyle, TextStyle } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

/**
 * useRTL Hook - Stable Hybrid Implementation
 * This hook leverages the "Stable Hybrid" pattern to ensure correct layout
 * even when the Native RTL state and JS Language state are out of sync.
 */
export const useRTL = () => {
  const { isRTL } = useLanguage();
  const nativeRTL = I18nManager.isRTL;

  // Detect if the native layer differs from our desired JS state.
  // This happens briefly before an app restart after a language swap.
  const isSyncMismatch = isRTL !== nativeRTL;

  return {
    isRTL,

    // STABLE DIRECTION
    // If native is already flipped but we want LTR, we reverse back to Normal.
    // If native is NOT flipped but we want RTL, we reverse to Force it.
    rowDirection: (isSyncMismatch ? 'row-reverse' : 'row') as FlexStyle['flexDirection'],

    // STABLE ALIGNMENT
    alignStart: (isSyncMismatch ? 'flex-end' : 'flex-start') as FlexStyle['alignItems'],
    alignEnd: (isSyncMismatch ? 'flex-start' : 'flex-end') as FlexStyle['alignItems'],

    // STABLE TEXT ALIGNMENT
    // React Native's textAlign does NOT automatically flip. We must explicitely set it.
    textAlign: (isRTL ? 'right' : 'left') as TextStyle['textAlign'],

    // STABLE MARGINS (Uses absolute properties to bypass native logical property flip)
    marginStart: (val: number) => (isRTL ? { marginRight: val } : { marginLeft: val }),
    marginEnd: (val: number) => (isRTL ? { marginLeft: val } : { marginRight: val }),

    paddingStart: (val: number) => (isRTL ? { paddingRight: val } : { paddingLeft: val }),
    paddingEnd: (val: number) => (isRTL ? { paddingLeft: val } : { paddingRight: val }),

    borderStartWidth: (val: number) =>
      isRTL ? { borderRightWidth: val } : { borderLeftWidth: val },
    borderEndWidth: (val: number) => (isRTL ? { borderLeftWidth: val } : { borderRightWidth: val }),

    borderStartColor: (val: string) =>
      isRTL ? { borderRightColor: val } : { borderLeftColor: val },
    borderEndColor: (val: string) => (isRTL ? { borderLeftColor: val } : { borderRightColor: val }),

    start: (val: number) => (isRTL ? { right: val } : { left: val }),
    end: (val: number) => (isRTL ? { left: val } : { right: val }),

    // ICONS
    arrowBack: isRTL ? 'chevron-forward' : 'chevron-back',
    arrowForward: isRTL ? 'chevron-back' : 'chevron-forward',
  };
};
