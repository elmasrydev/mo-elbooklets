import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import AppButton from './AppButton';
import { layout } from '../config/layout';

interface RetryViewProps {
  onRetry: () => void;
  message?: string;
  title?: string;
  icon?: any;
  isLoading?: boolean;
}

export default function RetryView({
  onRetry,
  message,
  title,
  icon = 'cloud-offline-outline',
  isLoading = false,
}: RetryViewProps) {
  const { t } = useTranslation();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { typography, fontWeight } = useTypography();
  const common = useCommonStyles();

  const currentStyles = styles(theme, fontSizes, spacing, borderRadius, common, typography, fontWeight);

  return (
    <View style={currentStyles.container}>
      <View style={currentStyles.iconContainer}>
        <Ionicons name={icon} size={64} color={theme.colors.textSecondary} />
      </View>

      <Text style={currentStyles.title}>
        {title || t('common.error_occurred', { defaultValue: 'Connection Error' })}
      </Text>
      
      <Text style={currentStyles.message}>
        {message || t('common.network_error', { defaultValue: 'Unable to connect. Please check your internet connection and try again.' })}
      </Text>

      <AppButton
        title={t('home_screen.try_again', { defaultValue: 'Try Again' })}
        onPress={onRetry}
        icon={!isLoading ? <Ionicons name="refresh" size={20} color={theme.colors.textOnDark} /> : undefined}
        loading={isLoading}
        size="md"
        fullWidth={false}
      />
    </View>
  );
};

const styles = (theme: any, fontSizes: any, spacing: any, borderRadius: any, common: any, typography: any, fontWeight: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.xxl,
    },
    iconContainer: {
      marginBottom: spacing.lg,
      opacity: 0.8,
    },
    title: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    message: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.xl,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 300,
    },
  });

