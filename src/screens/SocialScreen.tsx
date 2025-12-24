import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { tryFetchWithFallback } from '../config/api';

// Types matching GraphQL schema
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
        setTimelineError('Authentication required');
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
        setTimelineError(result.errors?.[0]?.message || 'Failed to load timeline');
      }
    } catch (err: any) {
      console.error('Fetch timeline error:', err);
      setTimelineError(err.message || 'An error occurred while loading timeline');
    } finally {
      setTimelineLoading(false);
    }
  }, []);

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

  // Debounced search
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
        // Update local state
        setSearchResults(prev =>
          prev.map(s =>
            s.id === student.id
              ? { ...s, isFollowing: result.data.followUser.isFollowing }
              : s
          )
        );
        
        // Refresh timeline if we're not searching
        if (searchQuery.length === 0) {
          fetchTimeline();
        }
      } else {
        Alert.alert('Error', result.errors?.[0]?.message || 'Failed to update follow status');
      }
    } catch (err: any) {
      console.error('Follow toggle error:', err);
      Alert.alert('Error', err.message || 'An error occurred');
    }
  };

  const handleLike = async (activity: TimelineActivity) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
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
        // Update local state
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
        Alert.alert('Error', result.errors?.[0]?.message || 'Failed to update like');
      }
    } catch (err: any) {
      console.error('Like error:', err);
      Alert.alert('Error', err.message || 'An error occurred');
    }
  };

  const handleComment = (activity: TimelineActivity) => {
    // TODO: Implement comment modal/dialog
    Alert.alert('Comment', 'Comment functionality coming soon!');
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

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', {
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
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{getInitials(name)}</Text>
      </View>
    );
  };

  const isSearching = searchQuery.length >= 2;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social</Text>
        <Text style={styles.headerSubtitle}>Connect with fellow learners</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for students to follow..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isSearching ? (
          // Search Results View
          <View style={styles.searchResultsContainer}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🔍</Text>
                <Text style={styles.emptyStateTitle}>No results found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Try searching with a different name or mobile number
                </Text>
              </View>
            ) : (
              searchResults.map((student) => (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentInfo}>
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
                          {student.avgScore}% avg
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
        ) : (
          // Timeline View
          <View style={styles.timelineContainer}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {timelineLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading activities...</Text>
              </View>
            ) : timelineError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>⚠️</Text>
                <Text style={styles.emptyStateTitle}>Error Loading Timeline</Text>
                <Text style={styles.emptyStateSubtitle}>{timelineError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchTimeline}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : timelineActivities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>👥</Text>
                <Text style={styles.emptyStateTitle}>No activity yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Follow students to see their quiz activities here
                </Text>
              </View>
            ) : (
              timelineActivities.map((activity) => (
                <View key={activity.id} style={styles.timelineCard}>
                  {/* User Info */}
                  <View style={styles.timelineHeader}>
                    <View style={styles.timelineUserInfo}>
                      {renderAvatar(activity.user.name)}
                      <View style={styles.timelineUserDetails}>
                        <Text style={styles.timelineUserName}>
                          {activity.user.name}
                        </Text>
                        <Text style={styles.timelineTime}>
                          {getTimeAgo(activity.completedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Quiz Info */}
                  <View style={styles.timelineQuizInfo}>
                    <Text style={styles.timelineQuizName}>
                      {activity.quiz.name}
                    </Text>
                    <Text style={styles.timelineQuizSubject}>
                      {activity.quiz.subject.name}
                    </Text>
                    <View style={styles.timelineScoreContainer}>
                      <Text
                        style={[
                          styles.timelineScore,
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
                      <Text style={styles.timelineScoreLabel}>Score</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.timelineActions}>
                    <TouchableOpacity
                      style={styles.timelineActionButton}
                      onPress={() => handleLike(activity)}
                    >
                      <Text
                        style={[
                          styles.timelineActionIcon,
                          activity.isLiked && styles.timelineActionIconLiked,
                        ]}
                      >
                        {activity.isLiked ? '❤️' : '🤍'}
                      </Text>
                      <Text
                        style={[
                          styles.timelineActionText,
                          activity.isLiked && styles.timelineActionTextLiked,
                        ]}
                      >
                        {activity.likes}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.timelineActionButton}
                      onPress={() => handleComment(activity)}
                    >
                      <Text style={styles.timelineActionIcon}>💬</Text>
                      <Text style={styles.timelineActionText}>
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
  searchContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Search Results Styles
  searchResultsContainer: {
    paddingBottom: 20,
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  // Timeline Styles
  timelineContainer: {
    paddingBottom: 20,
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineHeader: {
    marginBottom: 12,
  },
  timelineUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineUserDetails: {
    marginLeft: 12,
    flex: 1,
  },
  timelineUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#999999',
  },
  timelineQuizInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timelineQuizName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  timelineQuizSubject: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  timelineScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timelineScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  timelineScoreLabel: {
    fontSize: 14,
    color: '#666666',
  },
  timelineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  timelineActionIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  timelineActionIconLiked: {
    // Already using emoji
  },
  timelineActionText: {
    fontSize: 14,
    color: '#666666',
  },
  timelineActionTextLiked: {
    color: '#E91E63',
    fontWeight: '600',
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
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666666',
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

export default SocialScreen;
