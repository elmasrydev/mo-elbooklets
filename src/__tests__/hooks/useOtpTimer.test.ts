import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOtpTimer, RESEND_LOCK_SECONDS, MAX_OTP_SENDS } from '../../hooks/useOtpTimer';

const key = (scope: string) => `@otp_timer_state:${scope}`;
const LEGACY_STORAGE_KEY = '@otp_timer_state';

describe('useOtpTimer Hook', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default idle state', () => {
    const { result } = renderHook(() => useOtpTimer('student-verify'));
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.formattedTime).toBe('0:00');
  });

  it('should lock resend for 60s and count the code lifetime separately', async () => {
    const { result } = renderHook(() => useOtpTimer('student-verify'));

    await act(async () => {
      await result.current.startTimer(600);
    });

    // The resend lock is always 60s, regardless of how long the code lives.
    expect(result.current.timeLeft).toBe(RESEND_LOCK_SECONDS);
    expect(result.current.isActive).toBe(true);
    expect(result.current.formattedTime).toBe('1:00');
    expect(result.current.expiresLeft).toBe(600);
    expect(result.current.isExpired).toBe(false);

    const stored = await AsyncStorage.getItem(key('student-verify'));
    expect(JSON.parse(stored!)).toHaveProperty('sentAt');
    expect(JSON.parse(stored!).expiresIn).toBe(600);
  });

  it('should decrement both countdowns every second while active', async () => {
    const { result } = renderHook(() => useOtpTimer('student-verify'));

    await act(async () => {
      await result.current.startTimer(600);
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe(59);
    expect(result.current.formattedTime).toBe('0:59');
    expect(result.current.expiresLeft).toBe(599);
  });

  it('should release the resend lock at 60s while the code is still alive', async () => {
    const { result } = renderHook(() => useOtpTimer('student-reset'));

    await act(async () => {
      await result.current.startTimer(600);
    });

    act(() => {
      jest.advanceTimersByTime(RESEND_LOCK_SECONDS * 1000);
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(result.current.expiresLeft).toBe(540);
    expect(result.current.isExpired).toBe(false);
  });

  it('should report the code as expired once expires_in elapses', async () => {
    const { result } = renderHook(() => useOtpTimer('student-reset'));

    await act(async () => {
      await result.current.startTimer(120);
    });

    act(() => {
      jest.advanceTimersByTime(120_000);
    });

    expect(result.current.expiresLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it('should clear timer state on clearTimer call', async () => {
    const { result } = renderHook(() => useOtpTimer('student-verify'));

    await act(async () => {
      await result.current.startTimer(600);
    });

    expect(result.current.isActive).toBe(true);

    await act(async () => {
      await result.current.clearTimer();
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(result.current.isExpired).toBe(false);
    expect(await AsyncStorage.getItem(key('student-verify'))).toBeNull();
  });

  it('should keep scopes isolated from one another', async () => {
    const verify = renderHook(() => useOtpTimer('parent-verify'));
    const reset = renderHook(() => useOtpTimer('parent-reset'));

    await act(async () => {
      await verify.result.current.startTimer(600);
    });

    expect(verify.result.current.isActive).toBe(true);
    // A verification countdown must not gate the reset screen's resend button.
    expect(reset.result.current.isActive).toBe(false);
    expect(await AsyncStorage.getItem(key('parent-reset'))).toBeNull();
  });

  it('should restore a live persisted state on mount', async () => {
    await AsyncStorage.setItem(
      key('student-verify'),
      JSON.stringify({ sentAt: Date.now(), expiresIn: 600 }),
    );

    const { result } = renderHook(() => useOtpTimer('student-verify'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.timeLeft).toBeLessThanOrEqual(RESEND_LOCK_SECONDS);
  });

  it('should discard a persisted state whose code already died', async () => {
    await AsyncStorage.setItem(
      key('student-verify'),
      JSON.stringify({ sentAt: Date.now() - 700_000, expiresIn: 600 }),
    );

    const { result } = renderHook(() => useOtpTimer('student-verify'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isActive).toBe(false);
    expect(await AsyncStorage.getItem(key('student-verify'))).toBeNull();
  });

  it('should keep the lock for a code sent during mount, not the stale stored one', async () => {
    // The screen's own mount effect calls startTimer while the hook's restore
    // read is still in flight. If the resolved read won, the resend button
    // would unlock the instant a fresh code was sent.
    await AsyncStorage.setItem(
      key('student-verify'),
      JSON.stringify({ sentAt: Date.now() - 300_000, expiresIn: 600 }),
    );

    const { result } = renderHook(() => useOtpTimer('student-verify'));

    await act(async () => {
      await result.current.startTimer(600);
      await Promise.resolve();
    });

    expect(result.current.timeLeft).toBe(RESEND_LOCK_SECONDS);
    expect(result.current.isActive).toBe(true);
    expect(result.current.isExpired).toBe(false);
  });

  it('should not delete a just-sent record when the stored one had already died', async () => {
    await AsyncStorage.setItem(
      key('student-verify'),
      JSON.stringify({ sentAt: Date.now() - 700_000, expiresIn: 600 }),
    );

    const { result } = renderHook(() => useOtpTimer('student-verify'));

    await act(async () => {
      await result.current.startTimer(600);
      await Promise.resolve();
    });

    expect(result.current.isActive).toBe(true);
    // The fresh stamp must survive for the next mount to restore.
    expect(await AsyncStorage.getItem(key('student-verify'))).not.toBeNull();
  });

  it('should keep a code usable after the resend lock releases', async () => {
    const { result } = renderHook(() => useOtpTimer('student-reset'));

    await act(async () => {
      await result.current.startTimer(600, '01039890331');
    });

    act(() => {
      jest.advanceTimersByTime(180_000);
    });

    // The 60s lock is long gone, but the code lives for ten minutes — anything
    // offering "I already have a code" must stay available for all of it.
    expect(result.current.isActive).toBe(false);
    expect(result.current.hasLiveCode).toBe(true);
    expect(result.current.sentTo).toBe('01039890331');
  });

  it('should stop reporting a live code once it expires', async () => {
    const { result } = renderHook(() => useOtpTimer('student-reset'));

    await act(async () => {
      await result.current.startTimer(120, '01039890331');
    });

    act(() => {
      jest.advanceTimersByTime(120_000);
    });

    expect(result.current.hasLiveCode).toBe(false);
    expect(result.current.isExpired).toBe(true);
  });

  it('should report no live code before anything is sent', () => {
    const { result } = renderHook(() => useOtpTimer('student-reset'));
    expect(result.current.hasLiveCode).toBe(false);
    expect(result.current.sentTo).toBeNull();
  });

  it('should drop the pre-scoping legacy key so a stale lock cannot strand a user', async () => {
    await AsyncStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify({ sentAt: Date.now(), expiresIn: 120 }),
    );

    renderHook(() => useOtpTimer('student-verify'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(await AsyncStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('should recompute remaining time after the app resumes from background', async () => {
    const realDateNow = Date.now;
    let mockTime = realDateNow();
    global.Date.now = jest.fn(() => mockTime);

    const { result } = renderHook(() => useOtpTimer('student-verify'));

    await act(async () => {
      await result.current.startTimer(600);
    });

    expect(result.current.timeLeft).toBe(RESEND_LOCK_SECONDS);

    // 30s pass with the app backgrounded, so no interval tick fires.
    mockTime += 30_000;

    await act(async () => {
      (global as any).simulateAppStateChange('active');
    });

    expect(result.current.timeLeft).toBe(30);
    expect(result.current.expiresLeft).toBe(570);

    global.Date.now = realDateNow;
  });
});

describe('send allowance (BKLT-287)', () => {
  const MOBILE = '01001234567';

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('counts codes spent on the same number and closes resend at the cap', async () => {
    const { result } = renderHook(() => useOtpTimer('student-reset'));

    expect(result.current.sendCount).toBe(0);
    expect(result.current.hasReachedSendLimit).toBe(false);

    for (let i = 1; i <= MAX_OTP_SENDS; i += 1) {
      await act(async () => {
        await result.current.startTimer(600, MOBILE);
      });
      expect(result.current.sendCount).toBe(i);
    }

    expect(result.current.hasReachedSendLimit).toBe(true);
  });

  it('starts the allowance over when the user types a different number', async () => {
    const { result } = renderHook(() => useOtpTimer('student-reset'));

    for (let i = 0; i < MAX_OTP_SENDS; i += 1) {
      await act(async () => {
        await result.current.startTimer(600, MOBILE);
      });
    }
    expect(result.current.hasReachedSendLimit).toBe(true);

    await act(async () => {
      await result.current.startTimer(600, '01119998877');
    });
    expect(result.current.sendCount).toBe(1);
    expect(result.current.hasReachedSendLimit).toBe(false);
  });

  // The whole point of persisting it: killing the app must not hand out a
  // fresh allowance.
  it('survives a remount', async () => {
    const first = renderHook(() => useOtpTimer('student-reset'));
    for (let i = 0; i < MAX_OTP_SENDS; i += 1) {
      await act(async () => {
        await first.result.current.startTimer(600, MOBILE);
      });
    }
    first.unmount();

    const second = renderHook(() => useOtpTimer('student-reset'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(second.result.current.sendCount).toBe(MAX_OTP_SENDS);
    expect(second.result.current.hasReachedSendLimit).toBe(true);
  });

  it('is scoped per flow, so a reset cap cannot close the verify flow', async () => {
    const reset = renderHook(() => useOtpTimer('student-reset'));
    for (let i = 0; i < MAX_OTP_SENDS; i += 1) {
      await act(async () => {
        await reset.result.current.startTimer(600, MOBILE);
      });
    }

    const verify = renderHook(() => useOtpTimer('student-verify'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(verify.result.current.hasReachedSendLimit).toBe(false);
  });

  it('clearing the flow returns the allowance', async () => {
    const { result } = renderHook(() => useOtpTimer('student-reset'));
    for (let i = 0; i < MAX_OTP_SENDS; i += 1) {
      await act(async () => {
        await result.current.startTimer(600, MOBILE);
      });
    }
    await act(async () => {
      await result.current.clearTimer();
    });
    expect(result.current.sendCount).toBe(0);
    expect(result.current.hasReachedSendLimit).toBe(false);
  });
});
