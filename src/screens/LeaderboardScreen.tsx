import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../config/api';

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
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
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
        setLeaderboardError(t('common.error'));
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
        const processedLeaderboard = result.data.leaderboard.map((student: any) => {
          let isFollowing = false;
          
          if (student.isFollowing === true || 
              student.isFollowing === 1 || 
              student.isFollowing === '1' || 
              student.isFollowing === 'true' ||
              student.isFollowing === 'True' ||
              student.isFollowing === 'TRUE') {
            isFollowing = true;
          }
          
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
            isFollowing: Boolean(isFollowing),
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
        setLeaderboardError(result.errors?.[0]?.message || t('leaderboard_screen.error_loading_leaderboard'));
      }
    } catch (err: any) {
      console.error('Fetch leaderboard error:', err);
      setLeaderboardError(err.message || t('leaderboard_screen.error_loading_leaderboard'));
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
        Alert.alert(t('common.error'), t('common.error'));
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
        
        const updateStudentInList = (list: Student[]) =>
          list.map((s) =>
            s.id === student.id
              ? { ...s, isFollowing: newIsFollowing }
              : s
          );

        setAllLeaderboard((prev) => updateStudentInList(prev));
        
        setSubjectLeaderboards((prev) => {
          const updated: { [key: string]: Student[] } = {};
          Object.keys(prev).forEach((subjectId) => {
            updated[subjectId] = updateStudentInList(prev[subjectId] || []);
          });
          return updated;
        });
      } else {
        Alert.alert(t('common.error'), result.errors?.[0]?.message || t('common.unexpected_error'));
      }
    } catch (err: any) {
      console.error('Follow toggle error:', err);
      Alert.alert(t('common.error'), err.message || t('common.unexpected_error'));
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
    if (rank === 1) return currentStyles.rankBadgeGold;
    if (rank === 2) return currentStyles.rankBadgeSilver;
    if (rank === 3) return currentStyles.rankBadgeBronze;
    return currentStyles.rankBadge;
  };

  const getCurrentLeaderboard = (): Student[] => {
    if (selectedTab === 'all') {
      return allLeaderboard;
    }
    return subjectLeaderboards[selectedTab] || [];
  };

  const getCurrentTabName = (): string => {
    if (selectedTab === 'all') {
      return t('common.all_subjects');
    }
    const subject = subjects.find((s) => s.id === selectedTab);
    return subject?.name || t('common.leaderboard');
  };

  const renderAvatar = (name: string) => {
    return (
      <View style={currentStyles.avatarPlaceholder}>
        <Text style={currentStyles.avatarText}>{getInitials(name)}</Text>
      </View>
    );
  };

  const currentStyles = styles(theme, isRTL);

  if (loading) {
    return (
      <View style={currentStyles.container}>
        <View style={currentStyles.header}>
          <Text style={currentStyles.headerTitle}>{t('leaderboard_screen.header_title')}</Text>
          <Text style={currentStyles.headerSubtitle}>{t('leaderboard_screen.header_subtitle')}</Text>
        </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('leaderboard_screen.loading_leaderboard')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={currentStyles.container}>
      {/* Header */}
      <View style={currentStyles.header}>
        <Text style={currentStyles.headerTitle}>{t('leaderboard_screen.header_title')}</Text>
        <Text style={currentStyles.headerSubtitle}>{t('leaderboard_screen.header_subtitle')}</Text>
      </View>

      {/* Tab Bar */}
      <View style={currentStyles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={currentStyles.tabBarContent}
        >
          <TouchableOpacity
            style={[
              currentStyles.tab,
              selectedTab === 'all' && currentStyles.tabActive
            ]}
            onPress={() => handleTabChange('all')}
          >
            <Text style={[
              currentStyles.tabText,
              selectedTab === 'all' ? currentStyles.tabTextActive : currentStyles.tabTextInactive
            ]}>
              {t('common.all')}
            </Text>
          </TouchableOpacity>
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={[
                currentStyles.tab,
                selectedTab === subject.id && currentStyles.tabActive
              ]}
              onPress={() => handleTabChange(subject.id)}
            >
              <Text style={[
                currentStyles.tabText,
                selectedTab === subject.id ? currentStyles.tabTextActive : currentStyles.tabTextInactive
              ]}>
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Leaderboard Content */}
      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        <View style={currentStyles.leaderboardContainer}>
          <Text style={currentStyles.sectionTitle}>{getCurrentTabName()}</Text>
          {leaderboardLoading ? (
            <View style={currentStyles.loadingState}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={currentStyles.loadingText}>{t('leaderboard_screen.loading_leaderboard')}</Text>
            </View>
          ) : leaderboardError ? (
            <View style={currentStyles.emptyState}>
              <Text style={currentStyles.emptyStateIcon}>⚠️</Text>
              <Text style={currentStyles.emptyStateTitle}>{t('leaderboard_screen.error_loading_leaderboard')}</Text>
              <Text style={currentStyles.emptyStateSubtitle}>{leaderboardError}</Text>
              <TouchableOpacity
                style={currentStyles.retryButton}
                onPress={() => fetchLeaderboard(selectedTab)}
              >
                <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
              </TouchableOpacity>
            </View>
          ) : getCurrentLeaderboard().length === 0 ? (
            <View style={currentStyles.emptyState}>
              <Text style={currentStyles.emptyStateIcon}>🏆</Text>
              <Text style={currentStyles.emptyStateTitle}>{t('leaderboard_screen.no_rankings_yet')}</Text>
              <Text style={currentStyles.emptyStateSubtitle}>
                {t('leaderboard_screen.be_first_hint')}
              </Text>
            </View>
          ) : (
            getCurrentLeaderboard().map((student) => (
              <View key={student.id} style={currentStyles.studentCard}>
                <View style={currentStyles.studentLeft}>
                  <View style={[currentStyles.rankBadgeContainer, getRankBadgeStyle(student.rank)]}>
                    <Text style={currentStyles.rankBadgeText}>{getRankBadge(student.rank)}</Text>
                  </View>
                  {renderAvatar(student.name)}
                  <View style={currentStyles.studentDetails}>
                    <Text style={currentStyles.studentName}>{student.name}</Text>
                    <Text style={currentStyles.studentGrade}>{student.grade.name}</Text>
                    <View style={currentStyles.studentStats}>
                      <Text style={currentStyles.studentStat}>
                        {student.totalQuizzes} {t('common.quizzes')}
                      </Text>
                      <Text style={currentStyles.studentStatSeparator}>•</Text>
                      <Text style={currentStyles.studentStat}>
                        {student.avgScore.toFixed(1)}% {t('common.avg')}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    currentStyles.followButton,
                    student.isFollowing && currentStyles.followButtonFollowing
                  ]}
                  onPress={() => handleFollowToggle(student)}
                >
                  <Text
                    style={[
                      currentStyles.followButtonText,
                      student.isFollowing && currentStyles.followButtonTextFollowing
                    ]}
                  >
                    {student.isFollowing ? t('common.following') : t('common.follow')}
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

const styles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: theme.colors.headerBackground,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
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
    flexDirection: isRTL ? 'row-reverse' : 'row',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: isRTL ? 0 : 8,
    marginLeft: isRTL ? 8 : 0,
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
    textAlign: isRTL ? 'right' : 'left',
  },
  studentCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: isRTL ? 'row-reverse' : 'row',
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
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadgeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
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
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
  },
  avatarText: {
    color: theme.colors.avatarText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
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
    flexDirection: isRTL ? 'row-reverse' : 'row',
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
