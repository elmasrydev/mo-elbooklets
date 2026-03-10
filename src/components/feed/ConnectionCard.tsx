import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
    likes?: number;
    comments?: number;
    isLiked?: boolean;
  };
  onLike?: () => void;
  onComment?: () => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({ item, onLike, onComment }) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  const primaryColor = theme.colors.success;
  const primaryBg = `${theme.colors.success}10`;
  const primaryBorder = `${theme.colors.success}20`;

  const currentStyles = createStyles(theme, common, spacing, borderRadius, typography, fontWeight, primaryColor, primaryBg, primaryBorder);

  return (
    <View style={currentStyles.cardContainer}>
      {/* Top Header: Avatar + User Info */}
      <View style={currentStyles.headerRow}>
        <View style={currentStyles.headerLeft}>
          <View style={[currentStyles.avatar, { borderColor: primaryBorder, backgroundColor: primaryBg }]}>
            <Text style={[currentStyles.avatarText, { color: primaryColor }]}>{getInitials(item.user.name)}</Text>
          </View>
          <View style={currentStyles.userInfo}>
            <Text style={[currentStyles.userName, { textAlign: common.textAlign }]}>{item.user.name}</Text>
            <Text style={[currentStyles.userSubtitle, { textAlign: common.textAlign }]}>
              {item.user.grade.name} • {getTimeAgo(item.createdAt, t, language)}
            </Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View style={currentStyles.contentArea}>
        <View style={currentStyles.connectionBox}>
          <View style={currentStyles.avatarsRow}>
            <View style={currentStyles.largeAvatar}>
              <Text style={currentStyles.largeAvatarText}>{getInitials(item.user.name)}</Text>
            </View>
            <View style={currentStyles.connectionIcon}>
              <MaterialIcons name="people-alt" size={24} color={primaryColor} />
              <Text style={currentStyles.connectedLabel}>{t('social_screen.connected', 'Connected')}</Text>
            </View>
            <View style={currentStyles.largeAvatar}>
              <Text style={currentStyles.largeAvatarText}>{getInitials(item.connectedUser.name)}</Text>
            </View>
          </View>
          <Text style={[currentStyles.names, { textAlign: common.textAlign }]}>
            {item.user.name} & {item.connectedUser.name}
          </Text>
        </View>
      </View>

      {/* Footer Actions */}
      <View style={currentStyles.footerActions}>
        <View style={currentStyles.statsRow}>
          <View style={currentStyles.statItem}>
            <MaterialIcons name="thumb-up" size={14} color="#3B82F6" />
            <Text style={currentStyles.statText}>{item.likes || 0}</Text>
          </View>
        </View>

        <View style={currentStyles.actionButtons}>
          <TouchableOpacity style={currentStyles.likeBtn} onPress={onLike}>
            <MaterialIcons name="thumb-up" size={14} color={item.isLiked ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[currentStyles.likeBtnText, item.isLiked && { color: theme.colors.primary }]}>{t('common.like', 'Like')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={currentStyles.cheerBtn} onPress={onComment}>
            <Ionicons name="chatbubble-outline" size={14} color="#fff" />
            <Text style={currentStyles.cheerBtnText}>{t('social_screen.comment', 'Comment')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any, common: any, spacing: any, borderRadius: any, typography: any, fontWeight: any, primaryColor: string, primaryBg: string, primaryBorder: string) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: theme.mode === 'light' ? theme.colors.surface : theme.colors.card,
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerLeft: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    avatarText: {
      ...typography('body'),
      ...fontWeight('bold'),
    },
    userInfo: {
      flex: 1,
      alignItems: common.alignStart,
    },
    userName: {
      ...typography('body'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    userSubtitle: {
      ...typography('caption'),
      fontSize: 10,
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    contentArea: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    connectionBox: {
      alignItems: 'center',
      backgroundColor: theme.mode === 'light' ? `${theme.colors.success}05` : `${theme.colors.success}10`,
      borderWidth: 1,
      borderColor: `${theme.colors.success}20`,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginTop: spacing.xs,
    },
    avatarsRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 16,
      marginBottom: spacing.sm,
    },
    largeAvatar: {
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
    largeAvatarText: {
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
      color: primaryColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    names: {
      ...typography('bodySmall'),
      ...fontWeight('800'),
      color: theme.colors.text,
    },
    footerActions: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: spacing.md,
    },
    statsRow: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
    },
    statItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    actionButtons: {
      flexDirection: common.rowDirection,
      gap: 8,
    },
    likeBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    likeBtnText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.textSecondary,
    },
    cheerBtn: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primary,
      ...layout.shadow,
    },
    cheerBtnText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: '#fff',
    },
  });

export default React.memo(ConnectionCard);
