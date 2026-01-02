import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { tryFetchWithFallback } from '../config/api';

interface Student {
  id: string;
  name: string;
  mobile: string;
  grade: {
    id: string;
    name: string;
  };
  totalQuizzes: number;
  avgScore: number;
  isFollowing: boolean;
}

interface TimelineActivity {
  id: string;
  user: {
    id: string;
    name: string;
    grade: {
      id: string;
      name: string;
    };
  };
  quiz: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
    };
  };
  score: number;
  totalQuestions: number;
  completedAt: string;
  isPassed: boolean;
  likes: number;
  comments: number;
  isLiked: boolean;
}

const SocialScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isRTL, language } = useLanguage();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [timelineActivities, setTimelineActivities] = useState<TimelineActivity[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    try {
      setTimelineLoading(true);
      setTimelineError(null);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        setTimelineError(t('common.error'));
        return;
      }

      const result = await tryFetchWithFallback(`
        query SocialTimeline {
          socialTimeline {
            id
            user {
              id
              name
              grade {
                id
                name
              }
            }
            quiz {
              id
              name
              subject {
                id
                name
              }
            }
            score
            totalQuestions
            completedAt
            isPassed
            likes
            comments
            isLiked
          }
        }
      `, undefined, token);

      if (result.data?.socialTimeline) {
        setTimelineActivities(result.data.socialTimeline);
      } else {
        setTimelineError(result.errors?.[0]?.message || t('social_screen.error_loading_timeline'));
      }
    } catch (err: any) {
      console.error('Fetch timeline error:', err);
      setTimelineError(err.message || t('social_screen.error_loading_timeline'));
    } finally {
      setTimelineLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  useFocusEffect(
    useCallback(() => {
      if (searchQuery.length === 0) {
        fetchTimeline();
      }
    }, [searchQuery, fetchTimeline])
  );

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setSearchLoading(true);

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const result = await tryFetchWithFallback(`
        query SearchStudents($query: String!) {
          searchStudents(query: $query) {
            id
            name
            mobile
            grade {
              id
              name
            }
            totalQuizzes
            avgScore
            isFollowing
          }
        }
      `, { query }, token);

      if (result.data?.searchStudents) {
        setSearchResults(result.data.searchStudents);
      }
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
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
        setSearchResults(prev =>
          prev.map(s =>
            s.id === student.id
              ? { ...s, isFollowing: result.data.followUser.isFollowing }
              : s
          )
        );
        
        if (searchQuery.length === 0) {
          fetchTimeline();
        }
      } else {
        Alert.alert(t('common.error'), result.errors?.[0]?.message || t('common.unexpected_error'));
      }
    } catch (err: any) {
      console.error('Follow toggle error:', err);
      Alert.alert(t('common.error'), err.message || t('common.unexpected_error'));
    }
  };

  const handleLike = async (activity: TimelineActivity) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert(t('common.error'), t('common.error'));
        return;
      }

      const result = await tryFetchWithFallback(`
        mutation LikeActivity($quizUserId: ID!) {
          likeActivity(quizUserId: $quizUserId) {
            success
            isLiked
            likeCount
            message
          }
        }
      `, { quizUserId: activity.id }, token);

      if (result.data?.likeActivity?.success) {
        setTimelineActivities(prev =>
          prev.map(a =>
            a.id === activity.id
              ? {
                  ...a,
                  isLiked: result.data.likeActivity.isLiked,
                  likes: result.data.likeActivity.likeCount,
                }
              : a
          )
        );
      } else {
        Alert.alert(t('common.error'), result.errors?.[0]?.message || t('common.unexpected_error'));
      }
    } catch (err: any) {
      console.error('Like error:', err);
      Alert.alert(t('common.error'), err.message || t('common.unexpected_error'));
    }
  };

  const handleComment = (activity: TimelineActivity) => {
    Alert.alert('Comment', t('social_screen.comment_coming_soon'));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t('time.just_now');
    if (diffInSeconds < 3600) return t('time.minutes_ago', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('time.hours_ago', { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 604800) return t('time.days_ago', { count: Math.floor(diffInSeconds / 86400) });
    
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 70) return '#4CAF50';
    if (percentage >= 50) return '#FF9800';
    return '#F44336';
  };

  const renderAvatar = (name: string) => {
    return (
      <View style={currentStyles.avatarPlaceholder}>
        <Text style={currentStyles.avatarText}>{getInitials(name)}</Text>
      </View>
    );
  };

  const isSearching = searchQuery.length >= 2;
  const currentStyles = styles(theme, isRTL);

  return (
    <View style={currentStyles.container}>
      {/* Header */}
      <View style={currentStyles.header}>
        <Text style={currentStyles.headerTitle}>{t('social_screen.header_title')}</Text>
        <Text style={currentStyles.headerSubtitle}>{t('social_screen.header_subtitle')}</Text>
      </View>

      {/* Search Bar */}
      <View style={currentStyles.searchContainer}>
        <View style={currentStyles.searchInputContainer}>
          <Text style={currentStyles.searchIcon}>🔍</Text>
          <TextInput
            style={currentStyles.searchInput}
            placeholder={t('social_screen.search_placeholder')}
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            textAlign={isRTL ? 'right' : 'left'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={currentStyles.clearButton}
            >
              <Text style={currentStyles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        {isSearching ? (
          <View style={currentStyles.searchResultsContainer}>
            <Text style={currentStyles.sectionTitle}>{t('social_screen.search_results')}</Text>
            {searchLoading ? (
              <View style={currentStyles.loadingState}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={currentStyles.loadingText}>{t('social_screen.searching')}</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={currentStyles.emptyState}>
                <Text style={currentStyles.emptyStateIcon}>🔍</Text>
                <Text style={currentStyles.emptyStateTitle}>{t('social_screen.no_results')}</Text>
                <Text style={currentStyles.emptyStateSubtitle}>
                  {t('social_screen.try_different_search')}
                </Text>
              </View>
            ) : (
              searchResults.map((student) => (
                <View key={student.id} style={currentStyles.studentCard}>
                  <View style={currentStyles.studentInfo}>
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
                          {student.avgScore}% {t('common.avg')}
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
        ) : (
          <View style={currentStyles.timelineContainer}>
            <Text style={currentStyles.sectionTitle}>{t('social_screen.recent_activity')}</Text>
            {timelineLoading ? (
              <View style={currentStyles.loadingState}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={currentStyles.loadingText}>{t('social_screen.loading_activities')}</Text>
              </View>
            ) : timelineError ? (
              <View style={currentStyles.emptyState}>
                <Text style={currentStyles.emptyStateIcon}>⚠️</Text>
                <Text style={currentStyles.emptyStateTitle}>{t('social_screen.error_loading_timeline')}</Text>
                <Text style={currentStyles.emptyStateSubtitle}>{timelineError}</Text>
                <TouchableOpacity style={currentStyles.retryButton} onPress={fetchTimeline}>
                  <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
                </TouchableOpacity>
              </View>
            ) : timelineActivities.length === 0 ? (
              <View style={currentStyles.emptyState}>
                <Text style={currentStyles.emptyStateIcon}>👥</Text>
                <Text style={currentStyles.emptyStateTitle}>{t('social_screen.no_activity_yet')}</Text>
                <Text style={currentStyles.emptyStateSubtitle}>
                  {t('social_screen.follow_students_hint')}
                </Text>
              </View>
            ) : (
              timelineActivities.map((activity) => (
                <View key={activity.id} style={currentStyles.timelineCard}>
                  <View style={currentStyles.timelineHeader}>
                    <View style={currentStyles.timelineUserInfo}>
                      {renderAvatar(activity.user.name)}
                      <View style={currentStyles.timelineUserDetails}>
                        <Text style={currentStyles.timelineUserName}>
                          {activity.user.name}
                        </Text>
                        <Text style={currentStyles.timelineTime}>
                          {getTimeAgo(activity.completedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={currentStyles.timelineQuizInfo}>
                    <Text style={currentStyles.timelineQuizName}>
                      {activity.quiz.name}
                    </Text>
                    <Text style={currentStyles.timelineQuizSubject}>
                      {activity.quiz.subject.name}
                    </Text>
                    <View style={currentStyles.timelineScoreContainer}>
                      <Text
                        style={[
                          currentStyles.timelineScore,
                          {
                            color: getScoreColor(
                              activity.score,
                              activity.totalQuestions
                            ),
                          },
                        ]}
                      >
                        {activity.score}/{activity.totalQuestions}
                      </Text>
                      <Text style={currentStyles.timelineScoreLabel}>{t('home_screen.score')}</Text>
                    </View>
                  </View>

                  <View style={currentStyles.timelineActions}>
                    <TouchableOpacity
                      style={currentStyles.timelineActionButton}
                      onPress={() => handleLike(activity)}
                    >
                      <Text
                        style={[
                          currentStyles.timelineActionIcon,
                          activity.isLiked && currentStyles.timelineActionIconLiked,
                        ]}
                      >
                        {activity.isLiked ? '❤️' : '🤍'}
                      </Text>
                      <Text
                        style={[
                          currentStyles.timelineActionText,
                          activity.isLiked && currentStyles.timelineActionTextLiked
                        ]}
                      >
                        {activity.likes}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={currentStyles.timelineActionButton}
                      onPress={() => handleComment(activity)}
                    >
                      <Text style={currentStyles.timelineActionIcon}>💬</Text>
                      <Text style={currentStyles.timelineActionText}>
                        {activity.comments}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
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
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  searchInputContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: isRTL ? 0 : 10,
    marginLeft: isRTL ? 10 : 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textTertiary,
  },
  content: {
    flex: 1,
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
  searchResultsContainer: {
    paddingBottom: 20,
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
  studentInfo: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
    backgroundColor: theme.colors.avatarBackground,
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
  timelineContainer: {
    paddingBottom: 20,
  },
  timelineCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineHeader: {
    marginBottom: 12,
  },
  timelineUserInfo: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  timelineUserDetails: {
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    flex: 1,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  timelineUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: theme.colors.text,
  },
  timelineTime: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  timelineQuizInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  timelineQuizName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.text,
  },
  timelineQuizSubject: {
    fontSize: 14,
    marginBottom: 12,
    color: theme.colors.textSecondary,
  },
  timelineScoreContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'baseline',
  },
  timelineScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: isRTL ? 0 : 8,
    marginLeft: isRTL ? 8 : 0,
  },
  timelineScoreLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  timelineActions: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  timelineActionButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginRight: isRTL ? 0 : 24,
    marginLeft: isRTL ? 24 : 0,
  },
  timelineActionIcon: {
    fontSize: 20,
    marginRight: isRTL ? 0 : 6,
    marginLeft: isRTL ? 6 : 0,
  },
  timelineActionIconLiked: {},
  timelineActionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  timelineActionTextLiked: {
    fontWeight: '600',
    color: '#E91E63',
  },
  loadingState: {
    marginHorizontal: 16,
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
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    marginHorizontal: 16,
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

export default SocialScreen;
