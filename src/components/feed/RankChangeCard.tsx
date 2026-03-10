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

interface RankChangeCardProps {
  item: {
    id: string;
    user: { id: string; name: string; grade: { id: string; name: string } };
    createdAt: string;
    rankData: {
      previousRank?: number;
      newRank: number;
      subject?: { id: string; name: string };
      isOverall: boolean;
    };
    likes?: number;
    comments?: number;
    isLiked?: boolean;
  };
  onLike?: () => void;
  onComment?: () => void;
}

const RankChangeCard: React.FC<RankChangeCardProps> = ({ item, onLike, onComment }) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const rankColors: { [key: number]: string } = {
    1: '#F59E0B', // Gold/Amber
    2: '#94A3B8', // Silver
    3: '#EA580C', // Bronze
  };
  const rankColor = rankColors[item.rankData.newRank] || '#F59E0B';
  const rankBg = `${rankColor}10`;
  const rankBorder = `${rankColor}20`;

  const getRankLabel = (rank: number) => {
    if (rank === 1) return t('social_screen.rank_1st', '1st');
    if (rank === 2) return t('social_screen.rank_2nd', '2nd');
    if (rank === 3) return t('social_screen.rank_3rd', '3rd');
    return `${rank}${t('social_screen.rank_th', 'th')}`;
  };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);

  const currentStyles = createStyles(theme, common, spacing, borderRadius, typography, fontWeight, rankColor, rankBg, rankBorder);

  return (
    <View style={currentStyles.cardContainer}>
      {/* Top Header: Avatar + User Info */}
      <View style={currentStyles.headerRow}>
        <View style={currentStyles.headerLeft}>
          <View style={[currentStyles.avatar, { borderColor: rankBorder, backgroundColor: rankBg }]}>
            <Text style={[currentStyles.avatarText, { color: rankColor }]}>{getInitials(item.user.name)}</Text>
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
        <View style={currentStyles.badgeCard}>
          <View style={currentStyles.badgeIconWrap}>
            <MaterialIcons name="military-tech" size={28} color={rankColor} />
          </View>
          <View style={currentStyles.badgeContent}>
            <Text style={[currentStyles.badgeTitle, { textAlign: common.textAlign }]}>
              {t('social_screen.new_rank_achieved', 'New Badge Earned!')}
            </Text>
            <Text style={[currentStyles.badgeSubtitle, { textAlign: common.textAlign, color: rankColor }]}>
              {item.rankData.previousRank
                ? t('social_screen.moved_to_rank', { from: item.rankData.previousRank, to: getRankLabel(item.rankData.newRank) })
                : `Rank #${item.rankData.newRank} ${item.rankData.isOverall ? t('social_screen.overall_ranking', 'Overall') : item.rankData.subject?.name}`} 🏆
            </Text>
          </View>
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
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any, common: any, spacing: any, borderRadius: any, typography: any, fontWeight: any, rankColor: string, rankBg: string, rankBorder: string) =>
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
      marginBottom: spacing.md,
    },
    badgeCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      gap: 12,
      backgroundColor: rankBg,
      borderWidth: 1,
      borderColor: rankBorder,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginTop: spacing.xs,
    },
    badgeIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...layout.shadow,
    },
    badgeContent: {
      flex: 1,
      alignItems: common.alignStart,
    },
    badgeTitle: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.text,
    },
    badgeSubtitle: {
      ...typography('caption'),
      ...fontWeight('bold'),
      marginTop: 2,
    },
    footerActions: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
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

export default React.memo(RankChangeCard);
