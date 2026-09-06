import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Run `onForeground` each time the app comes back to the front.
 *
 * Server-owned state (subscription flag, trial counters) can change while the
 * app sits in the background — a plan is activated by support, a trial lapses
 * overnight — and nothing pushes that to the device. Re-reading it on the way
 * back in is what stops the app acting on a state the server abandoned hours
 * ago.
 *
 * Only a real return fires. iOS emits `inactive` for transient interruptions
 * too — a Control Centre pull, a notification banner, a permission dialog —
 * and it emits it on the way back as well (`background → inactive → active`),
 * so neither "was inactive" nor "was background" identifies a return on its
 * own. Tracking whether the app actually reached the background does.
 */
export const useAppForeground = (onForeground: () => void): void => {
  const wasBackgrounded = useRef(AppState.currentState === 'background');
  // Kept in a ref so a caller passing an inline arrow does not re-subscribe on
  // every render.
  const callback = useRef(onForeground);
  callback.current = onForeground;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background') {
        wasBackgrounded.current = true;
        return;
      }
      if (nextState === 'active' && wasBackgrounded.current) {
        wasBackgrounded.current = false;
        callback.current();
      }
    });
    return () => subscription.remove();
  }, []);
};
