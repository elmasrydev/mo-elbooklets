import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { layout } from '../config/layout';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const TODAY_SCHEDULE_QUERY = gql`
  query TodaySchedule {
    todaySchedule {
      date
      dayName
      dayOfWeek
      schedule {
        id
        subject {
          id
          name
        }
        lessonGoal
        quizGoal
        lessonsCompleted
        quizzesCompleted
        completionPercentage
        isComplete
      }
    }
  }
`;

const TodaysPlanWidget: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const common = useCommonStyles();

  const { data, loading, error } = useQuery(TODAY_SCHEDULE_QUERY, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60000,
  });
  const currentStyles = styles(theme, common, fontSizes, spacing, borderRadius);

  if (loading && !data)
    return (
      <View style={common.card}>
        <View style={currentStyles.header}>
          <View style={{ flexDirection: common.rowDirection, alignItems: 'center' }}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={theme.colors.text}
              style={{ marginRight: 8 }}
            />
            <Text style={currentStyles.title}>{t('study_calendar.today_plan')}</Text>
          </View>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      </View>
    );

  if (error) return null;
  const schedule = data?.todaySchedule?.schedule || [];
  const dayName = data?.todaySchedule?.dayName || '';

  if (schedule.length === 0)
    return (
      <View style={common.card}>
        <View style={currentStyles.header}>
          <View style={{ flexDirection: common.rowDirection, alignItems: 'center' }}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={theme.colors.text}
              style={{ marginRight: 8 }}
            />
            <Text style={currentStyles.title}>{t('study_calendar.today_plan')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('StudyCalendar')}>
            <Text style={currentStyles.linkText}>{t('study_calendar.set_schedule')}</Text>
          </TouchableOpacity>
        </View>
        <View style={currentStyles.emptyContainer}>
          <Ionicons
            name="clipboard-outline"
            size={32}
            color={theme.colors.textSecondary}
            style={{ marginBottom: spacing.sm }}
          />
          <Text style={currentStyles.emptyText}>{t('study_calendar.no_schedule')}</Text>
          <Text style={currentStyles.emptyHint}>{t('study_calendar.set_schedule_hint')}</Text>
        </View>
      </View>
    );

  return (
    <View style={common.card}>
      <View style={currentStyles.header}>
        <View style={currentStyles.titleSection}>
          <View
            style={{ flexDirection: common.rowDirection, alignItems: 'center', marginBottom: 4 }}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={currentStyles.title}>{t('study_calendar.today_plan')}</Text>
          </View>
          <Text style={currentStyles.subtitle}>
            {t(`study_calendar.${dayName.toLowerCase()}`)} • {t('study_calendar.your_goals_today')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('StudyCalendar')}>
          <Text style={currentStyles.linkText}>{t('study_calendar.edit_schedule')}</Text>
        </TouchableOpacity>
      </View>
      <View style={currentStyles.scheduleList}>
        {schedule.map((item: any) => {
          const percent = Math.min(100, item.completionPercentage || 0);
          const isComplete = item.isComplete;
          return (
            <View key={item.id} style={currentStyles.scheduleItem}>
              <View
                style={[currentStyles.subjectIcon, isComplete && currentStyles.subjectIconComplete]}
              >
                <Text style={currentStyles.subjectIconText}>
                  {item.subject?.name?.charAt(0) || 'S'}
                </Text>
              </View>
              <View style={currentStyles.itemInfo}>
                <View style={currentStyles.itemHeader}>
                  <Text style={currentStyles.subjectName} numberOfLines={1}>
                    {item.subject?.name}
                  </Text>
                  {isComplete && (
                    <Text style={currentStyles.completeBadge}>
                      ✓ {t('study_calendar.complete')}
                    </Text>
                  )}
                </View>
                <View style={currentStyles.goalsRow}>
                  {item.lessonGoal > 0 && (
                    <Text style={currentStyles.goalText}>
                      📚 {item.lessonsCompleted}/{item.lessonGoal}
                    </Text>
                  )}
                  {item.quizGoal > 0 && (
                    <Text style={currentStyles.goalText}>
                      ❓ {item.quizzesCompleted}/{item.quizGoal}
                    </Text>
                  )}
                </View>
              </View>
              <View style={currentStyles.progressContainer}>
                <Text
                  style={[
                    currentStyles.progressText,
                    isComplete && currentStyles.progressTextComplete,
                  ]}
                >
                  {Math.round(percent)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = (theme: any, common: any, fontSizes: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    header: {
      flexDirection: common.rowDirection,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    titleSection: { alignItems: common.alignStart },
    title: { fontSize: fontSizes.lg, fontWeight: 'bold', color: theme.colors.text },
    subtitle: {
      fontSize: fontSizes.xs,
      color: theme.colors.textSecondary,
      marginTop: 2,
      ...common.marginStart(28),
    },
    linkText: { fontSize: fontSizes.sm, color: theme.colors.primary, fontWeight: '600' },
    loadingContainer: { padding: spacing.xl, alignItems: 'center' },
    emptyContainer: { alignItems: 'center', padding: spacing.lg },
    emptyText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: spacing.xs,
    },
    emptyHint: { fontSize: fontSizes.sm, color: theme.colors.textSecondary, textAlign: 'center' },
    scheduleList: { gap: spacing.sm },
    scheduleItem: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.sm,
      backgroundColor: theme.colors.background,
      borderRadius: borderRadius.lg,
    },
    subjectIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.primaryLight || 'rgba(147, 51, 234, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    subjectIconComplete: { backgroundColor: '#10B98120' },
    subjectIconText: { fontSize: fontSizes.lg, fontWeight: 'bold', color: theme.colors.primary },
    itemInfo: { flex: 1, alignItems: common.alignStart },
    itemHeader: { flexDirection: common.rowDirection, alignItems: 'center', gap: spacing.sm },
    subjectName: { fontSize: fontSizes.base, fontWeight: '600', color: theme.colors.text },
    completeBadge: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#10B981',
      backgroundColor: '#10B98120',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    goalsRow: { flexDirection: common.rowDirection, gap: spacing.md, marginTop: 2 },
    goalText: { fontSize: fontSizes.xs, color: theme.colors.textSecondary },
    progressContainer: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    progressText: { fontSize: fontSizes.sm, fontWeight: 'bold', color: theme.colors.text },
    progressTextComplete: { color: '#10B981' },
  });

export default TodaysPlanWidget;
