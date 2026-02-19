import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { layout } from '../config/layout';
import CircularProgress from './CircularProgress';
import { getTimeAgo } from '../lib/dateUtils';
import { getScoreColor } from '../lib/scoreUtils';

import { getSubjectConfig } from '../utils/subjectTheme';

interface ActivityCardProps {
  activity: {
    id: string;
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

  const scorePercent = Math.round((activity.score / activity.totalQuestions) * 100);
  const scoreColor = getScoreColor(scorePercent);
  const subjectConfig = getSubjectConfig(activity.subject?.name, theme);
  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius);

  return (
    <TouchableOpacity
      style={currentStyles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[currentStyles.iconContainer, { backgroundColor: subjectConfig.bg }]}>
        <Ionicons name={subjectConfig.icon} size={24} color={subjectConfig.color} />
      </View>
      <View style={currentStyles.infoContainer}>
        <Text style={currentStyles.subjectName}>{activity.subject.name}</Text>
        <Text style={currentStyles.timeText}>
          {getTimeAgo(activity.completedAt, t, language)}
        </Text>
      </View>
      <View style={currentStyles.rightContainer}>
        <CircularProgress size={50} strokeWidth={5} percentage={scorePercent} color={scoreColor} />
      </View>
    </TouchableOpacity>
  );
};

const styles = (theme: any, common: any, fontSizes: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    card: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: spacing.lg,
      borderRadius: layout.borderRadius.xl,
      marginBottom: spacing.md,
      ...layout.shadow,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContainer: { flex: 1, ...common.marginStart(12), alignItems: common.alignStart },
    subjectName: { fontSize: fontSizes.base, fontWeight: 'bold', color: theme.colors.text },
    timeText: {
      fontSize: fontSizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 4,
      fontWeight: '500',
    },
    rightContainer: { ...common.marginStart(12), alignItems: 'center', justifyContent: 'center' },
  });

export default RecentActivityCard;
