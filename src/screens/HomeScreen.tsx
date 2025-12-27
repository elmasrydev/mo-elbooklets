import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
        setError('Authentication required');
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
        setError(result.errors?.[0]?.message || 'Failed to load activities');
      }
    } catch (err: any) {
      console.error('Fetch activities error:', err);
      setError(err.message || 'An error occurred while loading activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
    }, [fetchActivities])
  );

  return (
    <ScrollView style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <View style={styles(theme).welcomeSection}>
          <Text style={styles(theme).welcomeText}>Welcome back,</Text>
          <Text style={styles(theme).userName}>{user?.name}</Text>
          <Text style={styles(theme).gradeText}>
            Grade: {user?.grade?.name || 'Not specified'}
          </Text>
        </View>
        <TouchableOpacity style={styles(theme).logoutButton} onPress={handleLogout}>
          <Text style={styles(theme).logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles(theme).statsContainer}>
        <View style={styles(theme).statCard}>
          <Text style={styles(theme).statNumber}>
            {loading ? '...' : (activitiesData?.total_quizzes ?? 0)}
          </Text>
          <Text style={styles(theme).statLabel}>Quizzes</Text>
        </View>
        <View style={styles(theme).statCard}>
          <Text style={styles(theme).statNumber}>
            {loading ? '...' : (activitiesData?.avg_score ? `${activitiesData.avg_score}%` : '0%')}
          </Text>
          <Text style={styles(theme).statLabel}>Completed</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles(theme).section}>
        <Text style={styles(theme).sectionTitle}>Recent Activity</Text>
        {loading ? (
          <View style={styles(theme).loadingState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles(theme).loadingText}>Loading activities...</Text>
          </View>
        ) : error ? (
          <View style={styles(theme).emptyState}>
            <Text style={styles(theme).emptyStateText}>⚠️</Text>
            <Text style={styles(theme).emptyStateTitle}>Error Loading Activities</Text>
            <Text style={styles(theme).emptyStateSubtitle}>{error}</Text>
            <TouchableOpacity style={styles(theme).retryButton} onPress={fetchActivities}>
              <Text style={styles(theme).retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : !activitiesData?.activities || activitiesData.activities.length === 0 ? (
          <View style={styles(theme).emptyState}>
            <Text style={styles(theme).emptyStateText}>📚</Text>
            <Text style={styles(theme).emptyStateTitle}>No activity yet</Text>
            <Text style={styles(theme).emptyStateSubtitle}>
              Take your first quiz to see your activity here
            </Text>
          </View>
        ) : (
          <View style={styles(theme).activitiesList}>
            {activitiesData.activities.map((activity) => {
              const percentage = activity.totalQuestions > 0 
                ? (activity.score / activity.totalQuestions) * 100 
                : 0;
              const getScoreColor = () => {
                if (percentage >= 70) return theme.colors.success;
                if (percentage >= 50) return theme.colors.warning;
                return theme.colors.error;
              };
              const formatDate = (dateString: string) => {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              };

              return (
                <View key={activity.id} style={styles(theme).activityCard}>
                  <View style={styles(theme).activityHeader}>
                    <Text style={styles(theme).activityName}>{activity.name}</Text>
                    <Text style={styles(theme).activitySubject}>{activity.subject.name}</Text>
                  </View>
                  
                  <View style={styles(theme).activityDetails}>
                    <View style={styles(theme).activityScoreContainer}>
                      <Text 
                        style={[
                          styles(theme).activityScoreText,
                          { color: getScoreColor() }
                        ]}
                      >
                        {activity.score}/{activity.totalQuestions}
                      </Text>
                      <Text style={styles(theme).activityScoreLabel}>Score</Text>
                    </View>
                    
                    <View style={styles(theme).activityStatusContainer}>
                      <View 
                        style={[
                          styles(theme).activityStatusBadge,
                          activity.isPassed ? styles(theme).activityStatusBadgePassed : styles(theme).activityStatusBadgeFailed
                        ]}
                      >
                        <Text 
                          style={[
                            styles(theme).activityStatusText,
                            activity.isPassed ? styles(theme).activityStatusTextPassed : styles(theme).activityStatusTextFailed
                          ]}
                        >
                          {activity.isPassed ? 'Passed' : 'Failed'}
                        </Text>
                      </View>
                      <Text style={styles(theme).activityDateText}>{formatDate(activity.completedAt)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles(theme).section}>
        <Text style={styles(theme).sectionTitle}>Quick Actions</Text>
        <View style={styles(theme).actionsGrid}>
          <TouchableOpacity style={styles(theme).actionCard}>
            <Text style={styles(theme).actionIcon}>📖</Text>
            <Text style={styles(theme).actionTitle}>Browse Booklets</Text>
            <Text style={styles(theme).actionSubtitle}>Explore available content</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles(theme).actionCard}>
            <Text style={styles(theme).actionIcon}>📊</Text>
            <Text style={styles(theme).actionTitle}>My Progress</Text>
            <Text style={styles(theme).actionSubtitle}>Track your learning</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles(theme).actionCard}>
            <Text style={styles(theme).actionIcon}>⭐</Text>
            <Text style={styles(theme).actionTitle}>Favorites</Text>
            <Text style={styles(theme).actionSubtitle}>Your saved content</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles(theme).actionCard}>
            <Text style={styles(theme).actionIcon}>⚙️</Text>
            <Text style={styles(theme).actionTitle}>Settings</Text>
            <Text style={styles(theme).actionSubtitle}>Manage your account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.headerBackground,
  },
  welcomeSection: {
    flex: 1,
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
    flexDirection: 'row',
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.colors.text,
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityScoreContainer: {
    alignItems: 'flex-start',
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
    alignItems: 'flex-end',
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
