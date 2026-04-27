import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { tryFetchWithFallback } from '../config/api';
import { useAuth } from '../context/AuthContext';

export interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
  percentage: number;
  needsGender: boolean;
  needsSchool: boolean;
  needsParentMobile: boolean;
  needsEmail: boolean;
  needsEducationalSystem: boolean;
}

export const useProfileCompleteness = () => {
  const { user } = useAuth();
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [loading, setLoading] = useState(false);

  const checkCompleteness = useCallback(async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;

      const result = await tryFetchWithFallback(
        `query ProfileCompleteness { 
          profileCompleteness { 
            isComplete missingFields percentage needsGender needsSchool 
            needsParentMobile needsEmail needsEducationalSystem
          } 
        }`,
        undefined,
        token
      );

      if (result.data?.profileCompleteness) {
        setCompleteness(result.data.profileCompleteness);
      }
    } catch (err) {
      console.error('Check completeness error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      checkCompleteness();
    }
  }, [user, checkCompleteness]);

  return { completeness, loading, refetch: checkCompleteness };
};
