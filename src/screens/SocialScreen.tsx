import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        setSearchResults((prev: Student[]) =>
          prev.map((s: Student) =>
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
        setTimelineActivities((prev: TimelineActivity[]) =>
          prev.map((a: TimelineActivity) =>
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

  const renderAvatar = (name: string, size = 50) => {
    return (
      <View style={[currentStyles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[currentStyles.avatarText, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
      </View>
    );
  };

  const isSearching = searchQuery.length >= 2;
  const currentStyles = styles(theme, isRTL);

  const renderContent = () => {
    if (isSearching) {
      if (searchLoading) {
        return (
          <View style={currentStyles.loadingState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={currentStyles.loadingText}>{t('social_screen.searching')}</Text>
          </View>
        );
      }

      if (searchResults.length === 0) {
        return (
          <View style={currentStyles.emptyState}>
            <Ionicons name="search-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={currentStyles.emptyStateTitle}>{t('social_screen.no_results')}</Text>
            <Text style={currentStyles.emptyStateSubtitle}>
              {t('social_screen.try_different_search')}
            </Text>
          </View>
        );
      }

      return (
        <View style={currentStyles.searchResultsContainer}>
          <Text style={currentStyles.sectionTitle}>{t('social_screen.search_results')}</Text>
          {searchResults.map((student) => (
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
          ))}
        </View>
      );
    }

    // Default Timeline View
    if (timelineLoading) {
      return (
        <View style={currentStyles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={currentStyles.loadingText}>{t('social_screen.loading_activities')}</Text>
        </View>
      );
    }

    if (timelineError) {
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={currentStyles.emptyStateTitle}>{t('social_screen.error_loading_timeline')}</Text>
          <Text style={currentStyles.emptyStateSubtitle}>{timelineError}</Text>
          <TouchableOpacity style={currentStyles.retryButton} onPress={fetchTimeline}>
            <Text style={currentStyles.retryButtonText}>{t('home_screen.try_again')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (timelineActivities.length === 0) {
      return (
        <View style={currentStyles.emptyState}>
          <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={currentStyles.emptyStateTitle}>{t('social_screen.no_activity_yet')}</Text>
          <Text style={currentStyles.emptyStateSubtitle}>
            {t('social_screen.follow_students_hint')}
          </Text>
        </View>
      );
    }

    return (
      <View style={currentStyles.timelineContainer}>
        <Text style={currentStyles.sectionTitle}>{t('social_screen.recent_activity')}</Text>
        {timelineActivities.map((activity) => (
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
                {activity.quiz.subject.name}: {activity.quiz.name}
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
                <Ionicons 
                  name={activity.isLiked ? "heart" : "heart-outline"} 
                  size={22} 
                  color={activity.isLiked ? "#EF4444" : theme.colors.textSecondary} 
                />
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
                <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={currentStyles.timelineActionText}>
                  {activity.comments}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={currentStyles.container}>
      {/* Fixed Theme Header */}
      <View style={currentStyles.header}>
        <View style={currentStyles.headerLeft}>
          <Text style={currentStyles.headerTitle}>{t('social_screen.header_title')}</Text>
          <Text style={currentStyles.headerSubtitle}>{t('social_screen.header_subtitle')}</Text>
        </View>
        <TouchableOpacity style={currentStyles.notificationButton} onPress={fetchTimeline}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={currentStyles.searchContainer}>
        <View style={currentStyles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }} />
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
              <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={currentStyles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
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
  searchContainer: {
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  searchInputContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 20,
    color: theme.colors.text,
    textAlign: isRTL ? 'right' : 'left',
  },
  searchResultsContainer: {
    paddingBottom: 20,
  },
  studentCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 18,
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
  studentInfo: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(147, 51, 234, 0.1)',
  },
  avatarText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  studentGrade: {
    fontSize: 13,
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
    color: theme.colors.primary,
    fontWeight: '600',
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
  timelineContainer: {
    paddingBottom: 20,
  },
  timelineCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 28,
    padding: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  timelineHeader: {
    marginBottom: 16,
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
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  timelineTime: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  timelineQuizInfo: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  timelineQuizName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  timelineScoreContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'baseline',
  },
  timelineScore: {
    fontSize: 28,
    fontWeight: '800',
  },
  timelineScoreLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
    fontWeight: '600',
  },
  timelineActions: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 4,
  },
  timelineActionButton: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginRight: isRTL ? 0 : 24,
    marginLeft: isRTL ? 24 : 0,
  },
  timelineActionText: {
    fontSize: 14,
    marginLeft: isRTL ? 0 : 6,
    marginRight: isRTL ? 6 : 0,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  timelineActionTextLiked: {
    color: '#EF4444',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SocialScreen;
