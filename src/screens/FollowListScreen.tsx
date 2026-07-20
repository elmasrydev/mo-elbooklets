import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useFollowToggle } from '../hooks/useFollowToggle';
import { MyFollowersDocument, MyFollowersQuery, MyFollowingDocument } from '../generated/graphql';
import UnifiedHeader from '../components/UnifiedHeader';
import UserListRow from '../components/UserListRow';
import { GenericListSkeleton } from '../components/SkeletonLoader';
import { layout } from '../config/layout';

// Followers and following share the StudentSearchResult shape.
type Student = MyFollowersQuery['myFollowers'][number];

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

  const [refreshing, setRefreshing] = useState(false);
  const [followingId, setFollowingId] = useState<string | null>(null);

  // One skip-paired query per list keeps each result fully typed; follow
  // toggles anywhere update these rows via the normalized cache, so there is
  // no local copy of the list to patch.
  const followersQuery = useQuery(MyFollowersDocument, {
    skip: type === 'following',
    fetchPolicy: 'cache-and-network',
  });
  const followingQuery = useQuery(MyFollowingDocument, {
    skip: type !== 'following',
    fetchPolicy: 'cache-and-network',
  });
  const activeQuery = type === 'following' ? followingQuery : followersQuery;
  const data: Student[] =
    (type === 'following' ? followingQuery.data?.myFollowing : followersQuery.data?.myFollowers) ??
    [];
  // Silent background refresh — don't replace a rendered list with a skeleton.
  const loading = activeQuery.loading && !activeQuery.data;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await activeQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleFollowToggle = async (student: Student) => {
    if (followingId) return;
    setFollowingId(student.id);
    try {
      await toggleFollow(student.id);
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
