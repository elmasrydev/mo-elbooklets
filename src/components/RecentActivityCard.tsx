import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';
import { getTimeAgo } from '../lib/dateUtils';
import SubjectIcon from './SubjectIcon';

interface ActivityCardProps {
  activity: {
    id: string;
    name?: string;
    subject: { name: string };
    score: number;
    totalQuestions: number;
    completedAt: string;
    isPassed: boolean;
  };
  onPress?: () => void;
}

const RecentActivityCard: React.FC<ActivityCardProps> = ({ activity, onPress }) => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const { isRTL } = useLanguage();
  const scorePercent = Math.round((activity.score / activity.totalQuestions) * 100);
  const s = styles(theme, common, fontSizes, spacing, borderRadius, typography, fontWeight, isRTL);

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      {/* Colored icon box */}
      <SubjectIcon subjectName={activity.subject?.name} size={48} />

      {/* Title + subtitle */}
      <View style={s.info}>
        <Text style={s.title} numberOfLines={1}>
          {activity.name || activity.subject?.name || 'Quiz'}
        </Text>
        <Text style={s.subtitle}>
          {activity.isPassed ? t('home_screen.completed') : t('common.completed')}
        </Text>
      </View>

      {/* Time and Score */}
      <View style={s.rightColumn}>
        <View
          style={[
            s.scoreBadge,
            {
              backgroundColor: activity.isPassed
                ? theme.colors.success + '20'
                : theme.colors.error + '20',
            },
          ]}
        >
          <Text
            style={[
              s.scoreText,
              { color: activity.isPassed ? theme.colors.success : theme.colors.error },
            ]}
          >
            {scorePercent}%
          </Text>
        </View>
        <Text style={s.time}>{getTimeAgo(activity.completedAt, t, language)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = (
  theme: any,
  common: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  typography: any,
  fontWeight: any,
  isRTL: boolean,
) =>
  StyleSheet.create({
    card: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
      gap: spacing.md,
    },
    info: {
      flex: 1,
      alignItems: common.alignStart,
    },
    title: {
      ...typography('bodySmall'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: 'left',
    },
    subtitle: {
      ...typography('caption'),
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
      textAlign: 'left',
    },
    time: {
      ...typography('caption'),
      fontSize: 10,
      color: theme.colors.textTertiary,
      ...fontWeight('500'),
    },
    rightColumn: {
      alignItems: 'flex-end',
      gap: 4,
    },
    scoreBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    scoreText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      fontSize: 11,
    },
  });

export default React.memo(RecentActivityCard);
