import { ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRTL } from './useRTL';
import { useTypography } from './useTypography';
import { layout } from '../config/layout';

/**
 * useCommonStyles Hook
 * Providing common UI styles and design patterns.
 * Optimized for Explicit JS-Driven RTL support.
 * Uses dynamic safe area insets (matching HedeyaStores pattern).
 */
export const useCommonStyles = () => {
  const { theme, spacing, fontSizes, borderRadius } = useTheme();
  const rtl = useRTL();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();

  return {
    ...rtl, // isRTL, rowDirection, marginStart helper, etc.
    textAlign: rtl.textAlign,

    // Expose insets for screens that need custom safe area logic
    insets,

    // Main screen container
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    // Wrapper for Title + Subtitle to keep them vertically stacked
    // while the parent header pushes them to the correct side.
    headerTextWrapper: {
      flex: 1,
      alignItems: rtl.alignStart,
      justifyContent: 'center',
    } as ViewStyle,

    headerTitle: {
      ...typography('h2'),
      fontWeight: 'bold',
      color: theme.colors.headerText,
      textAlign: rtl.textAlign,
    } as TextStyle,

    headerSubtitle: {
      ...typography('body'),
      color: theme.colors.headerSubtitle,
      marginTop: spacing.xs - 6,
      opacity: 0.9,
      textAlign: rtl.textAlign,
    } as TextStyle,

    // Content scroll container
    content: {
      flex: 1,
      padding: layout.screenPadding,
    } as ViewStyle,

    // Scroll content padding for screens inside the tab navigator
    // Use this as contentContainerStyle paddingBottom
    scrollContentWithTabBar: {
      paddingBottom: insets.bottom + 50,
    } as ViewStyle,

    // Fixed bottom bar padding (quiz footers, nav bars, action buttons)
    fixedBottomBar: {
      paddingBottom: Math.max(insets.bottom, 16),
    } as ViewStyle,

    // Standardized Card
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl || layout.borderRadius.xl,
      padding: layout.cardPadding,
      marginBottom: layout.cardGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    } as ViewStyle,

    cardRow: {
      flexDirection: rtl.rowDirection, // Explicitly row-reverse in RTL
      alignItems: 'center',
    } as ViewStyle,

    // Standardized Text alignment
    text: {
      textAlign: rtl.textAlign,
      color: theme.colors.text,
    } as TextStyle,

    sectionTitle: {
      ...typography('h3'),
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: rtl.textAlign,
      marginBottom: spacing.lg,
    } as TextStyle,
  };
};
