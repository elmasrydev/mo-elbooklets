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
  const { typography, fontWeight } = useTypography();

  const rankColors: { [key: number]: string } = { 
    1: theme.colors.gold || '#F59E0B', 
    2: theme.colors.silver || '#94A3B8', 
    3: theme.colors.bronze || '#EA580C' 
  };
  const rankColor = rankColors[item.rankData.newRank] || theme.colors.primary;

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
    fontWeight,
  );

  return (
    <View style={[currentStyles.card, currentStyles.cardAccent]}>
      <View style={currentStyles.contentRow}>
        <View style={currentStyles.leftSection}>
          <View style={currentStyles.rankBadge}>
            <Text style={currentStyles.rankNumber}>#{item.rankData.newRank}</Text>
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
            <View style={currentStyles.subjectChip}>
              <Text style={currentStyles.subjectLabel}>
                {item.rankData.isOverall
                  ? t('social_screen.overall_ranking')
                  : item.rankData.subject?.name || t('common.quiz')}
              </Text>
            </View>
          </View>
        </View>
        <View style={currentStyles.rightSection}>
          <View style={[currentStyles.trophyBg, { backgroundColor: `${rankColor}15` }]}>
            <Ionicons name="trophy" size={32} color={rankColor} />
          </View>
          <Text style={currentStyles.timeAgo}>{getTimeAgo(item.createdAt, t, language)}</Text>
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
  fontWeight: any,
) =>
  StyleSheet.create({
    card: {
      ...common.card,
      marginBottom: spacing.sectionGap,
      overflow: 'hidden',
    },
    cardAccent: {
      borderLeftWidth: 4,
      borderLeftColor: rankColor,
    },
    contentRow: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftSection: { 
      flexDirection: common.rowDirection, 
      alignItems: 'center', 
      gap: 16, 
      flex: 1 
    },
    rankBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: rankColor,
      alignItems: 'center',
      justifyContent: 'center',
      ...layout.shadow,
    },
    rankNumber: { 
      ...typography('h3'), 
      ...fontWeight('900'), 
      color: '#fff' 
    },
    userInfo: { 
      flex: 1, 
      gap: 4, 
      alignItems: common.alignStart 
    },
    userName: { 
      ...typography('label'), 
      ...fontWeight('900'), 
      color: theme.colors.text 
    },
    rankChange: {
      ...typography('caption'),
      fontSize: 13,
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
    },
    subjectChip: {
      backgroundColor: theme.mode === 'light' ? theme.colors.background : `${theme.colors.surface}80`,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    subjectLabel: {
      ...typography('caption'),
      fontSize: 11,
      ...fontWeight('bold'),
      color: rankColor,
    },
    rightSection: { 
      alignItems: 'center', 
      gap: 8, 
      ...common.marginStart(16) 
    },
    trophyBg: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeAgo: {
      ...typography('caption'),
      fontSize: 10,
      ...fontWeight('700'),
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
    },
  });

export default React.memo(RankChangeCard);
