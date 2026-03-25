import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { tryFetchWithFallback } from '../config/api';

interface FollowResult {
  success: boolean;
  isFollowing: boolean;
  message: string;
}

export const useFollowToggle = () => {
  const [isToggling, setIsToggling] = useState(false);

  const toggleFollow = useCallback(async (userId: string): Promise<FollowResult | null> => {
    try {
      setIsToggling(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return null;

      const result = await tryFetchWithFallback(
        `
        mutation FollowUser($userId: ID!) {
          followUser(userId: $userId) { success isFollowing message }
        }
      `,
        { userId },
        token,
      );

      return result.data?.followUser || null;
    } catch (err) {
      console.error('Follow toggle error:', err);
      return null;
    } finally {
      setIsToggling(false);
    }
  }, []);

  return { toggleFollow, isToggling };
};
