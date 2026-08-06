module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-firebase/.*)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // A worker per core oversubscribes the CPU whenever anything else is running
  // (an iOS simulator and Metro are enough), which starved screen tests into
  // spurious timeouts. Half the cores runs the suite faster *and* deterministically.
  maxWorkers: '50%',
  // Screen tests mount real RN trees, so jest's 5s default — tuned for pure unit
  // tests — leaves no headroom. Long enough to absorb load, short enough to still
  // catch a genuine hang.
  testTimeout: 15000,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/__mocks__/',
    '/src/__tests__/helpers/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/context/AuthContext.tsx',
    'src/config/api.ts',
    'src/hooks/useOtpTimer.ts',
    'src/screens/LoginScreen.tsx',
    'src/screens/RegisterScreen.tsx',
    'src/screens/ParentLoginScreen.tsx',
    'src/screens/ParentRegisterScreen.tsx',
    'src/screens/ForgotPasswordScreen.tsx',
    'src/screens/OTPVerificationScreen.tsx',
    'src/screens/OnboardingScreen.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
