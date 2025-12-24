import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { tryFetchWithFallback } from '../config/api';

// Types
interface Subject {
  id: string;
  name: string;
  description?: string;
}

interface Student {
  id: string;
  name: string;
  grade: {
    id: string;
    name: string;
  };
  totalQuizzes: number;
  avgScore: number;
  isFollowing: boolean;
  rank: number;
}

const LeaderboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const [allLeaderboard, setAllLeaderboard] = useState<Student[]>([]);
  const [subjectLeaderboards, setSubjectLeaderboards] = useState<{ [key: string]: Student[] }>({});

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (subjects.length > 0) {
      fetchLeaderboard('all');
    }
  }, [subjects]);

  useEffect(() => {
    if (selectedTab && subjects.length > 0) {
      fetchLeaderboard(selectedTab);
    }
  }, [selectedTab]);

  useFocusEffect(
    useCallback(() => {
      if (selectedTab && subjects.length > 0) {
        fetchLeaderboard(selectedTab);
      }
    }, [selectedTab, subjects.length])
  );

  const fetchSubjects = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const result = await tryFetchWithFallback(`
        query SubjectsForUserGrade {
          subjectsForUserGrade {
            id
            name
            description
          }
        }
      `, undefined, token);

      if (result.data?.subjectsForUserGrade) {
        setSubjects(result.data.subjectsForUserGrade);
      }
    } catch (err: any) {
      console.error('Fetch subjects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (tabId: string) => {
    try {
      setLeaderboardLoading(true);
      setLeaderboardError(null);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setLeaderboardError('Authentication required');
        return;
      }

      const subjectId = tabId === 'all' ? null : tabId;
      const variables = subjectId ? { subjectId, limit: 10 } : { limit: 10 };

      const result = await tryFetchWithFallback(`
        query Leaderboard($subjectId: ID, $limit: Int) {
          leaderboard(subjectId: $subjectId, limit: $limit) {
            id
            name
            grade {
              id
              name
            }
            totalQuizzes
            avgScore
            isFollowing
            rank
          }
        }
      `, variables, token);

      if (result.data?.leaderboard) {
        if (tabId === 'all') {
          setAllLeaderboard(result.data.leaderboard);
        } else {
          setSubjectLeaderboards((prev) => ({
            ...prev,
            [tabId]: result.data.leaderboard,
          }));
        }
      } else {
        setLeaderboardError(result.errors?.[0]?.message || 'Failed to load leaderboard');
      }
    } catch (err: any) {
      console.error('Fetch leaderboard error:', err);
      setLeaderboardError(err.message || 'An error occurred while loading leaderboard');
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
  };

  const handleFollowToggle = async (student: Student) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const result = await tryFetchWithFallback(`
        mutation FollowUser($userId: ID!) {
          followUser(userId: $userId) {
            success
            isFollowing
            message
          }
        }
      `, { userId: student.id }, token);

      if (result.data?.followUser?.success) {
        // Update local state for all leaderboards
        const updateStudentInList = (list: Student[]) =>
          list.map((s) =>
            s.id === student.id
              ? { ...s, isFollowing: result.data.followUser.isFollowing }
              : s
          );

        setAllLeaderboard(updateStudentInList(allLeaderboard));
        
        setSubjectLeaderboards((prev) => {
          const updated: { [key: string]: Student[] } = {};
          Object.keys(prev).forEach((subjectId) => {
            updated[subjectId] = updateStudentInList(prev[subjectId] || []);
          });
          return updated;
        });
      } else {
        Alert.alert('Error', result.errors?.[0]?.message || 'Failed to update follow status');
      }
    } catch (err: any) {
      console.error('Follow toggle error:', err);
      Alert.alert('Error', err.message || 'An error occurred');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return styles.rankBadgeGold;
    if (rank === 2) return styles.rankBadgeSilver;
    if (rank === 3) return styles.rankBadgeBronze;
    return styles.rankBadge;
  };

  const getCurrentLeaderboard = (): Student[] => {
    if (selectedTab === 'all') {
      return allLeaderboard;
    }
    return subjectLeaderboards[selectedTab] || [];
  };

  const getCurrentTabName = (): string => {
    if (selectedTab === 'all') {
      return 'All Subjects';
    }
    const subject = subjects.find((s) => s.id === selectedTab);
    return subject?.name || 'Leaderboard';
  };

  const renderAvatar = (name: string) => {
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{getInitials(name)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.headerSubtitle}>See how you rank among peers</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>See how you rank among peers</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => handleTabChange('all')}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[styles.tab, selectedTab === subject.id && styles.tabActive]}
              onPress={() => handleTabChange(subject.id)}
            >
              <Text style={[styles.tabText, selectedTab === subject.id && styles.tabTextActive]}>
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Leaderboard Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.leaderboardContainer}>
          <Text style={styles.sectionTitle}>{getCurrentTabName()}</Text>
          {leaderboardLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : leaderboardError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>⚠️</Text>
              <Text style={styles.emptyStateTitle}>Error Loading Leaderboard</Text>
              <Text style={styles.emptyStateSubtitle}>{leaderboardError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchLeaderboard(selectedTab)}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : getCurrentLeaderboard().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏆</Text>
              <Text style={styles.emptyStateTitle}>No rankings yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Be the first to complete quizzes and appear on the leaderboard!
              </Text>
            </View>
          ) : (
            getCurrentLeaderboard().map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentLeft}>
                  <View style={[styles.rankBadgeContainer, getRankBadgeStyle(student.rank)]}>
                    <Text style={styles.rankBadgeText}>{getRankBadge(student.rank)}</Text>
                  </View>
                  {renderAvatar(student.name)}
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentGrade}>{student.grade.name}</Text>
                    <View style={styles.studentStats}>
                      <Text style={styles.studentStat}>
                        {student.totalQuizzes} quizzes
                      </Text>
                      <Text style={styles.studentStatSeparator}>•</Text>
                      <Text style={styles.studentStat}>
                        {student.avgScore.toFixed(1)}% avg
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    student.isFollowing && styles.followingButton,
                  ]}
                  onPress={() => handleFollowToggle(student)}
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      student.isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {student.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  tabBarContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 50,
  },
  tabBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  leaderboardContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadgeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadge: {
    backgroundColor: '#f5f5f5',
  },
  rankBadgeGold: {
    backgroundColor: '#FFD700',
  },
  rankBadgeSilver: {
    backgroundColor: '#C0C0C0',
  },
  rankBadgeBronze: {
    backgroundColor: '#CD7F32',
  },
  rankBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  studentGrade: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  studentStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentStat: {
    fontSize: 14,
    color: '#666666',
  },
  studentStatSeparator: {
    fontSize: 14,
    color: '#999999',
    marginHorizontal: 8,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#e0e0e0',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#666666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  loadingState: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
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
});

export default LeaderboardScreen;
