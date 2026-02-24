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
      {/* Header */}
      <UnifiedHeader
        title={t('study_screen.header_title')}
        subtitle={t('study_screen.header_subtitle')}
      />

      {/* Content */}
      {loading && subjects.length === 0 ? (
        <View style={currentStyles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}> {t('study_screen.loading_subjects')} </Text>
        </View>
      ) : error ? (
        <View style={currentStyles.errorState}>
          <Text style={currentStyles.errorStateIcon}>⚠️</Text>
          <Text style={currentStyles.errorStateTitle}>
            {' '}
            {t('study_screen.error_loading_subjects')}{' '}
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
          <Text style={currentStyles.emptyStateIcon}>📚</Text>
          <Text style={currentStyles.emptyStateTitle}>
            {' '}
            {t('study_screen.no_subjects_available')}{' '}
          </Text>
          <Text style={currentStyles.emptyStateSubtitle}>
            {' '}
            {t('study_screen.no_subjects_for_grade')}{' '}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={currentStyles.content}
          contentContainerStyle={{
            padding: layout.screenPadding,
            paddingBottom: common.insets.bottom + 50,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSubjects} />}
        >
          {subjects.map((subject) => {
            const config = getSubjectConfig(subject.name, theme);
            return (
              <TouchableOpacity
                key={subject.id}
                style={[
                  currentStyles.subjectCard,
                  {
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
                onPress={() => handleSubjectSelect(subject)}
              >
                {/* Left Icon Box */}
                <View style={[currentStyles.iconBox, { backgroundColor: config.bg }]}>
                  <Ionicons name={config.icon as any} size={28} color={config.color} />
                </View>

                {/* Middle Info */}
                <View style={currentStyles.subjectInfo}>
                  <Text style={currentStyles.subjectName}> {subject.name} </Text>
                  <Text style={currentStyles.subjectChapters}>
                    {subject.chapters?.length || 0} {t('study_screen.chapters')}
                    {subject.description ? ` • ${subject.description}` : ''}
                  </Text>
                </View>

                {/* Right Action */}
                <View style={currentStyles.arrowContainer}>
                  <Ionicons
                    name={isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={20}
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
      marginTop: -24,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 16,
      ...typography('body'),
      color: theme.colors.textSecondary,
    },
    errorState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    errorStateIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    errorStateTitle: {
      ...typography('h3'),
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    errorStateSubtitle: {
      ...typography('caption'),
      textAlign: 'center',
      marginBottom: 20,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyStateIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyStateTitle: {
      ...typography('h3'),
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.text,
    },
    emptyStateSubtitle: {
      ...typography('caption'),
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
    // New Card Styles
    subjectCard: {
      flexDirection: common.rowDirection,
      alignItems: 'center',
      padding: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: 16,
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
      ...typography('label'),
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
      textAlign: common.textAlign,
    },
    subjectChapters: {
      ...typography('caption'),
      fontSize: 13,
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
