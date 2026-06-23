import React, { useState, useEffect, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTypography } from '../../hooks/useTypography';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import { useFollowToggle } from '../../hooks/useFollowToggle';
import { tryFetchWithFallback } from '../../config/api';
import Avatar from '../Avatar';
import AppButton from '../AppButton';
import { layout } from '../../config/layout';

interface SuggestedUser {
  id: string;
  name: string;
  suggestionReason: 'SAME_SCHOOL' | 'SAME_CITY';
  school?: { id: string; name: string };
  grade?: { id: string; name: string };
  isFollowing?: boolean;
  selectedAvatar?: { url?: string } | null;
}

interface PeopleYouMayKnowProps {
  onFollowSuccess?: () => void;
}

const PeopleYouMayKnow: React.FC<PeopleYouMayKnowProps> = ({ onFollowSuccess }) => {
  const { theme, spacing, borderRadius } = useTheme();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const common = useCommonStyles();
  const { toggleFollow } = useFollowToggle();

  const [loading, setLoading] = useState(true);
  const [canShow, setCanShow] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isFollowingId, setIsFollowingId] = useState<string | null>(null);

  const { user } = useAuth();
  const userKey = `${user?.school_name}-${user?.governorate_id}-${user?.city_id}`;

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `
        query PeopleYouMayKnow($limit: Int) {
          peopleYouMayKnow(limit: $limit) {
            canShow
            suggestions {
              id
              name
              suggestionReason
              school { id name }
              grade { id name }
              selectedAvatar { url }
            }
          }
        }
      `,
        { limit: 10 },
        token,
      );

      if (result.data?.peopleYouMayKnow) {
        setCanShow(result.data.peopleYouMayKnow.canShow);
        setSuggestions(result.data.peopleYouMayKnow.suggestions);
      }
    } catch (err) {
      console.error('Fetch PYMK error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions, userKey]);

  const handleFollow = async (user: SuggestedUser) => {
    try {
      setIsFollowingId(user.id);
      const result = await toggleFollow(user.id);
      if (result?.success) {
        // Remove from list after successful follow as per requirements
        setSuggestions((prev) => prev.filter((s) => s.id !== user.id));
        if (onFollowSuccess) onFollowSuccess();
      }
    } finally {
      setIsFollowingId(null);
    }
  };

  const renderItem = ({ item }: { item: SuggestedUser }) => {
    const reasonLabel =
      item.suggestionReason === 'SAME_SCHOOL'
        ? t('social_screen.same_school')
        : t('social_screen.same_city');

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Avatar uri={item.selectedAvatar?.url} name={item.name} size={48} />
        <Text
          style={[
            styles.name,
            typography('bodySmall'),
            fontWeight('bold'),
            { color: theme.colors.text },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.context, typography('caption'), { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {reasonLabel}
        </Text>
        <AppButton
          title={item.isFollowing ? t('common.following') : t('common.follow')}
          onPress={() => !item.isFollowing && handleFollow(item)}
          size="sm"
          loading={isFollowingId === item.id}
          style={styles.followBtn}
          variant={item.isFollowing ? 'outline' : 'primary'}
        />
      </View>
    );
  };

  if (loading && suggestions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!canShow || suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            typography('label'),
            fontWeight('bold'),
            { color: theme.colors.textSecondary },
          ]}
        >
          {t('social_screen.pymk_title')}
        </Text>
      </View>
      <FlatList
        data={suggestions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={140 + spacing.md}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: layout.screenPadding,
    marginBottom: 12,
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    gap: 12,
  },
  card: {
    width: 140,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    ...layout.shadow,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  name: {
    textAlign: 'center',
    marginBottom: 2,
  },
  context: {
    textAlign: 'center',
    marginBottom: 12,
  },
  followBtn: {
    height: 32,
    paddingHorizontal: 16,
  },
});

export default PeopleYouMayKnow;
