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
  subtitle?: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  subtitleStyle?: TextStyle | TextStyle[];
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  subtitle,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  subtitleStyle,
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { typography } = useTypography();

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: { backgroundColor: theme.colors.buttonSecondary },
          text: { color: theme.colors.buttonSecondaryText },
          subtitle: { color: theme.colors.buttonSecondaryText, opacity: 0.8 },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
          },
          text: { color: theme.colors.primary },
          subtitle: { color: theme.colors.primary, opacity: 0.7 },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
            paddingHorizontal: 0,
          },
          text: { color: theme.colors.primary },
          subtitle: { color: theme.colors.primary, opacity: 0.7 },
        };
      case 'danger':
        return {
          button: { backgroundColor: theme.colors.error },
          text: { color: theme.colors.textOnDark },
          subtitle: { color: theme.colors.textOnDark, opacity: 0.8 },
        };
      case 'success':
        return {
          button: { backgroundColor: theme.colors.success },
          text: { color: theme.colors.textOnDark },
          subtitle: { color: theme.colors.textOnDark, opacity: 0.8 },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: theme.colors.buttonPrimary,
          },
          text: { color: theme.colors.buttonPrimaryText },
          subtitle: { color: theme.colors.buttonPrimaryText, opacity: 0.8 },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          button: { height: 38, paddingHorizontal: spacing.md },
          text: { ...typography('label'), fontWeight: '700' },
          subtitle: typography('caption'),
        };
      case 'lg':
        return {
          button: { height: 60, paddingHorizontal: spacing.xl },
          text: typography('button'),
          subtitle: typography('label'),
        };
      case 'md':
      default:
        return {
          button: { height: 52, paddingHorizontal: spacing.lg },
          text: typography('button'),
          subtitle: typography('label'),
        };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  const buttonStyles: ViewStyle[] = [
    styles.baseButton,
    { borderRadius: borderRadius.md },
    vStyles.button as ViewStyle,
    sStyles.button as ViewStyle,
    fullWidth ? { width: '100%' } : {},
    disabled ? { backgroundColor: theme.colors.buttonDisabled, opacity: 0.6 } : {},
  ];

  if (variant === 'primary' && !disabled) {
    buttonStyles.push({
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    });
  }

  if (Array.isArray(style)) {
    buttonStyles.push(...style);
  } else if (style) {
    buttonStyles.push(style);
  }

  const titleStyles: TextStyle[] = [
    sStyles.text as TextStyle,
    vStyles.text as TextStyle,
    disabled ? { color: theme.colors.buttonDisabledText } : {},
  ];

  if (Array.isArray(textStyle)) {
    titleStyles.push(...textStyle);
  } else if (textStyle) {
    titleStyles.push(textStyle);
  }

  const subStyles: TextStyle[] = [
    sStyles.subtitle as TextStyle,
    vStyles.subtitle as TextStyle,
    { marginTop: spacing.xxs },
  ];

  if (Array.isArray(subtitleStyle)) {
    subStyles.push(...subtitleStyle);
  } else if (subtitleStyle) {
    subStyles.push(subtitleStyle);
  }

  const indicatorColor = (vStyles.text as any).color || theme.colors.textOnDark;

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
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={{ marginEnd: spacing.xs }}> {icon} </View>
          )}
          <View style={styles.textContainer}>
            <Text style={titleStyles}> {title} </Text>
            {subtitle && <Text style={subStyles}> {subtitle} </Text>}
          </View>
          {icon && iconPosition === 'right' && (
            <View style={{ marginStart: spacing.xs }}> {icon} </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppButton;
