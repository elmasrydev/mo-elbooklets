import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useTypography } from '../../hooks/useTypography';
import { getTimeAgo } from '../../lib/dateUtils';

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
  };
}

const RankChangeCard: React.FC<RankChangeCardProps> = ({ item }) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();

  const rankColors: { [key: number]: string } = { 1: '#F59E0B', 2: '#94A3B8', 3: '#EA580C' };
  const rankColor = rankColors[item.rankData.newRank] || '#EA580C';
  const getRankLabel = (rank: number) => {
    if (rank === 1) return t('social_screen.rank_1st');
    if (rank === 2) return t('social_screen.rank_2nd');
    if (rank === 3) return t('social_screen.rank_3rd');
    return `${rank}${t('social_screen.rank_th')}`;
  };

  const currentStyles = createStyles(
    theme,
    common,
    fontSizes,
    spacing,
    borderRadius,
    rankColor,
    typography,
  );

  return (
    <View style={[common.card, currentStyles.cardBorder]}>
      <View style={currentStyles.contentRow}>
        <View style={currentStyles.leftSection}>
          <View style={currentStyles.rankBadge}>
            <Text style={currentStyles.rankNumber}>#{item.rankData.newRank} </Text>
          </View>
          <View style={currentStyles.userInfo}>
            <Text style={[currentStyles.userName, { textAlign: common.textAlign }]}>
              {item.user.name}
            </Text>
            <Text style={[currentStyles.rankChange, { textAlign: common.textAlign }]}>
              {item.rankData.previousRank
                ? t('social_screen.moved_to_rank', {
                    from: item.rankData.previousRank,
                    to: getRankLabel(item.rankData.newRank),
                  })
                : t('social_screen.reached_rank', { rank: getRankLabel(item.rankData.newRank) })}
            </Text>
            <Text style={[currentStyles.subjectLabel, { textAlign: common.textAlign }]}>
              {item.rankData.isOverall
                ? t('social_screen.overall_ranking')
                : item.rankData.subject?.name || t('common.quiz')}
            </Text>
          </View>
        </View>
        <View style={currentStyles.rightSection}>
          <Ionicons name="trophy" size={40} color={rankColor} />
          <Text style={currentStyles.timeAgo}> {getTimeAgo(item.createdAt, t, language)} </Text>
        </View>
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
  rankColor: string,
  typography: any,
) =>
  StyleSheet.create({
    cardBorder: { ...common.borderStartWidth(4), ...common.borderStartColor(rankColor) },
    contentRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftSection: { flexDirection: common.rowDirection, alignItems: 'center', gap: 12, flex: 1 },
    rankBadge: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: rankColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankNumber: { ...typography('h3'), fontWeight: '900', color: '#fff' },
    userInfo: { flex: 1, gap: 4, alignItems: common.alignStart },
    userName: { ...typography('body'), fontWeight: '800', color: theme.colors.text },
    rankChange: {
      ...typography('caption'),
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    subjectLabel: {
      ...typography('caption'),
      fontSize: 12,
      fontWeight: '700',
      color: rankColor,
      marginTop: 2,
    },
    rightSection: { alignItems: 'center', gap: 6, ...common.marginStart(12) },
    timeAgo: {
      ...typography('caption'),
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textTertiary,
    },
  });

export default RankChangeCard;
