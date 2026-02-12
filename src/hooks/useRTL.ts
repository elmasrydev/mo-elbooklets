import { I18nManager, FlexStyle, TextStyle } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

/**
 * useRTL Hook - Stable Hybrid Implementation
 *
 * In PRODUCTION builds, I18nManager.isRTL is properly synced via
 * Updates.reloadAsync() which fully restarts the native context.
 * In that case, `isMismatch` is always false and everything uses
 * standard 'row' / logical properties.
 *
 * In DEVELOPMENT, DevSettings.reload() only reloads JS, so
 * I18nManager.isRTL may not match the desired language.
 * When there's a mismatch, this hook compensates via JS-driven
 * overrides (row-reverse, manual start/end) to ensure correct
 * visual layout even without a native restart.
 */
export const useRTL = () => {
  const { isRTL } = useLanguage();
  const nativeRTL = I18nManager.isRTL;

  // Detect if the native layer differs from our desired JS state.
  // This happens in dev mode when DevSettings.reload() can't restart the native Activity.
  const isMismatch = isRTL !== nativeRTL;

  return {
    isRTL,

    // DIRECTION:
    // If native matches → standard 'row' (RN auto-flips it)
    // If mismatch → 'row-reverse' to manually compensate
    rowDirection: (isMismatch ? 'row-reverse' : 'row') as FlexStyle['flexDirection'],

    // ALIGNMENT:
    // If native matches → standard flex-start/end (RN auto-flips)
    // If mismatch → swap them manually
    alignStart: (isMismatch ? 'flex-end' : 'flex-start') as FlexStyle['alignItems'],
    alignEnd: (isMismatch ? 'flex-start' : 'flex-end') as FlexStyle['alignItems'],

    // TEXT ALIGNMENT — RN never auto-flips textAlign, always manual
    textAlign: (isRTL ? 'right' : 'left') as TextStyle['textAlign'],

    // MARGINS/PADDING:
    // If native matches → use logical properties (auto-flip)
    // If mismatch → use physical properties to force correct side
    marginStart: (val: number) =>
      isMismatch
        ? (isRTL ? { marginRight: val } : { marginLeft: val })
        : ({ marginStart: val }),
    marginEnd: (val: number) =>
      isMismatch
        ? (isRTL ? { marginLeft: val } : { marginRight: val })
        : ({ marginEnd: val }),

    paddingStart: (val: number) =>
      isMismatch
        ? (isRTL ? { paddingRight: val } : { paddingLeft: val })
        : ({ paddingStart: val }),
    paddingEnd: (val: number) =>
      isMismatch
        ? (isRTL ? { paddingLeft: val } : { paddingRight: val })
        : ({ paddingEnd: val }),

    borderStartWidth: (val: number) =>
      isMismatch
        ? (isRTL ? { borderRightWidth: val } : { borderLeftWidth: val })
        : ({ borderStartWidth: val }),
    borderEndWidth: (val: number) =>
      isMismatch
        ? (isRTL ? { borderLeftWidth: val } : { borderRightWidth: val })
        : ({ borderEndWidth: val }),

    borderStartColor: (val: string) =>
      isMismatch
        ? (isRTL ? { borderRightColor: val } : { borderLeftColor: val })
        : ({ borderStartColor: val }),
    borderEndColor: (val: string) =>
      isMismatch
        ? (isRTL ? { borderLeftColor: val } : { borderRightColor: val })
        : ({ borderEndColor: val }),

    start: (val: number) =>
      isMismatch
        ? (isRTL ? { right: val } : { left: val })
        : ({ start: val }),
    end: (val: number) =>
      isMismatch
        ? (isRTL ? { left: val } : { right: val })
        : ({ end: val }),

    // ICONS
    arrowBack: isRTL ? 'chevron-forward' : 'chevron-back',
    arrowForward: isRTL ? 'chevron-back' : 'chevron-forward',
  };
};
