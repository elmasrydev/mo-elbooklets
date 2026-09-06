import React, { useCallback } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client/react';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTypography } from '../hooks/useTypography';
import {
  ParentNotificationsUnreadCountDocument,
  UserNotificationsUnreadCountDocument,
} from '../generated/graphql';

/**
 * Header bell + unread badge.
 *
 * Deliberately does NOT use `useNotifications()`: that hook runs a network-only
 * 20-item list query, so every mount and every screen focus paid for a full page
 * of notifications just to render a number. This asks for `unread_count` alone.
 */
const NotificationBell: React.FC = () => {
  const { theme, spacing } = useTheme();
  const { fontWeight } = useTypography();
  const { userRole } = useAuth();
  const navigation = useNavigation<any>();

  const isParent = userRole === 'parent';
  const { data, refetch } = useQuery(
    isParent ? ParentNotificationsUnreadCountDocument : UserNotificationsUnreadCountDocument,
  );

  // The count changes on the Notifications screen (mark-as-read), which writes to
  // a different cache field, so refresh when the host screen regains focus.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const unreadCount =
    (data as { userNotifications?: { unread_count?: number | null } } | undefined)
      ?.userNotifications?.unread_count ??
    (data as { parentNotifications?: { unread_count?: number | null } } | undefined)
      ?.parentNotifications?.unread_count ??
    0;

  return (
    <TouchableOpacity
      testID="notification-bell"
      onPress={() => navigation.navigate('Notifications')}
      style={styles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="notifications-outline" size={26} color={theme.colors.headerText} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error || '#EF4444' }]}>
          <Text style={[styles.badgeText, fontWeight('bold')]}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 19,
    height: 19,
    borderRadius: 9.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#fff', // White border to make it pop against header
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12, // Help with vertical centering
    includeFontPadding: false, // For Android
  },
});

export default NotificationBell;
