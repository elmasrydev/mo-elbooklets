import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { theme } = useTheme();
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
        // Ensure isFollowing is properly set as a boolean (handle null, undefined, string, etc.)
        const processedLeaderboard = result.data.leaderboard.map((student: any) => {
          // Convert isFollowing to proper boolean
          // Handle all possible truthy/falsy values
          let isFollowing = false;
          
          // Check for truthy values
          if (student.isFollowing === true || 
              student.isFollowing === 1 || 
              student.isFollowing === '1' || 
              student.isFollowing === 'true' ||
              student.isFollowing === 'True' ||
              student.isFollowing === 'TRUE') {
            isFollowing = true;
          }
          
          // Explicitly set false for falsy values (null, undefined, false, 0, '0', 'false', etc.)
          if (student.isFollowing === false || 
              student.isFollowing === 0 || 
              student.isFollowing === '0' || 
              student.isFollowing === 'false' ||
              student.isFollowing === 'False' ||
              student.isFollowing === 'FALSE' ||
              student.isFollowing === null ||
              student.isFollowing === undefined) {
            isFollowing = false;
          }
          
          return {
            id: student.id,
            name: student.name,
            grade: student.grade,
            totalQuizzes: student.totalQuizzes,
            avgScore: student.avgScore,
            rank: student.rank,
            isFollowing: Boolean(isFollowing), // Force boolean conversion
          };
        });
        
        if (tabId === 'all') {
          setAllLeaderboard(processedLeaderboard);
        } else {
          setSubjectLeaderboards((prev) => ({
            ...prev,
            [tabId]: processedLeaderboard,
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
        const newIsFollowing = result.data.followUser.isFollowing;
        
        // Update local state for all leaderboards using functional updates
        const updateStudentInList = (list: Student[]) =>
          list.map((s) =>
            s.id === student.id
              ? { ...s, isFollowing: newIsFollowing }
              : s
          );

        // Use functional update to ensure we have the latest state
        setAllLeaderboard((prev) => updateStudentInList(prev));
        
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
    if (rank === 1) return styles(theme).rankBadgeGold;
    if (rank === 2) return styles(theme).rankBadgeSilver;
    if (rank === 3) return styles(theme).rankBadgeBronze;
    return styles(theme).rankBadge;
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
      <View style={styles(theme).avatarPlaceholder}>
        <Text style={styles(theme).avatarText}>{getInitials(name)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles(theme).container}>
        <View style={styles(theme).header}>
          <Text style={styles(theme).headerTitle}>Leaderboard</Text>
          <Text style={styles(theme).headerSubtitle}>See how you rank among peers</Text>
        </View>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles(theme).loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <Text style={styles(theme).headerTitle}>Leaderboard</Text>
        <Text style={styles(theme).headerSubtitle}>See how you rank among peers</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles(theme).tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles(theme).tabBarContent}
        >
          <TouchableOpacity
            style={[
              styles(theme).tab,
              selectedTab === 'all' && styles(theme).tabActive
            ]}
            onPress={() => handleTabChange('all')}
          >
            <Text style={[
              styles(theme).tabText,
              selectedTab === 'all' ? styles(theme).tabTextActive : styles(theme).tabTextInactive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles(theme).tab,
                selectedTab === subject.id && styles(theme).tabActive
              ]}
              onPress={() => handleTabChange(subject.id)}
            >
              <Text style={[
                styles(theme).tabText,
                selectedTab === subject.id ? styles(theme).tabTextActive : styles(theme).tabTextInactive
              ]}>
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Leaderboard Content */}
      <ScrollView style={styles(theme).content} showsVerticalScrollIndicator={false}>
        <View style={styles(theme).leaderboardContainer}>
          <Text style={styles(theme).sectionTitle}>{getCurrentTabName()}</Text>
          {leaderboardLoading ? (
            <View style={styles(theme).loadingState}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles(theme).loadingText}>Loading leaderboard...</Text>
            </View>
          ) : leaderboardError ? (
            <View style={styles(theme).emptyState}>
              <Text style={styles(theme).emptyStateIcon}>⚠️</Text>
              <Text style={styles(theme).emptyStateTitle}>Error Loading Leaderboard</Text>
              <Text style={styles(theme).emptyStateSubtitle}>{leaderboardError}</Text>
              <TouchableOpacity
                style={styles(theme).retryButton}
                onPress={() => fetchLeaderboard(selectedTab)}
              >
                <Text style={styles(theme).retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : getCurrentLeaderboard().length === 0 ? (
            <View style={styles(theme).emptyState}>
              <Text style={styles(theme).emptyStateIcon}>🏆</Text>
              <Text style={styles(theme).emptyStateTitle}>No rankings yet</Text>
              <Text style={styles(theme).emptyStateSubtitle}>
                Be the first to complete quizzes and appear on the leaderboard!
              </Text>
            </View>
          ) : (
            getCurrentLeaderboard().map((student) => (
              <View key={student.id} style={styles(theme).studentCard}>
                <View style={styles(theme).studentLeft}>
                  <View style={[styles(theme).rankBadgeContainer, getRankBadgeStyle(student.rank)]}>
                    <Text style={styles(theme).rankBadgeText}>{getRankBadge(student.rank)}</Text>
                  </View>
                  {renderAvatar(student.name)}
                  <View style={styles(theme).studentDetails}>
                    <Text style={styles(theme).studentName}>{student.name}</Text>
                    <Text style={styles(theme).studentGrade}>{student.grade.name}</Text>
                    <View style={styles(theme).studentStats}>
                      <Text style={styles(theme).studentStat}>
                        {student.totalQuizzes} quizzes
                      </Text>
                      <Text style={styles(theme).studentStatSeparator}>•</Text>
                      <Text style={styles(theme).studentStat}>
                        {student.avgScore.toFixed(1)}% avg
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles(theme).followButton,
                    student.isFollowing && styles(theme).followButtonFollowing
                  ]}
                  onPress={() => handleFollowToggle(student)}
                >
                  <Text
                    style={[
                      styles(theme).followButtonText,
                      student.isFollowing && styles(theme).followButtonTextFollowing
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

const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
    marginTop: 4,
    color: theme.colors.headerSubtitle,
  },
  tabBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    maxHeight: 50,
    backgroundColor: theme.colors.surface,
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
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: theme.colors.tabActive,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.tabActiveText,
  },
  tabTextInactive: {
    color: theme.colors.tabInactiveText,
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
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    color: theme.colors.text,
  },
  studentCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
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
    backgroundColor: theme.colors.border,
  },
  rankBadgeGold: {
    backgroundColor: theme.colors.gold,
  },
  rankBadgeSilver: {
    backgroundColor: theme.colors.silver,
  },
  rankBadgeBronze: {
    backgroundColor: theme.colors.bronze,
  },
  rankBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.rankBadgeText,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.avatarBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: theme.colors.avatarText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: theme.colors.text,
  },
  studentGrade: {
    fontSize: 14,
    marginBottom: 4,
    color: theme.colors.textSecondary,
  },
  studentStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentStat: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  studentStatSeparator: {
    fontSize: 14,
    marginHorizontal: 8,
    color: theme.colors.textTertiary,
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.buttonPrimary,
  },
  followButtonFollowing: {
    backgroundColor: theme.colors.buttonSecondary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.buttonPrimaryText,
  },
  followButtonTextFollowing: {
    color: theme.colors.buttonSecondaryText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  loadingState: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    backgroundColor: theme.colors.card,
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
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
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.buttonPrimary,
  },
  retryButtonText: {
    color: theme.colors.buttonPrimaryText,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LeaderboardScreen;
