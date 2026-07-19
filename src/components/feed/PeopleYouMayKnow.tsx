import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTypography } from '../../hooks/useTypography';
import { useFollowToggle } from '../../hooks/useFollowToggle';
import { PeopleYouMayKnowDocument, PeopleYouMayKnowQuery } from '../../generated/graphql';
import Avatar from '../Avatar';
import AppButton from '../AppButton';
import { layout } from '../../config/layout';

type SuggestedUser = NonNullable<PeopleYouMayKnowQuery['peopleYouMayKnow']>['suggestions'][number];

interface PeopleYouMayKnowProps {
  onFollowSuccess?: () => void;
}

const PeopleYouMayKnow: React.FC<PeopleYouMayKnowProps> = ({ onFollowSuccess }) => {
  const { theme, spacing } = useTheme();
  const { t } = useTranslation();
  const { typography, fontWeight } = useTypography();
  const { toggleFollow } = useFollowToggle();

  const [isFollowingId, setIsFollowingId] = useState<string | null>(null);
  // Followed users leave the rail instantly; the server also excludes them on
  // the next fetch, this just avoids a refetch round trip for the animation.
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const userKey = `${user?.school_name}-${user?.governorate_id}-${user?.city_id}`;

  const { data, loading, refetch } = useQuery(PeopleYouMayKnowDocument, {
    variables: { limit: 10 },
  });
  const canShow = data?.peopleYouMayKnow?.canShow ?? false;
  const suggestions = (data?.peopleYouMayKnow?.suggestions ?? []).filter(
    (s) => !followedIds.has(s.id),
  );

  // School/city edits in the profile change who is suggestable.
  const lastUserKeyRef = React.useRef(userKey);
  useEffect(() => {
    if (lastUserKeyRef.current === userKey) return;
    lastUserKeyRef.current = userKey;
    refetch();
  }, [userKey, refetch]);

  const handleFollow = async (suggested: SuggestedUser) => {
    try {
      setIsFollowingId(suggested.id);
      const result = await toggleFollow(suggested.id);
      if (result?.success) {
        // Remove from list after successful follow as per requirements
        setFollowedIds((prev) => new Set(prev).add(suggested.id));
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
        {/* SuggestedUser exposes no avatar on the backend yet — initials only. */}
        <Avatar name={item.name} size={48} />
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
        {/* Suggestions are not-yet-followed by definition (and leave the rail
            once followed), so the button is always the primary Follow. */}
        <AppButton
          title={t('common.follow')}
          onPress={() => handleFollow(item)}
          size="sm"
          loading={isFollowingId === item.id}
          style={styles.followBtn}
          variant="primary"
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
