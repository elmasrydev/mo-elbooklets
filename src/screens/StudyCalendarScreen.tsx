import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { layout } from '../config/layout';

import { useTranslation } from 'react-i18next';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';
import { GenericListSkeleton } from '../components/SkeletonLoader';
import { textAlign } from '../lib/rtl';

const STUDY_SCHEDULE_QUERY = gql`
  query StudySchedule {
    studySchedule {
      id
      subject {
        id
        name
      }
      dayOfWeek
      dayName
      lessonGoal
      quizGoal
      notes
    }
  }
`;

const SUBJECTS_QUERY = gql`
  query SubjectsForUserGrade {
    subjectsForUserGrade {
      id
      name
    }
  }
`;

const SAVE_SCHEDULE_MUTATION = gql`
  mutation SaveStudySchedule($entries: [StudyScheduleInput!]!) {
    saveStudySchedule(entries: $entries) {
      id
      dayOfWeek
    }
  }
`;

interface Subject {
  id: string;
  name: string;
}

interface ScheduleEntry {
  subjectId: string;
  dayOfWeek: number;
  lessonGoal: number;
  quizGoal: number;
  notes: string;
}

const DAY_KEYS = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const StudyCalendarScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { showConfirm } = useModal();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();

  const [selectedDay, setSelectedDay] = useState(0);
  const [scheduleData, setScheduleData] = useState<{ [key: number]: ScheduleEntry[] }>({});

  const {
    data: scheduleResult,
    loading: loadingSchedule,
    refetch,
  } = useQuery<any>(STUDY_SCHEDULE_QUERY, {
    fetchPolicy: 'network-only',
  });

  const { data: subjectsResult, loading: loadingSubjects } = useQuery<any>(SUBJECTS_QUERY);

  const [saveSchedule, { loading: saving }] = useMutation(SAVE_SCHEDULE_MUTATION, {
    onCompleted: () => {
      showConfirm({
        title: t('common.success', 'Success'),
        message: t('study_calendar.schedule_saved'),
        showCancel: false,
        onConfirm: () => {},
      });
      refetch();
    },
    onError: (error: any) => {
      showConfirm({
        title: t('common.error'),
        message: error.message,
        showCancel: false,
        onConfirm: () => {},
      });
    },
  });

  // Load existing schedule data
  useFocusEffect(
    useCallback(() => {
      if (scheduleResult?.studySchedule) {
        const grouped: { [key: number]: ScheduleEntry[] } = {};
        for (let i = 0; i < 7; i++) {
          grouped[i] = [];
        }
        scheduleResult.studySchedule.forEach((item: any) => {
          grouped[item.dayOfWeek].push({
            subjectId: String(item.subject.id), // Ensure string type
            dayOfWeek: item.dayOfWeek,
            lessonGoal: item.lessonGoal,
            quizGoal: item.quizGoal,
            notes: item.notes || '',
          });
        });
        setScheduleData(grouped);
      }
    }, [scheduleResult]),
  );

  const subjects: Subject[] = subjectsResult?.subjectsForUserGrade || [];

  const addEntry = (day: number) => {
    if (subjects.length === 0) return;
    const newEntry: ScheduleEntry = {
      subjectId: String(subjects[0].id), // Ensure string type
      dayOfWeek: day,
      lessonGoal: 1,
      quizGoal: 2,
      notes: '',
    };
    setScheduleData((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), newEntry],
    }));
  };

  const removeEntry = (day: number, index: number) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((_, i) => i !== index),
    }));
  };

  const updateEntry = (day: number, index: number, field: keyof ScheduleEntry, value: any) => {
    setScheduleData((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((entry, i) =>
        i === index ? { ...entry, [field]: field === 'subjectId' ? String(value) : value } : entry,
      ),
    }));
  };

  const handleSave = () => {
    const allEntries: any[] = [];
    Object.values(scheduleData).forEach((dayEntries) => {
      dayEntries.forEach((entry) => {
        if (entry.lessonGoal === 0 && entry.quizGoal === 0) {
          return; // omit records with 0 lessons and 0 quizzes
        }
        allEntries.push({
          subjectId: entry.subjectId,
          dayOfWeek: entry.dayOfWeek,
          lessonGoal: entry.lessonGoal,
          quizGoal: entry.quizGoal,
          notes: entry.notes,
        });
      });
    });

    saveSchedule({ variables: { entries: allEntries } });
  };

  const currentStyles = styles(theme, isRTL, typography, fontWeight, spacing, borderRadius);

  if (loadingSchedule || loadingSubjects) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <UnifiedHeader
          showBackButton
          title={t('study_calendar.header_title')}
          subtitle={t('study_calendar.header_subtitle')}
        />
        <View style={{ paddingTop: 16, paddingHorizontal: layout.screenPadding }}>
          <GenericListSkeleton numItems={6} />
        </View>
      </View>
    );
  }

  const currentDayEntries = scheduleData[selectedDay] || [];

  return (
    <View style={currentStyles.container}>
      {/* Header with Back Button */}
      <UnifiedHeader
        showBackButton
        title={t('study_calendar.header_title')}
        subtitle={t('study_calendar.header_subtitle')}
      />

      {/* Day Tabs */}
      <View style={currentStyles.dayTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[currentStyles.dayTabsContent]}
        >
          {DAY_KEYS.map((dayKey, index) => (
            <TouchableOpacity
              key={dayKey}
              style={[currentStyles.dayTab, selectedDay === index && currentStyles.dayTabActive]}
              onPress={() => setSelectedDay(index)}
            >
              <Text
                style={[
                  currentStyles.dayTabText,
                  selectedDay === index && currentStyles.dayTabTextActive,
                ]}
              >
                {t(`study_calendar.${dayKey}`)}
              </Text>
              {(scheduleData[index] || []).length > 0 && (
                <View
                  style={[
                    currentStyles.dayBadge,
                    selectedDay === index && currentStyles.dayBadgeActive,
                  ]}
                >
                  <Text style={currentStyles.dayBadgeText}>
                    {(scheduleData[index] || []).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Day Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: layout.screenPadding,
          paddingBottom: common.insets.bottom + 50,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={currentStyles.dayTitle}>
          {isRTL
            ? t('common.schedule') + ' ' + t(`study_calendar.${DAY_KEYS[selectedDay]}`)
            : t(`study_calendar.${DAY_KEYS[selectedDay]}`) + ' ' + t('common.schedule')}
        </Text>

        {currentDayEntries.map((entry, index) => (
          <View key={index} style={currentStyles.entryCard}>
            {/* Subject Picker */}
            <View style={currentStyles.entryRow}>
              <Text style={currentStyles.entryLabel}>{t('common.subject')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      currentStyles.subjectPill,
                      entry.subjectId === subject.id && currentStyles.subjectPillActive,
                    ]}
                    onPress={() => updateEntry(selectedDay, index, 'subjectId', subject.id)}
                  >
                    <Text
                      style={[
                        currentStyles.subjectPillText,
                        entry.subjectId === subject.id && currentStyles.subjectPillTextActive,
                      ]}
                    >
                      {subject.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Goals Row */}
            <View style={currentStyles.goalsRow}>
              <View style={currentStyles.goalInput}>
                <View style={currentStyles.goalHeader}>
                  <View style={currentStyles.goalIconBox}>
                    <Ionicons name="newspaper-outline" size={16} color={theme.colors.primary} />
                  </View>
                  <Text style={currentStyles.goalLabel}>{t('study_calendar.lessons_goal')}</Text>
                </View>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    style={currentStyles.goalValue}
                    keyboardType="numeric"
                    value={String(entry.lessonGoal)}
                    onChangeText={(text) =>
                      updateEntry(selectedDay, index, 'lessonGoal', parseInt(text) || 0)
                    }
                  />
                  {entry.lessonGoal > 0 && (
                    <TouchableOpacity
                      style={currentStyles.clearButton}
                      onPress={() => updateEntry(selectedDay, index, 'lessonGoal', 0)}
                    >
                      <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={currentStyles.goalInput}>
                <View style={currentStyles.goalHeader}>
                  <View
                    style={[
                      currentStyles.goalIconBox,
                      { backgroundColor: (theme.colors.orange || '#F59E0B') + '1A' },
                    ]}
                  >
                    <Ionicons
                      name="bulb-outline"
                      size={16}
                      color={theme.colors.orange || '#F59E0B'}
                    />
                  </View>
                  <Text style={currentStyles.goalLabel}>{t('study_calendar.quizzes_goal')}</Text>
                </View>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    style={currentStyles.goalValue}
                    keyboardType="numeric"
                    value={String(entry.quizGoal)}
                    onChangeText={(text) =>
                      updateEntry(selectedDay, index, 'quizGoal', parseInt(text) || 0)
                    }
                  />
                  {entry.quizGoal > 0 && (
                    <TouchableOpacity
                      style={currentStyles.clearButton}
                      onPress={() => updateEntry(selectedDay, index, 'quizGoal', 0)}
                    >
                      <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Notes */}
            <View style={currentStyles.notesWrapper}>
              <TextInput
                style={currentStyles.notesInput}
                placeholder={t('study_calendar.notes_placeholder')}
                placeholderTextColor={theme.colors.textTertiary}
                value={entry.notes}
                onChangeText={(text) => updateEntry(selectedDay, index, 'notes', text)}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Remove Button */}
            <View style={currentStyles.removeContainer}>
              <AppButton
                title={t('study_calendar.remove_subject')}
                onPress={() => {
                  showConfirm({
                    title: t('common.confirm', 'Confirm'),
                    message: t(
                      'study_calendar.confirm_remove',
                      'Are you sure you want to remove this subject from the schedule?',
                    ),
                    onConfirm: () => removeEntry(selectedDay, index),
                  });
                }}
                variant="outline"
                textStyle={{ color: theme.colors.error || '#EF4444' }}
                style={{
                  borderColor: theme.colors.error || '#EF4444',
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                }}
              />
            </View>
          </View>
        ))}

        {/* Add Button */}
        <AppButton
          title={'+ ' + t('study_calendar.add_subject')}
          onPress={() => addEntry(selectedDay)}
          disabled={subjects.length === 0}
          variant="outline"
          style={{
            borderStyle: 'dashed',
            //borderRadius: 16,
            marginTop: spacing.mdd,
            marginBottom: spacing.md,
            height: 50,
          }}
        />

        {/* Save Button */}
        <AppButton
          title={t('study_calendar.save_schedule')}
          onPress={handleSave}
          loading={saving}
          variant="primary"
          style={{ marginBottom: 40, borderRadius: 16, height: 48 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = (
  theme: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any,
  spacing: any,
  borderRadius: any,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: spacing.md,
      ...typography('body'),
      color: theme.colors.textSecondary,
    },
    dayTabsContainer: {
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dayTabsContent: {
      paddingVertical: spacing.sm,
      paddingHorizontal: layout.screenPadding,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dayTab: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginHorizontal: spacing.xs,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.background,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dayTabActive: {
      backgroundColor: theme.colors.primary,
    },
    dayTabText: {
      ...typography('label'),
      ...fontWeight('600'),
      color: theme.colors.text,
    },
    dayTabTextActive: {
      color: '#fff',
    },
    dayBadge: {
      minWidth: 25,
      minHeight: 25,
      marginLeft: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 12.5,
      backgroundColor: theme.colors.primary + '30',
    },
    dayBadgeActive: {
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dayBadgeText: {
      ...typography('caption'),
      ...fontWeight('bold'),
      color: theme.colors.buttonPrimaryText,
      textAlign: 'center',
    },
    dayTitle: {
      ...typography('h2'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      marginBottom: spacing.sectionGap,
      textAlign: 'left',
    },
    entryCard: {
      backgroundColor: theme.colors.card || theme.colors.surface,
      borderRadius: borderRadius.xl || 24,
      marginBottom: spacing.sectionGap,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
      padding: layout.screenPadding,
    },
    entryRow: {
      marginBottom: spacing.mdd,
    },
    entryLabel: {
      ...typography('body'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
      marginBottom: spacing.sm,
      textAlign: 'left',
    },
    subjectPill: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.xl || 24,
      backgroundColor: 'transparent',
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    subjectPillActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    subjectPillText: {
      ...typography('label'),
      color: theme.colors.text,
    },
    subjectPillTextActive: {
      color: '#fff',
      ...fontWeight('600'),
    },
    goalsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    goalInput: {
      flex: 1,
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    goalIconBox: {
      width: 26,
      height: 26,
      borderRadius: borderRadius.sm,
      backgroundColor: theme.colors.primary + '1A',
      justifyContent: 'center',
      alignItems: 'center',

      marginLeft: spacing.xs,
    },
    goalLabel: {
      ...typography('label'),
      ...fontWeight('600'),
      color: theme.colors.textSecondary,
    },
    goalValue: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      height: 46,
      verticalAlign: 'center',
      paddingHorizontal: spacing.xl,
      ...typography('h3'),
      ...fontWeight('bold'),
      color: theme.colors.text,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    clearButton: {
      position: 'absolute',
      left: spacing.xs,
      padding: spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      zIndex: 1,
    },
    notesWrapper: {
      marginBottom: spacing.md,
    },
    notesInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      minHeight: 100,
      padding: spacing.md,
      paddingTop: spacing.md,
      ...typography('body'),
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    removeContainer: {
      marginTop: spacing.xs,
      width: '100%',
    },
  });

export default StudyCalendarScreen;
