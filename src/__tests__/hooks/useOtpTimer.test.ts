import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOtpTimer } from '../../hooks/useOtpTimer';

const OTP_TIMER_STORAGE_KEY = '@otp_timer_state';

describe('useOtpTimer Hook', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default idle state', () => {
    const { result } = renderHook(() => useOtpTimer());
    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(result.current.formattedTime).toBe('0:00');
  });

  it('should start timer with specified duration and format time', async () => {
    const { result } = renderHook(() => useOtpTimer());

    await act(async () => {
      await result.current.startTimer(120);
    });

    expect(result.current.timeLeft).toBe(120);
    expect(result.current.isActive).toBe(true);
    expect(result.current.formattedTime).toBe('2:00');

    const stored = await AsyncStorage.getItem(OTP_TIMER_STORAGE_KEY);
    expect(stored).toBeDefined();
    expect(JSON.parse(stored!)).toHaveProperty('sentAt');
    expect(JSON.parse(stored!).expiresIn).toBe(120);
  });

  it('should decrement timeLeft every second when active', async () => {
    const { result } = renderHook(() => useOtpTimer());

    await act(async () => {
      await result.current.startTimer(65);
    });

    expect(result.current.timeLeft).toBe(65);
    expect(result.current.formattedTime).toBe('1:05');

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe(64);
    expect(result.current.formattedTime).toBe('1:04');

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(result.current.timeLeft).toBe(60);
    expect(result.current.formattedTime).toBe('1:00');
  });

  it('should auto-deactivate when timer expires', async () => {
    const { result } = renderHook(() => useOtpTimer());

    await act(async () => {
      await result.current.startTimer(2);
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(result.current.formattedTime).toBe('0:00');
  });

  it('should clear timer state on clearTimer call', async () => {
    const { result } = renderHook(() => useOtpTimer());

    await act(async () => {
      await result.current.startTimer(60);
    });

    expect(result.current.isActive).toBe(true);

    await act(async () => {
      await result.current.clearTimer();
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(result.current.formattedTime).toBe('0:00');

    const stored = await AsyncStorage.getItem(OTP_TIMER_STORAGE_KEY);
    expect(stored).toBeNull();
  });

  it('should restore persisted state on hook mount', async () => {
    const sentAt = Date.now();
    const state = {
      sentAt,
      expiresIn: 60,
    };
    await AsyncStorage.setItem(OTP_TIMER_STORAGE_KEY, JSON.stringify(state));

    const { result } = renderHook(() => useOtpTimer());

    // Allow loadTimer async flow to finish
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.timeLeft).toBeLessThanOrEqual(60);
  });

  it('should compute remaining time correctly after app resumes from background', async () => {
    const realDateNow = Date.now;
    let mockTime = Date.now();
    global.Date.now = jest.fn(() => mockTime);

    const { result } = renderHook(() => useOtpTimer());

    await act(async () => {
      await result.current.startTimer(60);
    });

    expect(result.current.timeLeft).toBe(60);

    // Simulate background elapsed time (30 seconds) without setInterval firing
    mockTime += 30000;

    // Simulate reload state (like returning from background app state)
    await act(async () => {
      (global as any).simulateAppStateChange('active');
    });

    // The remaining time should adjust to 29 (elapsed 30 secs + 1 sec timer tick)
    expect(result.current.timeLeft).toBeLessThanOrEqual(30);

    global.Date.now = realDateNow;
  });
});
