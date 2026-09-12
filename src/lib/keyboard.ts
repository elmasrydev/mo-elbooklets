import type { KeyboardAvoidingViewProps } from 'react-native';

/**
 * `behavior` for a `KeyboardAvoidingView` that must work on Android (BKLT-393).
 *
 * `'padding'` on **both** platforms. The app used to pass `undefined` on
 * Android, trusting `android:windowSoftInputMode="adjustResize"` to shrink the
 * window instead. That stopped being true when the app went edge-to-edge
 * (`edgeToEdgeEnabled=true`, React Native 0.81 / Expo SDK 54): the window now
 * draws behind the system bars and the keyboard, so nothing resizes and a
 * bottom-anchored field — Boki's chat input — sat under the keyboard.
 *
 * `'padding'` is safe even on a device that *does* still resize. The view pads
 * by the overlap between its own frame and the keyboard's top edge, not by the
 * keyboard's height, so an already-shrunk window has no overlap and gets no
 * padding. There is no double shift to guard against.
 */
export const KEYBOARD_AVOIDING_BEHAVIOR: KeyboardAvoidingViewProps['behavior'] = 'padding';
