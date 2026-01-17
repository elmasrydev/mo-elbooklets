import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';

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
  
  const [selectedDay, setSelectedDay] = useState(0);
  const [scheduleData, setScheduleData] = useState<{ [key: number]: ScheduleEntry[] }>({});

  const { data: scheduleResult, loading: loadingSchedule, refetch } = useQuery(STUDY_SCHEDULE_QUERY, {
    fetchPolicy: 'network-only',
  });
  
  const { data: subjectsResult, loading: loadingSubjects } = useQuery(SUBJECTS_QUERY);
  
  const [saveSchedule, { loading: saving }] = useMutation(SAVE_SCHEDULE_MUTATION, {
    onCompleted: () => {
      Alert.alert(t('study_calendar.schedule_saved'));
      refetch();
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.message);
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
    }, [scheduleResult])
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
    setScheduleData(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newEntry],
    }));
  };

  const removeEntry = (day: number, index: number) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter((_, i) => i !== index),
    }));
  };

  const updateEntry = (day: number, index: number, field: keyof ScheduleEntry, value: any) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: (prev[day] || []).map((entry, i) => 
        i === index ? { ...entry, [field]: field === 'subjectId' ? String(value) : value } : entry
      ),
    }));
  };

  const handleSave = () => {
    const allEntries: any[] = [];
    Object.values(scheduleData).forEach(dayEntries => {
      dayEntries.forEach(entry => {
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

  const currentStyles = styles(theme, isRTL, fontSizes, spacing, borderRadius);

  if (loadingSchedule || loadingSubjects) {
    return (
      <View style={currentStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={currentStyles.loadingText}>{t('study_calendar.loading_schedule')}</Text>
      </View>
    );
  }

  const currentDayEntries = scheduleData[selectedDay] || [];

  return (
    <View style={currentStyles.container}>
      {/* Header with Back Button */}
      <View style={currentStyles.header}>
        <View style={currentStyles.headerRow}>
          <TouchableOpacity 
            style={currentStyles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons 
              name={isRTL ? "arrow-forward" : "arrow-back"} 
              size={24} 
              color={theme.colors.headerText || '#fff'} 
            />
          </TouchableOpacity>
          <View style={currentStyles.headerTitleContainer}>
            <Text style={currentStyles.headerTitle}>{t('study_calendar.header_title')}</Text>
            <Text style={currentStyles.headerSubtitle}>{t('study_calendar.header_subtitle')}</Text>
          </View>
        </View>
      </View>

      {/* Day Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={currentStyles.dayTabsContainer}
        contentContainerStyle={currentStyles.dayTabsContent}
      >
        {DAY_KEYS.map((dayKey, index) => (
          <TouchableOpacity
            key={dayKey}
            style={[
              currentStyles.dayTab,
              selectedDay === index && currentStyles.dayTabActive,
            ]}
            onPress={() => setSelectedDay(index)}
          >
            <Text style={[
              currentStyles.dayTabText,
              selectedDay === index && currentStyles.dayTabTextActive,
            ]}>
              {t(`study_calendar.${dayKey}`)}
            </Text>
            {(scheduleData[index] || []).length > 0 && (
              <View style={[
                currentStyles.dayBadge,
                selectedDay === index && currentStyles.dayBadgeActive,
              ]}>
                <Text style={currentStyles.dayBadgeText}>
                  {(scheduleData[index] || []).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Day Content */}
      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        <Text style={currentStyles.dayTitle}>
          {t(`study_calendar.${DAY_KEYS[selectedDay]}`)} {t('common.schedule') || 'Schedule'}
        </Text>

        {currentDayEntries.map((entry, index) => (
          <View key={index} style={currentStyles.entryCard}>
            {/* Subject Picker */}
            <View style={currentStyles.entryRow}>
              <Text style={currentStyles.entryLabel}>{t('study_calendar.lessons_goal')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {subjects.map(subject => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      currentStyles.subjectPill,
                      entry.subjectId === subject.id && currentStyles.subjectPillActive,
                    ]}
                    onPress={() => updateEntry(selectedDay, index, 'subjectId', subject.id)}
                  >
                    <Text style={[
                      currentStyles.subjectPillText,
                      entry.subjectId === subject.id && currentStyles.subjectPillTextActive,
                    ]}>
                      {subject.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Goals Row */}
            <View style={currentStyles.goalsRow}>
              <View style={currentStyles.goalInput}>
                <Text style={currentStyles.goalLabel}>📚 {t('study_calendar.lessons_goal')}</Text>
                <TextInput
                  style={currentStyles.goalValue}
                  keyboardType="numeric"
                  value={String(entry.lessonGoal)}
                  onChangeText={(text) => updateEntry(selectedDay, index, 'lessonGoal', parseInt(text) || 0)}
                />
              </View>
              <View style={currentStyles.goalInput}>
                <Text style={currentStyles.goalLabel}>❓ {t('study_calendar.quizzes_goal')}</Text>
                <TextInput
                  style={currentStyles.goalValue}
                  keyboardType="numeric"
                  value={String(entry.quizGoal)}
                  onChangeText={(text) => updateEntry(selectedDay, index, 'quizGoal', parseInt(text) || 0)}
                />
              </View>
            </View>

            {/* Notes */}
            <TextInput
              style={currentStyles.notesInput}
              placeholder={t('study_calendar.notes_placeholder')}
              placeholderTextColor={theme.colors.textTertiary}
              value={entry.notes}
              onChangeText={(text) => updateEntry(selectedDay, index, 'notes', text)}
            />

            {/* Remove Button */}
            <TouchableOpacity
              style={currentStyles.removeButton}
              onPress={() => removeEntry(selectedDay, index)}
            >
              <Text style={currentStyles.removeButtonText}>{t('study_calendar.remove_subject')}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Button */}
        <TouchableOpacity
          style={currentStyles.addButton}
          onPress={() => addEntry(selectedDay)}
          disabled={subjects.length === 0}
        >
          <Text style={currentStyles.addButtonText}>+ {t('study_calendar.add_subject')}</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          style={currentStyles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={currentStyles.saveButtonText}>{t('study_calendar.save_schedule')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = (theme: any, isRTL: boolean, fontSizes: any, spacing: any, borderRadius: any) =>
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
      fontSize: fontSizes.base,
      color: theme.colors.textSecondary,
    },
    header: {
      padding: spacing.xl,
      paddingTop: 50,
      backgroundColor: theme.colors.headerBackground || theme.colors.primary,
    },
    headerRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : spacing.md,
      marginLeft: isRTL ? spacing.md : 0,
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    headerTitle: {
      fontSize: fontSizes['2xl'],
      fontWeight: 'bold',
      color: theme.colors.headerText || '#fff',
    },
    headerSubtitle: {
      fontSize: fontSizes.base,
      opacity: 0.9,
      marginTop: spacing.xs,
      color: theme.colors.headerSubtitle || 'rgba(255,255,255,0.8)',
    },
    dayTabsContainer: {
      maxHeight: 60,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dayTabsContent: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      flexDirection: isRTL ? 'row-reverse' : 'row',
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
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: theme.colors.text,
    },
    dayTabTextActive: {
      color: '#fff',
    },
    dayBadge: {
      marginLeft: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: theme.colors.primary + '30',
    },
    dayBadgeActive: {
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dayBadgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    dayTitle: {
      fontSize: fontSizes.xl,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: spacing.lg,
      textAlign: isRTL ? 'right' : 'left',
    },
    entryCard: {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    entryRow: {
      marginBottom: spacing.md,
    },
    entryLabel: {
      fontSize: fontSizes.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: spacing.sm,
      textAlign: isRTL ? 'right' : 'left',
    },
    subjectPill: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.background,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    subjectPillActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    subjectPillText: {
      fontSize: fontSizes.sm,
      color: theme.colors.text,
    },
    subjectPillTextActive: {
      color: '#fff',
    },
    goalsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    goalInput: {
      flex: 1,
    },
    goalLabel: {
      fontSize: fontSizes.xs,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
      textAlign: isRTL ? 'right' : 'left',
    },
    goalValue: {
      backgroundColor: theme.colors.background,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      fontSize: fontSizes.lg,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    notesInput: {
      backgroundColor: theme.colors.background,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSizes.sm,
      color: theme.colors.text,
      textAlign: isRTL ? 'right' : 'left',
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing.sm,
    },
    removeButton: {
      alignSelf: 'flex-end',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    removeButtonText: {
      fontSize: fontSizes.sm,
      color: theme.colors.error || '#EF4444',
      fontWeight: '600',
    },
    addButton: {
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    addButtonText: {
      fontSize: fontSizes.base,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      alignItems: 'center',
      marginBottom: spacing['3xl'],
    },
    saveButtonText: {
      fontSize: fontSizes.base,
      fontWeight: 'bold',
      color: '#fff',
    },
  });

export default StudyCalendarScreen;
