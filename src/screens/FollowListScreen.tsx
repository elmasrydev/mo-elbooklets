import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useTypography } from '../hooks/useTypography';
import { useCommonStyles } from '../hooks/useCommonStyles';
import { useFollowToggle } from '../hooks/useFollowToggle';
import { tryFetchWithFallback } from '../config/api';
import UnifiedHeader from '../components/UnifiedHeader';
import AppButton from '../components/AppButton';
import Avatar from '../components/Avatar';
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
  const navigation = useNavigation();
  const { type } = route.params; // 'followers' or 'following'
  const { theme, spacing } = useTheme();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const common = useCommonStyles();
  const { toggleFollow } = useFollowToggle();

  const currentStyles = useMemo(() => styles(common), [common]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchList();
  };

  const handleFollowToggle = async (student: Student) => {
    const result = await toggleFollow(student.id);
    if (result?.success) {
      setData((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, isFollowing: result.isFollowing } : s)),
      );
    }
  };

  const renderItem = ({ item: student }: { item: Student }) => (
    <View style={[common.card, { marginBottom: spacing.md }]}>
      <View style={currentStyles.studentCardContent}>
        <View style={currentStyles.studentInfo}>
          <Avatar uri={student.selectedAvatar?.url} name={student.name} size={52} />
          <View style={currentStyles.studentDetails}>
            <Text
              style={[
                currentStyles.studentName,
                typography('body'),
                fontWeight('bold'),
                { color: theme.colors.text },
              ]}
            >
              {student.name}
            </Text>
            <Text
              style={[
                currentStyles.studentGrade,
                typography('caption'),
                { color: theme.colors.textSecondary },
              ]}
            >
              {student.grade.name}
            </Text>
            <View style={currentStyles.studentStats}>
              <View
                style={[currentStyles.statBadge, { backgroundColor: `${theme.colors.primary}10` }]}
              >
                <Ionicons name="book-outline" size={12} color={theme.colors.primary} />
                <Text
                  style={[
                    currentStyles.studentStat,
                    typography('label'),
                    fontWeight('bold'),
                    { color: theme.colors.primary },
                  ]}
                >
                  {student.totalQuizzes} {t('common.quizzes')}
                </Text>
              </View>
              <View
                style={[currentStyles.statBadge, { backgroundColor: `${theme.colors.success}10` }]}
              >
                <Ionicons name="star-outline" size={12} color={theme.colors.success} />
                <Text
                  style={[
                    currentStyles.studentStat,
                    typography('label'),
                    fontWeight('bold'),
                    { color: theme.colors.success },
                  ]}
                >
                  {student.avgScore}% {t('common.avg')}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <AppButton
          title={student.isFollowing ? t('common.following') : t('common.follow')}
          onPress={() => handleFollowToggle(student)}
          variant={student.isFollowing ? 'outline' : 'primary'}
          size="sm"
          fullWidth={false}
          style={currentStyles.followButton}
        />
      </View>
    </View>
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

const styles = (common: any) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      padding: layout.screenPadding,
    },
    listContent: {
      padding: layout.screenPadding,
      paddingBottom: 40,
    },
    studentCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    avatarText: {
      textAlign: 'center',
    },
    studentDetails: {
      flex: 1,
      ...common.marginStart(12),
    },
    studentName: {
      marginBottom: 2,
    },
    studentGrade: {
      marginBottom: 4,
    },
    studentStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    studentStat: {
      fontSize: 10,
    },
    followButton: {
      minWidth: 90,
      ...common.marginStart(8),
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
