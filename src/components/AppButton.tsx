import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
export type AppButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  subtitle?: string; // Added subtitle prop
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  subtitleStyle?: TextStyle | TextStyle[]; // Added subtitleStyle prop
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  subtitle, // Destructured subtitle
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  subtitleStyle, // Destructured subtitleStyle
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const { theme, spacing } = useTheme();
  const { typography } = useTypography();

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: { backgroundColor: theme.colors.buttonSecondary },
          text: { color: theme.colors.buttonSecondaryText || '#fff' },
          subtitle: { color: theme.colors.buttonSecondaryText || '#fff', opacity: 0.8 }, // Added subtitle style
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: theme.colors.primary,
          },
          text: { color: theme.colors.primary },
          subtitle: { color: theme.colors.primary, opacity: 0.7 }, // Added subtitle style
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
            paddingHorizontal: 0,
          },
          text: { color: theme.colors.primary },
          subtitle: { color: theme.colors.primary, opacity: 0.7 }, // Added subtitle style
        };
      case 'danger':
        return {
          button: { backgroundColor: theme.colors.error },
          text: { color: '#fff' },
          subtitle: { color: '#fff', opacity: 0.8 }, // Added subtitle style
        };
      case 'success':
        return {
          button: { backgroundColor: '#10B981' },
          text: { color: '#fff' },
          subtitle: { color: '#fff', opacity: 0.8 }, // Added subtitle style
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: theme.colors.buttonPrimary || theme.colors.primary,
            ...styles.shadow,
          },
          text: { color: theme.colors.buttonPrimaryText || '#fff' },
          subtitle: { color: theme.colors.buttonPrimaryText || '#fff', opacity: 0.8 }, // Added subtitle style
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          button: { height: 36, paddingHorizontal: spacing.md },
          text: { ...typography('label'), fontSize: 14 },
          subtitle: { fontSize: 10 }, // Added subtitle style
        };
      case 'lg':
        return {
          button: { height: 64, paddingHorizontal: spacing.xl }, // Adjusted height for subtitle
          text: { ...typography('h2'), fontSize: 18, fontWeight: '700' },
          subtitle: { fontSize: 12 }, // Added subtitle style
        };
      case 'md':
      default:
        return {
          button: { height: 52, paddingHorizontal: spacing.lg }, // Adjusted height for subtitle
          text: { ...typography('label'), fontSize: 16, fontWeight: '600' },
          subtitle: { fontSize: 11 }, // Added subtitle style
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  const buttonStyles: ViewStyle[] = [
    styles.baseButton,
    vStyles.button as ViewStyle,
    sStyles.button as ViewStyle,
    fullWidth ? { width: '100%' } : {},
    disabled ? styles.disabledButton : {},
  ];

  if (Array.isArray(style)) {
    buttonStyles.push(...style);
  } else if (style) {
    buttonStyles.push(style);
  }

  const titleStyles: TextStyle[] = [
    sStyles.text as TextStyle,
    vStyles.text as TextStyle,
    disabled ? styles.disabledText : {},
  ];

  if (Array.isArray(textStyle)) {
    titleStyles.push(...textStyle);
  } else if (textStyle) {
    titleStyles.push(textStyle);
  }

  // Added subStyles
  const subStyles: TextStyle[] = [
    sStyles.subtitle as TextStyle,
    vStyles.subtitle as TextStyle,
    { marginTop: 2 },
  ];

  if (Array.isArray(subtitleStyle)) {
    subStyles.push(...subtitleStyle);
  } else if (subtitleStyle) {
    subStyles.push(subtitleStyle);
  }

  const indicatorColor = (vStyles.text as any).color || '#fff';

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <View style={styles.textContainer}>
            <Text style={titleStyles}> {title} </Text>
            {subtitle && <Text style={subStyles}> {subtitle} </Text>}
          </View>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 12, // Changed from 100 to 12
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    // Added textContainer style
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  disabledText: {
    opacity: 0.8,
  },
  shadow: {
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default AppButton;
