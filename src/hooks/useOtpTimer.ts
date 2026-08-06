import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

/**
 * The four OTP flows are scoped by purpose *and* audience (mobile-otp-guide.md
 * section 2) — a code issued for one never works for another. Their countdowns
 * must be scoped the same way, or a reset countdown would silently gate the
 * resend button on the verification screen.
 */
export type OtpTimerScope = 'student-verify' | 'parent-verify' | 'student-reset' | 'parent-reset';

/**
 * Resend stays locked this long after *every* send, including the automatic one
 * at register/login. Without it an impatient user burns the hourly quota in
 * under a minute and is locked out of their own recovery (guide section 5).
 */
export const RESEND_LOCK_SECONDS = 60;

/** Codes live 10 minutes; used when a send response carries no `expires_in`. */
export const DEFAULT_OTP_EXPIRY_SECONDS = 600;

const storageKey = (scope: OtpTimerScope) => `@otp_timer_state:${scope}`;

/** Pre-scoping key. Removed on mount so a stale lock cannot strand a user. */
const LEGACY_STORAGE_KEY = '@otp_timer_state';

interface TimerState {
  sentAt: number;
  expiresIn: number;
  /**
   * The number the code went to, when the flow lets the user type one. Lets a
   * screen tell "a live code is already waiting for THIS number" from "they
   * changed the number", so it can reuse the code instead of spending another
   * message from a 3-per-hour budget.
   */
  sentTo?: string;
}

/**
 * Drives both countdowns of one OTP flow from a single persisted send stamp:
 * the 60s resend lock (`timeLeft` / `isActive` / `formattedTime`) and the code's
 * own lifetime (`expiresLeft` / `isExpired`). Both are derived from the wall
 * clock, so backgrounding the app cannot inflate them.
 */
export const useOtpTimer = (scope: OtpTimerScope) => {
  const [state, setState] = useState<TimerState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  /**
   * Stamp of the most recent send made during this mount.
   *
   * `loadTimer`'s read is issued on mount *before* a screen's own mount effect
   * can call `startTimer`, but it resolves after — so without this guard the
   * restored value would clobber the timer for the code that was just sent, and
   * a resend button would unlock the instant the screen opened. Anything on
   * disk that is not newer than this is a stale read and gets ignored.
   */
  const lastLocalSendRef = useRef(0);

  const key = storageKey(scope);

  const elapsed = state ? Math.max(0, Math.floor((now - state.sentAt) / 1000)) : 0;
  const timeLeft = state ? Math.max(0, RESEND_LOCK_SECONDS - elapsed) : 0;
  const expiresLeft = state ? Math.max(0, state.expiresIn - elapsed) : 0;
  const isActive = timeLeft > 0;
  const isExpired = state !== null && expiresLeft <= 0;
  /**
   * A code was sent and has not outlived `expires_in` yet. Distinct from
   * `isActive`, which is only the 60s resend lock — a code stays usable for ten
   * minutes after the lock releases, so anything offering "I already have a
   * code" must gate on this instead.
   */
  const hasLiveCode = state !== null && expiresLeft > 0;
  const sentTo = state?.sentTo ?? null;
  // Only the resend lock is rendered per-second (`timeLeft`/`formattedTime`).
  // `isExpired` flips once, so it gets a single timeout rather than 540 more
  // ticks that re-render the host screen while the user is typing their code.
  const isTicking = state !== null && timeLeft > 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadTimer = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return;

      const restored: TimerState = JSON.parse(stored);

      // A send made during this mount always wins: this read was issued before
      // that write and is therefore looking at the previous code's stamp.
      // Deleting on the dead branch would also throw away the fresh record.
      if (restored.sentAt <= lastLocalSendRef.current) return;

      const remaining = restored.expiresIn - Math.floor((Date.now() - restored.sentAt) / 1000);

      if (remaining > 0) {
        setState(restored);
        setNow(Date.now());
      } else {
        // The code is dead; drop it so a remount cannot resurrect the lock.
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Error loading OTP timer state', e);
    }
  }, [key]);

  useEffect(() => {
    loadTimer();
  }, [loadTimer]);

  useEffect(() => {
    AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {
      // Best-effort cleanup of the pre-scoping key; never block the flow.
    });
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        setNow(Date.now());
        loadTimer();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [loadTimer]);

  useEffect(() => {
    if (!isTicking) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isTicking]);

  // One-shot wake-up so `isExpired` flips exactly when the code dies, without
  // holding a 1Hz interval open for the rest of its life.
  useEffect(() => {
    if (!state || expiresLeft <= 0) return;

    const timeout = setTimeout(() => setNow(Date.now()), expiresLeft * 1000);
    return () => clearTimeout(timeout);
  }, [state, expiresLeft]);

  const startTimer = useCallback(
    async (expiresInSeconds: number = DEFAULT_OTP_EXPIRY_SECONDS, target?: string) => {
      const next: TimerState = {
        sentAt: Date.now(),
        expiresIn: Math.max(0, expiresInSeconds),
        ...(target ? { sentTo: target } : {}),
      };

      lastLocalSendRef.current = next.sentAt;
      setState(next);
      setNow(next.sentAt);

      try {
        await AsyncStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving OTP timer state', e);
      }
    },
    [key],
  );

  const clearTimer = useCallback(async () => {
    setState(null);

    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error clearing OTP timer state', e);
    }
  }, [key]);

  return {
    /** Seconds until resend is allowed again. */
    timeLeft,
    /** True while resend is still locked. */
    isActive,
    formattedTime: formatTime(timeLeft),
    /** Seconds until the code itself dies. */
    expiresLeft,
    /** True once the code has outlived `expires_in`. */
    isExpired,
    /** True while a sent code is still usable, regardless of the resend lock. */
    hasLiveCode,
    /** The number the live code was sent to, when the flow recorded one. */
    sentTo,
    startTimer,
    clearTimer,
  };
};
