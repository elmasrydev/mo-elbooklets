import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { useTypography } from '../hooks/useTypography';

const NotificationBell: React.FC = () => {
  const { theme, spacing } = useTheme();
  const { unreadCount } = useNotifications();
  const { typography, fontWeight } = useTypography();
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      style={styles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="notifications-outline" size={26} color={theme.colors.headerText} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error || '#EF4444' }]}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
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
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 12, // Help with vertical centering
    includeFontPadding: false, // For Android
  },
});

export default NotificationBell;
