import { useEffect, useRef, useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Intercepts the Android hardware back button while the screen is focused.
 * Uses a ref internally so the BackHandler is registered exactly once per
 * focus cycle — state changes inside the handler (e.g. opening a modal via
 * showConfirm) do NOT cause the handler to be re-registered and fired again.
 * The handler should return `true` to prevent the default back action.
 * On iOS this is a no-op.
 */
const useAndroidBack = (handler: () => boolean): void => {
  const handlerRef = useRef(handler);

  // Keep the ref current on every render without touching the effect deps
  useEffect(() => {
    handlerRef.current = handler;
  });

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => handlerRef.current(),
      );
      return () => subscription.remove();
    }, []), // ← empty deps: register once per focus, ref always has latest handler
  );
};

export default useAndroidBack;
