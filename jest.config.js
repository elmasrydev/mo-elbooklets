module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-firebase/.*)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
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
    'src/screens/ParentForgotPasswordScreen.tsx',
    'src/screens/OTPVerificationScreen.tsx',
    'src/screens/OnboardingScreen.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
