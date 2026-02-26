import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
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

interface Subject {
  id: string;
  name: string;
  description?: string;
  chapters: { id: string }[];
}

const StudyScreen: React.FC = () => {
  const { theme, fontSizes, spacing, borderRadius } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const common = useCommonStyles();
  const { typography } = useTypography();
  const navigation = useNavigation<any>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, []),
  );

  const fetchSubjects = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    navigation.navigate('StudyChapters', { subject });
  };

  const currentStyles = styles(theme, fontSizes, spacing, borderRadius, common, isRTL, typography);

  return (
    <View style={currentStyles.container}>
      <UnifiedHeader title={t('study_screen.header_title')} />

      {loading && subjects.length === 0 ? (
        <View style={currentStyles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('study_screen.loading_subjects')} </Text>
        </View>
      ) : error ? (
        <View style={currentStyles.errorState}>
          <Ionicons name="alert-circle-outline" size={spacing.icon.xl} color={theme.colors.error} />
          <Text style={currentStyles.errorStateTitle}>
            {t('study_screen.error_loading_subjects')}
          </Text>
          <Text style={currentStyles.errorStateSubtitle}> {error} </Text>
          <AppButton
            title={t('home_screen.try_again')}
            onPress={fetchSubjects}
            size="sm"
            fullWidth={false}
          />
        </View>
      ) : subjects.length === 0 ? (
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
          contentContainerStyle={{
            padding: layout.screenPadding,
            paddingBottom: Math.max(common.insets.bottom, spacing.xl),
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchSubjects}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {subjects.map((subject) => {
            const config = getSubjectConfig(subject.name, theme);
            return (
              <TouchableOpacity
                key={subject.id}
                style={currentStyles.subjectCard}
                onPress={() => handleSubjectSelect(subject)}
              >
                <View style={[currentStyles.iconBox, { backgroundColor: config.bg }]}>
                  <Ionicons name={config.icon as any} size={spacing.icon.lg} color={config.color} />
                </View>

                <View style={currentStyles.subjectInfo}>
                  <Text style={currentStyles.subjectName}> {subject.name} </Text>
                  <Text style={currentStyles.subjectChapters}>
                    {subject.chapters?.length || 0} {t('study_screen.chapters')}
                    {subject.description ? ` • ${subject.description}` : ''}
                  </Text>
                </View>

                <View style={currentStyles.arrowContainer}>
                  <Ionicons
                    name={isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={spacing.icon.md}
                    color={theme.colors.textTertiary}
                  />
                </View>
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
    subjectCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.md,
      paddingVertical: spacing.md - 4,
      marginBottom: spacing.sectionGap,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...layout.shadow,
    },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginEnd(spacing.md),
    },
    subjectInfo: {
      flex: 1,
      justifyContent: 'center',
      alignItems: common.alignStart,
    },
    subjectName: {
      ...typography('bodyLarge'),
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: spacing.xxs,
      textAlign: common.textAlign,
    },
    subjectChapters: {
      ...typography('caption'),
      color: theme.colors.textSecondary,
      textAlign: common.textAlign,
    },
    arrowContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      ...common.marginStart(spacing.sm),
    },
  });

export default StudyScreen;
