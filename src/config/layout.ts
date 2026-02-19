import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Global Layout Constants for ElBooklets Mobile
 * Standardizes spacing and dimensions across all screens.
 */
export const layout = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,

  // Safe area (header)
  headerPaddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 50,
  headerPaddingBottom: 24,

  // Screen padding (unified 20px)
  screenPadding: 20,

  // Card styles
  cardPadding: 16,
  cardGap: 12,

  // Design tokens (fallbacks for when theme isn't available)
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  // Shadow style
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
} as const;
