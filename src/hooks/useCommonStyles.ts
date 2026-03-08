import { useMemo } from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useRTL } from './useRTL';
import { useTypography } from './useTypography';
import { layout } from '../config/layout';

/**
 * useCommonStyles Hook
 * Providing common UI styles and design patterns aligned with the UI guide.
 */
export const useCommonStyles = () => {
  const { theme, spacing, borderRadius } = useTheme();
  const rtl = useRTL();
  const { typography } = useTypography();
  const insets = useSafeAreaInsets();

  return useMemo(
    () => ({
      ...rtl,
      textAlign: rtl.textAlign,
      insets,

      container: {
        flex: 1,
        backgroundColor: theme.colors.background,
      } as ViewStyle,

      headerTextWrapper: {
        flex: 1,
        alignItems: rtl.alignStart,
        justifyContent: 'center',
      } as ViewStyle,

      headerTitle: {
        ...typography('h3'),
        color: theme.colors.headerText,
        textAlign: rtl.textAlign,
      } as TextStyle,

      headerSubtitle: {
        ...typography('bodySmall'),
        color: theme.colors.headerSubtitle,
        marginTop: spacing.xs,
        textAlign: rtl.textAlign,
      } as TextStyle,

      content: {
        flex: 1,
        padding: layout.screenPadding,
      } as ViewStyle,

      scrollContentWithTabBar: {
        paddingBottom: insets.bottom + layout.tabBarContentHeight + spacing.md,
      } as ViewStyle,

      fixedBottomBar: {
        paddingBottom: Math.max(insets.bottom, spacing.md),
        paddingHorizontal: layout.screenPadding,
      } as ViewStyle,

      card: {
        backgroundColor: theme.colors.card,
        borderRadius: borderRadius.lg,
        padding: layout.cardPadding,
        marginBottom: layout.cardGap,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...layout.shadow,
      } as ViewStyle,

      cardRow: {
        flexDirection: rtl.rowDirection,
        alignItems: 'center',
      } as ViewStyle,

      text: {
        textAlign: rtl.textAlign,
        color: theme.colors.text,
      } as TextStyle,

      sectionTitle: {
        ...typography('h2'),
        color: theme.colors.text,
        textAlign: rtl.textAlign,
        marginBottom: spacing.md,
      } as TextStyle,
    }),
    [theme, spacing, borderRadius, rtl, typography, insets],
  );
};
