import 'react-native-gesture-handler/jestSetup';
import { NativeModules } from 'react-native';

// Mock Segment Analytics at the very top to avoid loading order issues
jest.mock('@segment/analytics-react-native', () => {
  class MockDestinationPlugin {}
  return {
    __esModule: true,
    createClient: jest.fn(() => ({
      track: jest.fn(),
      screen: jest.fn(),
      identify: jest.fn(),
      add: jest.fn(),
      reset: jest.fn(),
    })),
    generateMapTransform: jest.fn(() => (val: any) => val),
    DestinationPlugin: MockDestinationPlugin,
    PluginType: {
      destination: 'destination',
      utility: 'utility',
    },
  };
});

// Mock React Navigation Native hooks using our shared mocks
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const navigationMock = require('./src/__tests__/__mocks__/navigation');
  return {
    ...actualNav,
    useNavigation: navigationMock.useNavigation,
    useRoute: navigationMock.useRoute,
  };
});

// Mock React Native Device Info (comprehensive for guest properties)
jest.mock('react-native-device-info', () => {
  const mockDeviceInfo = {
    isEmulator: jest.fn(() => Promise.resolve(true)),
    isEmulatorSync: jest.fn(() => true),
    getVersion: jest.fn(() => '1.0.0'),
    getBuildNumber: jest.fn(() => '1'),
    getBrand: jest.fn(() => 'Apple'),
    getModel: jest.fn(() => 'iPhone'),
    getSystemName: jest.fn(() => 'iOS'),
    getSystemVersion: jest.fn(() => '15.0'),
    getUniqueId: jest.fn(() => 'mock-unique-id'),
  };
  return {
    __esModule: true,
    default: mockDeviceInfo,
    ...mockDeviceInfo,
  };
});


// Mock React Native Firebase native module requirements
NativeModules.RNFBAppModule = {
  getApp: jest.fn(),
  initializeApp: jest.fn(),
};
NativeModules.RNFBNativeEventEmitter = {
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

// Mock Firebase Root App module
jest.mock('@react-native-firebase/app', () => {
  const mockApp = {
    utils: () => ({}),
  };
  return {
    __esModule: true,
    default: {
      app: jest.fn(() => mockApp),
      initializeApp: jest.fn(() => mockApp),
      apps: [],
    },
    getApp: jest.fn(() => mockApp),
    initializeApp: jest.fn(() => mockApp),
  };
});


// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Mock Expo Constants with dynamic environment based on APP_ENV
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      debugMode: process.env.APP_ENV !== 'prod',
    },
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => {
  let store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] || null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    _clear: () => {
      store = {};
    },
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => {
  const React = require('react');
  return {
    __esModule: true,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        changeLanguage: () => Promise.resolve(),
        language: 'en',
      },
    }),
    I18nextProvider: ({ children }: any) => children,
  };
});

// Mock Expo LinearGradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style }: any) => React.createElement(View, { style }, children),
  };
});

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, size, color }: any) => React.createElement(Text, null, `[Icon: ${name}]`),
  };
});

// Mock Firebase Modules
jest.mock('@react-native-firebase/analytics', () => {
  const mockAnalytics = {
    logEvent: jest.fn(),
    setCurrentScreen: jest.fn(),
    logLogin: jest.fn(),
    logSignUp: jest.fn(),
  };
  return {
    __esModule: true,
    default: () => mockAnalytics,
    getAnalytics: jest.fn(() => mockAnalytics),
  };
});

jest.mock('@react-native-firebase/crashlytics', () => {
  const mockCrashlytics = () => ({
    recordError: jest.fn(),
    log: jest.fn(),
    setUserId: jest.fn(() => Promise.resolve()),
    setAttributes: jest.fn(() => Promise.resolve()),
  });
  return {
    __esModule: true,
    default: mockCrashlytics,
  };
});

jest.mock('@react-native-firebase/messaging', () => {
  return () => ({
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
  });
});

jest.mock('@react-native-firebase/remote-config', () => {
  return () => ({
    setDefaults: jest.fn(),
    fetchAndActivate: jest.fn(() => Promise.resolve(true)),
    getValue: jest.fn((key: string) => ({
      asString: () => 'mock-value',
      asBoolean: () => true,
      asNumber: () => 0,
    })),
  });
});





// Mock Expo Updates
jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn(() => Promise.resolve()),
  updateId: 'mock-update-id',
}));

// Silence some annoying console logs/warnings during test runs
global.console.warn = jest.fn();
global.console.info = jest.fn();

const originalError = global.console.error;
global.console.error = (...args: any[]) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
    return;
  }
  originalError(...args);
};

// Mock AppState
(global as any).mockAppStateListeners = new Set<(status: string) => void>();
jest.mock('react-native/Libraries/AppState/AppState', () => {
  const addListenerFn = jest.fn((type, handler) => {
    (global as any).mockAppStateListeners.add(handler);
    return {
      remove: () => (global as any).mockAppStateListeners.delete(handler),
    };
  });
  return {
    __esModule: true,
    default: {
      currentState: 'active',
      addEventListener: addListenerFn,
    },
    currentState: 'active',
    addEventListener: addListenerFn,
  };
});

(global as any).simulateAppStateChange = (nextState: string) => {
  (global as any).mockAppStateListeners.forEach((handler: any) => handler(nextState));
};

