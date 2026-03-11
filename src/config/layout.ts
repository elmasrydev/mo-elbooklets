import { Dimensions, Platform } from 'react-native';
import { spacing, borderRadius } from './spacing';

const { width, height } = Dimensions.get('window');

/**
 * Global Layout Constants for El-Booklets Mobile
 */
export const layout = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,

  // Tab bar content height
  tabBarContentHeight: 54,

  // Screen padding (unified 12px)
  screenPadding: spacing.ssm,

  // Card styles
  cardPadding: spacing.md,
  cardGap: spacing.ssm,

  // Design tokens
  spacing,
  borderRadius,

  // Shadow style
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
  }),
} as const;
