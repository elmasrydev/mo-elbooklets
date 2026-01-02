import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../config/api';

interface QuizActivity {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
  score: number;
  totalQuestions: number;
  completedAt: string;
  isPassed: boolean;
}

interface ActivitiesData {
  total_quizzes: number;
  avg_score: number;
  activities: QuizActivity[];
}

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();
  const [activitiesData, setActivitiesData] = useState<ActivitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setError(t('home_screen.error_loading'));
        return;
      }

      const result = await tryFetchWithFallback(`
        query Activities {
          activities {
            total_quizzes
            avg_score
            activities {
              id
              name
              subject {
                id
                name
              }
              score
              totalQuestions
              completedAt
              isPassed
            }
          }
        }
      `, undefined, token);

      if (result.data?.activities) {
        setActivitiesData(result.data.activities);
      } else {
        setError(result.errors?.[0]?.message || t('home_screen.error_loading'));
      }
    } catch (err: any) {
      console.error('Fetch activities error:', err);
      setError(err.message || t('home_screen.error_loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  );

  const currentStyles = styles(theme, isRTL);

  return (
    <ScrollView style={currentStyles.container}>
      {/* Header */}
      <View style={currentStyles.header}>
        <View style={currentStyles.welcomeSection}>
          <Text style={currentStyles.welcomeText}>{t('home_screen.welcome_back')}</Text>
          <Text style={currentStyles.userName}>{user?.name}</Text>
          <Text style={currentStyles.gradeText}>
            {t('more_screen.grade')}: {user?.grade?.name || t('more_screen.not_specified')}
          </Text>
        </View>
        <TouchableOpacity style={currentStyles.logoutButton} onPress={handleLogout}>
          <Text style={currentStyles.logoutButtonText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={currentStyles.statsContainer}>
        <View style={currentStyles.statCard}>
          <Text style={currentStyles.statNumber}>
            {loading ? '...' : (activitiesData?.total_quizzes ?? 0)}
          </Text>
          <Text style={currentStyles.statLabel}>{t('home_screen.quizzes')}</Text>
        </View>
        <View style={currentStyles.statCard}>
          <Text style={currentStyles.statNumber}>
            {loading ? '...' : (activitiesData?.avg_score ? `${activitiesData.avg_score}%` : '0%')}
          </Text>
          <Text style={currentStyles.statLabel}>{t('home_screen.completed')}</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={currentStyles.section}>
        <Text style={currentStyles.sectionTitle}>{t('home_screen.recent_activity')}</Text>
        {loading ? (
          <View style={currentStyles.loadingState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={currentStyles.loadingText}>{t('home_screen.loading_activities')}</Text>
          </View>
        ) : error ? (
          <View style={currentStyles.emptyState}>
            <Text style={currentStyles.emptyStateText}>⚠️</Text>
            <Text style={currentStyles.emptyStateTitle}>{t('home_screen.error_loading')}</Text>
            <Text style={currentStyles.emptyStateSubtitle}>{error}</Text>
            <TouchableOpacity style={currentStyles.retryButton} onPress={fetchActivities}>
              <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
            </TouchableOpacity>
          </View>
        ) : !activitiesData?.activities || activitiesData.activities.length === 0 ? (
          <View style={currentStyles.emptyState}>
            <Text style={currentStyles.emptyStateText}>📚</Text>
            <Text style={currentStyles.emptyStateTitle}>{t('home_screen.no_activity')}</Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('home_screen.take_quiz_hint')}
            </Text>
          </View>
        ) : (
          <View style={currentStyles.activitiesList}>
            {activitiesData.activities.map((activity: QuizActivity) => {
              const total = activity.totalQuestions;
              const score = activity.score;
              const percentage = total > 0 ? (score / total) * 100 : 0;
              
              const getScoreColor = () => {
                if (percentage >= 70) return theme.colors.success;
                if (percentage >= 50) return theme.colors.warning;
                return theme.colors.error;
              };
              const formatDate = (dateString: string) => {
                const date = new Date(dateString);
                return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              };

              return (
                <View key={activity.id} style={currentStyles.activityCard}>
                  <View style={currentStyles.activityHeader}>
                    <Text style={currentStyles.activityName}>{activity.name}</Text>
                    <Text style={currentStyles.activitySubject}>{activity.subject.name}</Text>
                  </View>
                  
                  <View style={currentStyles.activityDetails}>
                    <View style={currentStyles.activityScoreContainer}>
                      <Text 
                        style={[
                          currentStyles.activityScoreText,
                          { color: getScoreColor() }
                        ]}
                      >
                        {activity.score}/{activity.totalQuestions}
                      </Text>
                      <Text style={currentStyles.activityScoreLabel}>{t('home_screen.score')}</Text>
                    </View>
                    
                    <View style={currentStyles.activityStatusContainer}>
                      <View 
                        style={[
                          currentStyles.activityStatusBadge,
                          activity.isPassed 
                            ? currentStyles.activityStatusBadgePassed 
                            : currentStyles.activityStatusBadgeFailed
                        ]}
                      >
                        <Text 
                          style={[
                            currentStyles.activityStatusText,
                            activity.isPassed 
                              ? currentStyles.activityStatusTextPassed 
                              : currentStyles.activityStatusTextFailed
                          ]}
                        >
                          {activity.isPassed ? t('home_screen.passed') : t('home_screen.failed')}
                        </Text>
                      </View>
                      <Text style={currentStyles.activityDateText}>{formatDate(activity.completedAt)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={currentStyles.section}>
        <Text style={currentStyles.sectionTitle}>{t('home_screen.quick_actions')}</Text>
        <View style={currentStyles.actionsGrid}>
          <TouchableOpacity style={currentStyles.actionCard}>
            <Text style={currentStyles.actionIcon}>📖</Text>
            <Text style={currentStyles.actionTitle}>{t('home_screen.browse_booklets')}</Text>
            <Text style={currentStyles.actionSubtitle}>{t('home_screen.explore_content')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={currentStyles.actionCard}>
            <Text style={currentStyles.actionIcon}>📊</Text>
            <Text style={currentStyles.actionTitle}>{t('home_screen.my_progress')}</Text>
            <Text style={currentStyles.actionSubtitle}>{t('home_screen.track_learning')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={currentStyles.actionCard}>
            <Text style={currentStyles.actionIcon}>⭐</Text>
            <Text style={currentStyles.actionTitle}>{t('home_screen.favorites')}</Text>
            <Text style={currentStyles.actionSubtitle}>{t('home_screen.saved_content')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={currentStyles.actionCard}>
            <Text style={currentStyles.actionIcon}>⚙️</Text>
            <Text style={currentStyles.actionTitle}>{t('common.settings')}</Text>
            <Text style={currentStyles.actionSubtitle}>{t('home_screen.manage_account')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.headerBackground,
  },
  welcomeSection: {
    flex: 1,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.9,
    color: theme.colors.headerText,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    color: theme.colors.headerText,
  },
  gradeText: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
    color: theme.colors.headerSubtitle,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.logoutButtonBackground,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statsContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: 20,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.colors.text,
    width: '100%',
    textAlign: isRTL ? 'right' : 'left',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  emptyStateText: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  actionsGrid: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    width: '47%',
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    color: theme.colors.text,
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  loadingState: {
    backgroundColor: theme.colors.card,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: theme.colors.buttonPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  activitiesList: {
    gap: 15,
    width: '100%',
  },
  activityCard: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    marginBottom: 12,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  activitySubject: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activityDetails: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityScoreContainer: {
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  activityScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  activityScoreLabel: {
    fontSize: 12,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
  activityStatusContainer: {
    alignItems: isRTL ? 'flex-start' : 'flex-end',
  },
  activityStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 6,
  },
  activityStatusBadgePassed: {
    backgroundColor: theme.colors.passBackground,
  },
  activityStatusBadgeFailed: {
    backgroundColor: theme.colors.failBackground,
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityStatusTextPassed: {
    color: theme.colors.passText,
  },
  activityStatusTextFailed: {
    color: theme.colors.failText,
  },
  activityDateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default HomeScreen;
