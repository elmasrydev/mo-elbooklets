import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { getTimeAgo } from '../../lib/dateUtils';
import { layout } from '../../config/layout';

interface ConnectionCardProps {
  item: {
    id: string;
    user: { id: string; name: string; grade: { id: string; name: string } };
    createdAt: string;
    connectedUser: { id: string; name: string; grade: { id: string; name: string } };
  };
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ item }) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

  const currentStyles = createStyles(
    theme,
    common,
    fontSizes,
    spacing,
    borderRadius,
    typography,
    fontWeight,
  );

  return (
    <View style={currentStyles.card}>
      <View style={currentStyles.content}>
        <View style={currentStyles.avatarsRow}>
          <View style={currentStyles.avatar}>
            <Text style={currentStyles.avatarText}>{getInitials(item.user.name)}</Text>
          </View>
          <View style={currentStyles.connectionIcon}>
            <Ionicons name="people" size={24} color={theme.colors.success} />
            <Text style={currentStyles.connectedLabel}>{t('social_screen.connected')}</Text>
          </View>
          <View style={currentStyles.avatar}>
            <Text style={currentStyles.avatarText}>{getInitials(item.connectedUser.name)}</Text>
          </View>
        </View>
        <Text style={currentStyles.names}>
          {item.user.name} & {item.connectedUser.name}
        </Text>
        <Text style={currentStyles.timeAgo}>{getTimeAgo(item.createdAt, t, language)}</Text>
      </View>
    </View>
  );
};

const createStyles = (
  theme: any,
  common: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  typography: any,
  fontWeight: any,
) =>
  StyleSheet.create({
    card: {
      ...common.card,
      backgroundColor: theme.mode === 'light' ? `${theme.colors.success}10` : `${theme.colors.success}15`,
      borderWidth: 1,
      borderColor: `${theme.colors.success}30`,
      padding: spacing.xl,
      marginHorizontal: 0,
      marginBottom: spacing.sectionGap,
    },
    content: { alignItems: 'center' },
    avatarsRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 16,
      marginBottom: spacing.md,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    avatarText: {
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.primary,
    },
    connectionIcon: {
      alignItems: 'center',
      gap: 4,
    },
    connectedLabel: {
      ...typography('caption'),
      fontSize: 10,
      ...fontWeight('800'),
      color: theme.colors.success,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    names: {
      ...typography('body'),
      ...fontWeight('800'),
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    timeAgo: {
      ...typography('caption'),
      fontSize: 11,
      ...fontWeight('700'),
      color: theme.colors.textTertiary,
    },
  });

export default React.memo(ConnectionCard);
