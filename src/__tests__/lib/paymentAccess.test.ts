import { Platform } from 'react-native';
import { fetchPaymentAccess, flagForCurrentPlatform } from '../../lib/paymentAccess';

const setPlatform = (os: string) => {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
};

const originalOS = Platform.OS;
afterEach(() => setPlatform(originalOS));

describe('flagForCurrentPlatform', () => {
  it('reads only this platform’s flag', () => {
    setPlatform('android');
    expect(flagForCurrentPlatform({ ios: false, android: true })).toBe(true);
    expect(flagForCurrentPlatform({ ios: true, android: false })).toBe(false);

    setPlatform('ios');
    expect(flagForCurrentPlatform({ ios: true, android: false })).toBe(true);
    expect(flagForCurrentPlatform({ ios: false, android: true })).toBe(false);
  });

  // Anything short of an explicit `true` keeps the purchase surface hidden, so a
  // missing or malformed answer can never reveal it.
  it.each([null, undefined, {}, { ios: null, android: null }, { ios: 'true', android: 'true' }])(
    'fails closed for %p',
    (flags) => {
      setPlatform('ios');
      expect(flagForCurrentPlatform(flags as never)).toBe(false);
      setPlatform('android');
      expect(flagForCurrentPlatform(flags as never)).toBe(false);
    },
  );

  it('fails closed on a platform the flags do not describe', () => {
    setPlatform('web');
    expect(flagForCurrentPlatform({ ios: true, android: true })).toBe(false);
  });
});

describe('fetchPaymentAccess', () => {
  // The backend query is not deployed yet; until it is, an unknown answer must
  // resolve to null so the caller keeps the surface off.
  it('resolves to null while the backend flag is unavailable', async () => {
    await expect(fetchPaymentAccess()).resolves.toBeNull();
  });
});
