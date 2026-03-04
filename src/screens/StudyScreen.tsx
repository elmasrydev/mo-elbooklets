import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useTypography } from '../hooks/useTypography';
import { getSubjectConfig } from '../utils/subjectTheme';
import { useTranslation } from 'react-i18next';
import { layout } from '../config/layout';
import { tryFetchWithFallback } from '../config/api';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';
import SubjectIcon from '../components/SubjectIcon';

interface Subject {
  id: string;
  name: string;
  description?: string;
  chapters: { id: string }[];
}

const USE_DUMMY_DATA = false; // Flag for testing UI without real API data
const DUMMY_SUBJECTS: Subject[] = [
  { id: '1', name: 'Arabic / عربي', description: 'Secondary 1', chapters: [] },
  { id: '2', name: 'English', description: 'Secondary 1', chapters: [] },
  { id: '3', name: 'Math / رياضيات', description: 'Secondary 1', chapters: [] },
  { id: '4', name: 'Science / علوم', description: 'Secondary 1', chapters: [] },
  { id: '5', name: 'History / تاريخ', description: 'Secondary 1', chapters: [] },
  { id: '6', name: 'Geography / جغرافيا', description: 'Secondary 1', chapters: [] },
];

const StudyScreen: React.FC = () => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography, fontWeight } = useTypography();
  const navigation = useNavigation<any>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchRef = React.useRef<number>(0);
  const STALE_MS = 30_000;

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current < STALE_MS && subjects.length > 0) return;
      lastFetchRef.current = now;
      fetchSubjects();
    }, [subjects.length]),
  );

  const fetchSubjects = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError(t('common.error'));
        return;
      }

      const result = await tryFetchWithFallback(
        `
        query SubjectsForUserGrade {
          subjectsForUserGrade {
            id
            name
            description
            chapters {
              id
            }
          }
        }
      `,
        undefined,
        token,
      );

      if (result.data?.subjectsForUserGrade) {
        setSubjects(result.data.subjectsForUserGrade);
      } else {
        setError(result.errors?.[0]?.message || t('study_screen.error_loading_subjects'));
      }
    } catch (err: any) {
      console.error('Fetch subjects error:', err);
      setError(err.message || t('study_screen.error_loading_subjects'));
      if (!isRefresh) setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubjects(true);
    setRefreshing(false);
  }, []);

  const handleSubjectSelect = (subject: Subject) => {
    navigation.navigate('StudyChapters', { subject });
  };

  const subjectsToRender = USE_DUMMY_DATA ? DUMMY_SUBJECTS : subjects;

  const currentStyles = useMemo(
    () => styles(theme, fontSizes, spacing, borderRadius, common, isRTL, typography, fontWeight),
    [theme, fontSizes, spacing, borderRadius, common, isRTL, typography, fontWeight],
  );

  return (
    <View style={currentStyles.container}>
      <UnifiedHeader title={t('study_screen.header_title')} />

      {loading && subjectsToRender.length === 0 && !USE_DUMMY_DATA ? (
        <View style={currentStyles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('study_screen.loading_subjects')} </Text>
        </View>
      ) : error && !USE_DUMMY_DATA ? (
        <View style={currentStyles.errorState}>
          <Ionicons name="alert-circle-outline" size={spacing.icon.xl} color={theme.colors.error} />
          <Text style={currentStyles.errorStateTitle}>
            {t('study_screen.error_loading_subjects')}
          </Text>
          <Text style={currentStyles.errorStateSubtitle}> {error} </Text>
          <AppButton
            title={t('home_screen.try_again')}
            onPress={() => fetchSubjects()}
            size="sm"
            fullWidth={false}
          />
        </View>
      ) : subjectsToRender.length === 0 ? (
        <View style={currentStyles.emptyState}>
          <Ionicons name="book-outline" size={spacing.icon.xl} color={theme.colors.textSecondary} />
          <Text style={currentStyles.emptyStateTitle}>
            {t('study_screen.no_subjects_available')}
          </Text>
          <Text style={currentStyles.emptyStateSubtitle}>
            {t('study_screen.no_subjects_for_grade')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={currentStyles.content}
          contentContainerStyle={[
            currentStyles.scrollContentContainer,
            { paddingBottom: Math.max(common.insets.bottom, spacing.xl) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={currentStyles.pageHeader}>
            <Text style={currentStyles.pageTitle}>{t('study_screen.page_title')}</Text>
            <Text style={currentStyles.pageSubtitle}>{t('study_screen.page_subtitle')}</Text>
          </View>

          {subjectsToRender.map((subject) => {
            const config = getSubjectConfig(subject.name, theme);
            return (
              <TouchableOpacity
                key={subject.id}
                style={currentStyles.subjectCard}
                onPress={() => handleSubjectSelect(subject)}
              >
                <SubjectIcon
                  subjectName={subject.name}
                  size={56}
                  style={currentStyles.iconBoxOverride}
                />

                <View style={currentStyles.subjectInfo}>
                  <Text style={currentStyles.subjectName}>{subject.name}</Text>
                  <Text style={currentStyles.subjectChapters}>
                    {subject.chapters?.length || 0} {t('study_screen.available_booklets')}
                    {subject.description ? ` • ${subject.description}` : ''}
                  </Text>
                </View>

                {/* Right Subject Icon as Watermark */}
                {config.localIconGrey ? (
                  <Image
                    source={config.localIconGrey}
                    style={[currentStyles.watermarkIcon]}
                    resizeMode="center"
                  />
                ) : (
                  <Ionicons
                    name={config.icon as any}
                    size={28}
                    color={theme.colors.border}
                    style={currentStyles.watermarkIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = (
  theme: any,
  fontSizes: any,
  spacing: any,
  borderRadius: any,
  common: any,
  isRTL: boolean,
  typography: any,
  fontWeight: any,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: spacing.md,
      ...typography('body'),
      color: theme.colors.textSecondary,
    },
    errorState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing['2xl'],
    },
    errorStateTitle: {
      ...typography('h3'),
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      color: theme.colors.text,
      textAlign: 'center',
    },
    errorStateSubtitle: {
      ...typography('caption'),
      textAlign: 'center',
      marginBottom: spacing.xl,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing['2xl'],
    },
    emptyStateTitle: {
      ...typography('h3'),
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      color: theme.colors.text,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      ...typography('caption'),
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
    pageHeader: {
      marginBottom: spacing.xl,
      marginTop: spacing.sm,
    },
    pageTitle: {
      ...typography('h1'),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: spacing.xs,
      textAlign: common.textAlign,
    },
    pageSubtitle: {
      ...typography('body'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    subjectCard: {
      minHeight: 90,
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.lg || 20,
      borderWidth: 0,
      ...layout.shadow,
    },
    iconBoxOverride: {
      ...common.marginEnd(spacing.md),
    },
    subjectInfo: {
      flex: 1,
      justifyContent: 'center',
      alignItems: common.alignStart,
    },
    subjectName: {
      ...typography('h3'),
      ...fontWeight('700'),
      color: theme.colors.text,
      marginBottom: 2,
      textAlign: common.textAlign,
    },
    subjectChapters: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    watermarkIcon: {
      opacity: 0.6,
      width: 20,
      height: 20,
      ...common.marginStart(spacing.sm),
    },
    scrollContentContainer: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.md,
    },
  });

export default StudyScreen;
