import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * How long a screen waits for its transition before mounting the rest anyway —
 * a screen shown without an animation may never get a transition event.
 */
export const TRANSITION_FALLBACK_MS = 600;

/**
 * `false` until the screen's opening transition has finished, then `true`.
 *
 * Lets a screen paint its cheap shell first and mount the expensive parts — a
 * video player, a WebView, a long list — once the native animation is over;
 * mounted with the shell, they all land inside it and the first touches queue
 * behind them. Listens to native-stack's `transitionEnd`.
 * `InteractionManager.runAfterInteractions` cannot do this on React Native
 * 0.81: it is a stub that runs on the next tick, and no navigator registers
 * interactions anyway.
 */
export const useAfterTransition = (): boolean => {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const finish = () => setDone(true);
    const fallback = setTimeout(finish, TRANSITION_FALLBACK_MS);
    const unsubscribe = navigation.addListener('transitionEnd', (event) => {
      if (!event.data.closing) finish();
    });
    return () => {
      clearTimeout(fallback);
      unsubscribe();
    };
  }, [navigation]);

  return done;
};
