import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  xp: number;
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
            xp
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
            xp: student.xp || 0,
            rank: student.rank,
            isFollowing: Boolean(isFollowing),
          };
        });
        
        if (tabId === 'all') {
          setAllLeaderboard(processedLeaderboard);
        } else {
          setSubjectLeaderboards((prev: { [key: string]: Student[] }) => ({
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

        setAllLeaderboard((prev: Student[]) => updateStudentInList(prev));
        
        setSubjectLeaderboards((prev: { [key: string]: Student[] }) => {
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

  const renderAvatar = (name: string, size = 50) => {
    return (
      <View style={[currentStyles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[currentStyles.avatarText, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
      </View>
    );
  };

  const currentStyles = styles(theme, isRTL);

  if (loading) {
    return (
      <View style={currentStyles.container}>
      <View style={currentStyles.header}>
        <View style={currentStyles.headerLeft}>
          <Text style={currentStyles.headerTitle}>{t('leaderboard_screen.header_title')}</Text>
          <Text style={currentStyles.headerSubtitle}>{t('leaderboard_screen.header_subtitle')}</Text>
        </View>
      </View>
        <View style={currentStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('leaderboard_screen.loading_leaderboard')}</Text>
        </View>
      </View>
    );
  }

  const renderLeaderboardContent = () => {
    if (leaderboardLoading) {
      return (
        <View style={currentStyles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('leaderboard_screen.loading_leaderboard')}</Text>
        </View>
      );
    }

    if (leaderboardError) {
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={currentStyles.emptyStateTitle}>{t('leaderboard_screen.error_loading_leaderboard')}</Text>
          <Text style={currentStyles.emptyStateSubtitle}>{leaderboardError}</Text>
          <TouchableOpacity
            style={currentStyles.retryButton}
            onPress={() => fetchLeaderboard(selectedTab)}
          >
            <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const leaderboard = getCurrentLeaderboard();
    if (leaderboard.length === 0) {
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color={theme.colors.primary} style={{ opacity: 0.2, marginBottom: 16 }} />
          <Text style={currentStyles.emptyStateTitle}>{t('leaderboard_screen.no_rankings_yet')}</Text>
          <Text style={currentStyles.emptyStateSubtitle}>
            {t('leaderboard_screen.be_first_hint')}
          </Text>
        </View>
      );
    }

    return leaderboard.map((student) => (
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
              <Text style={currentStyles.studentStatXP}>
                {student.xp} XP
              </Text>
              <Text style={currentStyles.studentStatSeparator}>•</Text>
              <Text style={currentStyles.studentStat}>
                {student.totalQuizzes} {t('common.quizzes')}
              </Text>
            </View>
          </View>
        </View>
        {student.id !== user?.id && (
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
        )}
      </View>
    ));
  };

  return (
    <View style={currentStyles.container}>
      {/* Fixed Theme Header */}
      <View style={currentStyles.header}>
        <View style={currentStyles.headerLeft}>
          <Text style={currentStyles.headerTitle}>{t('leaderboard_screen.header_title')}</Text>
          <Text style={currentStyles.headerSubtitle}>{t('leaderboard_screen.header_subtitle')}</Text>
        </View>
        <TouchableOpacity style={currentStyles.notificationButton} onPress={() => fetchLeaderboard(selectedTab)}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
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
          {renderLeaderboardContent()}
        </View>
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    backgroundColor: theme.colors.primary,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerLeft: {
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarContainer: {
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
  },
  tabBarContent: {
    paddingHorizontal: 20,
    flexDirection: isRTL ? 'row-reverse' : 'row',
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: isRTL ? 0 : 10,
    marginLeft: isRTL ? 10 : 0,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextInactive: {
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  leaderboardContainer: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 20,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  studentCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 24,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  studentLeft: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadgeContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
  },
  rankBadge: {
    backgroundColor: '#F3F4F6',
  },
  rankBadgeGold: {
    backgroundColor: '#FEF3C7',
  },
  rankBadgeSilver: {
    backgroundColor: '#F3F4F6',
  },
  rankBadgeBronze: {
    backgroundColor: '#FFEDD5',
  },
  rankBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(147, 51, 234, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.1)',
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
  },
  avatarText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  studentGrade: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  studentStats: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  studentStat: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  studentStatXP: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  studentStatSeparator: {
    fontSize: 12,
    marginHorizontal: 6,
    color: theme.colors.textTertiary,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },
  followButtonFollowing: {
    backgroundColor: '#F3F4F6',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  followButtonTextFollowing: {
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  loadingState: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 60,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default LeaderboardScreen;
