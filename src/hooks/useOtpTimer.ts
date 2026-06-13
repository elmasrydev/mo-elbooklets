import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

const OTP_TIMER_STORAGE_KEY = '@otp_timer_state';

interface TimerState {
  sentAt: number;
  expiresIn: number;
}

export const useOtpTimer = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateRemaining = useCallback((state: TimerState) => {
    const now = Date.now();
    const elapsed = Math.floor((now - state.sentAt) / 1000);
    return Math.max(0, state.expiresIn - elapsed);
  }, []);

  const loadTimer = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(OTP_TIMER_STORAGE_KEY);
      if (stored) {
        const state: TimerState = JSON.parse(stored);
        const remaining = calculateRemaining(state);

        if (remaining > 0) {
          setTimeLeft(remaining);
          setIsActive(true);
        } else {
          clearTimer();
        }
      }
    } catch (e) {
      console.error('Error loading timer state', e);
    }
  }, [calculateRemaining]);

  useEffect(() => {
    loadTimer();
  }, [loadTimer]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadTimer();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [loadTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft <= 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const startTimer = async (expiresInSeconds: number) => {
    const state: TimerState = {
      sentAt: Date.now(),
      expiresIn: expiresInSeconds,
    };

    try {
      await AsyncStorage.setItem(OTP_TIMER_STORAGE_KEY, JSON.stringify(state));
      setTimeLeft(expiresInSeconds);
      setIsActive(true);
    } catch (e) {
      console.error('Error saving timer state', e);
    }
  };

  const clearTimer = async () => {
    try {
      await AsyncStorage.removeItem(OTP_TIMER_STORAGE_KEY);
      setTimeLeft(0);
      setIsActive(false);
    } catch (e) {
      console.error('Error clearing timer state', e);
    }
  };

  return {
    timeLeft,
    isActive,
    formattedTime: formatTime(timeLeft),
    startTimer,
    clearTimer,
  };
};
