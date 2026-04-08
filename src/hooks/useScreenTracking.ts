import { useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import analytics from '../lib/analytics';

/**
 * useScreenTracking hook
 * 
 * Automatically logs a screen view event to Firebase Analytics 
 * when the screen comes into focus.
 * 
 * @param screenName The name of the screen for analytics reporting
 */
export const useScreenTracking = (screenName: string) => {
  useFocusEffect(
    useCallback(() => {
      analytics.screen(screenName);
    }, [screenName])
  );
};
