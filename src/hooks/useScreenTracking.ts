import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { analytics } from '../lib/analytics';

/**
 * Reusable hook to track screen views automatically using React Navigation's focus state.
 * This should be used in any major screen component.
 * 
 * @param screenName The name of the screen to track in analytics
 * @param properties Optional additional properties to track with the screen view
 */
export const useScreenTracking = (screenName: string, properties?: Record<string, any>) => {
  useFocusEffect(
    useCallback(() => {
      analytics.screen(screenName, properties);
    }, [screenName, properties])
  );
};
