import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
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
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.gradeText}>
            Grade: {user?.grade?.name || 'Not specified'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {loading ? '...' : (activitiesData?.total_quizzes ?? 0)}
          </Text>
          <Text style={styles.statLabel}>Quizzes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {loading ? '...' : (activitiesData?.avg_score ? `${activitiesData.avg_score}%` : '0%')}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>⚠️</Text>
            <Text style={styles.emptyStateTitle}>Error Loading Activities</Text>
            <Text style={styles.emptyStateSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchActivities}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : !activitiesData?.activities || activitiesData.activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>📚</Text>
            <Text style={styles.emptyStateTitle}>No activity yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Take your first quiz to see your activity here
            </Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {activitiesData.activities.map((activity) => {
              const percentage = activity.totalQuestions > 0 
                ? (activity.score / activity.totalQuestions) * 100 
                : 0;
              const getScoreColor = () => {
                if (percentage >= 70) return '#4CAF50';
                if (percentage >= 50) return '#FF9800';
                return '#F44336';
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
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <Text style={styles.activitySubject}>{activity.subject.name}</Text>
                  </View>
                  
                  <View style={styles.activityDetails}>
                    <View style={styles.activityScoreContainer}>
                      <Text 
                        style={[
                          styles.activityScoreText,
                          { color: getScoreColor() }
                        ]}
                      >
                        {activity.score}/{activity.totalQuestions}
                      </Text>
                      <Text style={styles.activityScoreLabel}>Score</Text>
                    </View>
                    
                    <View style={styles.activityStatusContainer}>
                      <View 
                        style={[
                          styles.activityStatusBadge,
                          { backgroundColor: activity.isPassed ? '#E8F5E8' : '#FFEBEE' }
                        ]}
                      >
                        <Text 
                          style={[
                            styles.activityStatusText,
                            { color: activity.isPassed ? '#4CAF50' : '#F44336' }
                          ]}
                        >
                          {activity.isPassed ? 'Passed' : 'Failed'}
                        </Text>
                      </View>
                      <Text style={styles.activityDateText}>{formatDate(activity.completedAt)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📖</Text>
            <Text style={styles.actionTitle}>Browse Booklets</Text>
            <Text style={styles.actionSubtitle}>Explore available content</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>My Progress</Text>
            <Text style={styles.actionSubtitle}>Track your learning</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>⭐</Text>
            <Text style={styles.actionTitle}>Favorites</Text>
            <Text style={styles.actionSubtitle}>Your saved content</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionTitle}>Settings</Text>
            <Text style={styles.actionSubtitle}>Manage your account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  gradeText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
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
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
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
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  loadingState: {
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666666',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  activitiesList: {
    gap: 15,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
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
    color: '#333333',
    marginBottom: 4,
  },
  activitySubject: {
    fontSize: 14,
    color: '#666666',
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
    color: '#666666',
    marginTop: 2,
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
  activityStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityDateText: {
    fontSize: 12,
    color: '#666666',
  },
});

export default HomeScreen;
