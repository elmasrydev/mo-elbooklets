import { ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRTL } from './useRTL';
import { useTypography } from './useTypography';
import { layout } from '../config/layout';

/**
 * useCommonStyles Hook
 * Providing common UI styles and design patterns.
 * Optimized for Explicit JS-Driven RTL support.
 */
export const useCommonStyles = () => {
  const { theme, spacing, fontSizes, borderRadius } = useTheme();
  const rtl = useRTL();
  const { typography } = useTypography();
  return {
    ...rtl, // isRTL, rowDirection, marginStart helper, etc.
    textAlign: rtl.textAlign,
    // Main screen container
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    // Header pattern
    header: {
      width: '100%',
      paddingHorizontal: layout.screenPadding,
      paddingTop: layout.headerPaddingTop,
      paddingBottom: layout.headerPaddingBottom,
      backgroundColor: theme.colors.headerBackground,
      // Robust RTL Fix: Use Physical Row Direction
      flexDirection: rtl.rowDirection,
      alignItems: 'center',
      justifyContent: 'flex-start',
      maxHeight: 120,
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
      marginTop: spacing.xs,
      opacity: 0.9,
      textAlign: rtl.textAlign,
    } as TextStyle,

    // Content scroll container
    content: {
      flex: 1,
      padding: layout.screenPadding,
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
