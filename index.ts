import './src/config/ReactotronConfig';
import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

import App from './App';

// Silence known third-party SDK warnings so the dev-only LogBox notification toast
// doesn't overlay bottom-of-screen UI (it covers the Onboarding "Sign In" link,
// breaking taps in dev/E2E). Targeted patterns only — real errors still surface,
// and LogBox is a no-op in production. Do NOT use LogBox.ignoreAllLogs here.
LogBox.ignoreLogs([
  'This method is deprecated', // @react-native-firebase v22 namespaced-API deprecations
  'Segment SDK',
  'An internal error occurred',
  'Open debugger',
  'Failed to open debugger',
]);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
