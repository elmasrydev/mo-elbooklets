import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useFollowToggle } from '../hooks/useFollowToggle';
import { subscribeFollowChange } from '../utils/followBus';
import { tryFetchWithFallback } from '../config/api';
import UnifiedHeader from '../components/UnifiedHeader';
import UserListRow from '../components/UserListRow';
import { GenericListSkeleton } from '../components/SkeletonLoader';
import { layout } from '../config/layout';

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
  selectedAvatar?: { url?: string } | null;
}

const FollowListScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { type } = route.params; // 'followers' or 'following'
  const { theme, spacing } = useTheme();
  const { t } = useTranslation();
  const { typography } = useTypography();
  const common = useCommonStyles();
  const { toggleFollow } = useFollowToggle();

  const currentStyles = styles;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [followingId, setFollowingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const query =
        type === 'following'
          ? `query MyFollowing { 
            myFollowing { 
              id name mobile grade { id name } totalQuizzes avgScore isFollowing selectedAvatar { url }
            } 
          }`
          : `query MyFollowers { 
            myFollowers { 
              id name mobile grade { id name } totalQuizzes avgScore isFollowing selectedAvatar { url }
            } 
          }`;

      const result = await tryFetchWithFallback(query, undefined, token);

      const listData = type === 'following' ? result.data?.myFollowing : result.data?.myFollowers;
      if (listData) {
        setData(listData);
      }
    } catch (err) {
      console.error('Fetch follow list error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Reflect follow/unfollow done from the profile screen back into the list.
  useEffect(
    () =>
      subscribeFollowChange((userId, isFollowing) => {
        setData((prev) => prev.map((s) => (s.id === userId ? { ...s, isFollowing } : s)));
      }),
    [],
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchList();
  };

  const handleFollowToggle = async (student: Student) => {
    if (followingId) return;
    setFollowingId(student.id);
    try {
      const result = await toggleFollow(student.id);
      if (result?.success) {
        setData((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, isFollowing: result.isFollowing } : s)),
        );
      }
    } finally {
      setFollowingId(null);
    }
  };

  const renderItem = ({ item: student }: { item: Student }) => (
    <UserListRow
      student={student}
      containerStyle={{ marginBottom: spacing.md }}
      followLoading={followingId === student.id}
      onPress={() =>
        navigation.navigate('StudentProfile', {
          userId: student.id,
          name: student.name,
          avatarUrl: student.selectedAvatar?.url,
          gradeName: student.grade?.name,
          isFollowing: student.isFollowing,
        })
      }
      onFollowToggle={() => handleFollowToggle(student)}
    />
  );

  const headerTitle =
    type === 'following'
      ? t('profile_screen.follow_list_title_following')
      : t('profile_screen.follow_list_title_followers');

  return (
    <View style={common.container}>
      <UnifiedHeader title={headerTitle} showBackButton />

      {loading && !refreshing ? (
        <View style={currentStyles.loadingContainer}>
          <GenericListSkeleton numItems={6} />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={currentStyles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={currentStyles.emptyState}>
              <Ionicons name="people-outline" size={60} color={theme.colors.textTertiary} />
              <Text
                style={[
                  currentStyles.emptyText,
                  typography('body'),
                  { color: theme.colors.textSecondary },
                ]}
              >
                {type === 'following'
                  ? t('profile_screen.no_following')
                  : t('profile_screen.no_followers')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    padding: layout.screenPadding,
  },
  listContent: {
    padding: layout.screenPadding,
    paddingBottom: 40,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
});

export default FollowListScreen;
