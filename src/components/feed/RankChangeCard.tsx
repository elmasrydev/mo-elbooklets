import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { getTimeAgo } from '../../lib/dateUtils';

interface RankChangeCardProps {
  item: {
    id: string;
    user: {
      id: string;
      name: string;
      grade: {
        id: string;
        name: string;
      };
    };
    createdAt: string;
    rankData: {
      previousRank?: number;
      newRank: number;
      subject?: {
        id: string;
        name: string;
      };
      isOverall: boolean;
    };
  };
}

const RankChangeCard: React.FC<RankChangeCardProps> = ({ item }) => {
  const { theme } = useTheme();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();

  const rankColors: { [key: number]: string } = {
    1: '#F59E0B', // Gold
    2: '#94A3B8', // Silver
    3: '#EA580C', // Bronze
  };
  const rankColor = rankColors[item.rankData.newRank] || '#EA580C';

  const getRankLabel = (rank: number) => {
    if (rank === 1) return t('social_screen.rank_1st');
    if (rank === 2) return t('social_screen.rank_2nd');
    if (rank === 3) return t('social_screen.rank_3rd');
    return `${rank}${t('social_screen.rank_th')}`;
  };

  const currentStyles = createStyles(theme, isRTL, rankColor);

  return (
    <View style={currentStyles.card}>
      <View style={[currentStyles.contentRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={[currentStyles.leftSection, isRTL && { flexDirection: 'row-reverse' }]}>
          {/* Rank Badge */}
          <View style={currentStyles.rankBadge}>
            <Text style={currentStyles.rankNumber}>#{item.rankData.newRank}</Text>
          </View>

          {/* User Info */}
          <View style={[currentStyles.userInfo, isRTL && { alignItems: 'flex-end' }]}>
            <Text style={[currentStyles.userName, isRTL && { textAlign: 'right' }]}>
              {item.user.name}
            </Text>
            <Text style={[currentStyles.rankChange, isRTL && { textAlign: 'right' }]}>
              {item.rankData.previousRank
                ? t('social_screen.moved_to_rank', {
                    from: item.rankData.previousRank,
                    to: getRankLabel(item.rankData.newRank),
                  })
                : t('social_screen.reached_rank', { rank: getRankLabel(item.rankData.newRank) })}
            </Text>
            <Text style={[currentStyles.subjectLabel, isRTL && { textAlign: 'right' }]}>
              {item.rankData.isOverall
                ? t('social_screen.overall_ranking')
                : item.rankData.subject?.name || t('common.quiz')}
            </Text>
          </View>
        </View>

        {/* Trophy and Time */}
        <View style={currentStyles.rightSection}>
          <Ionicons name="trophy" size={40} color={rankColor} />
          <Text style={currentStyles.timeAgo}>{getTimeAgo(item.createdAt, t, language)}</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any, isRTL: boolean, rankColor: string) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: rankColor,
    },
    contentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    rankBadge: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: rankColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankNumber: {
      fontSize: 20,
      fontWeight: '900',
      color: '#fff',
    },
    userInfo: {
      flex: 1,
      gap: 4,
    },
    userName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
    },
    rankChange: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    subjectLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: rankColor,
      marginTop: 2,
    },
    rightSection: {
      alignItems: 'center',
      gap: 6,
    },
    timeAgo: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textTertiary,
    },
  });

export default RankChangeCard;
