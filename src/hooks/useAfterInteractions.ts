import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

/**
 * `false` while the screen's opening transition is still running, `true` once
 * InteractionManager reports it done.
 *
 * Lets a screen paint its cheap parts first and mount the expensive ones — a
 * video player, an SVG, a long list — after the frame budget is free again.
 * Mounted synchronously they all land inside the transition, and the first
 * touches queue behind them. With no transition in flight the flag flips on
 * the next tick, so the cheap shell still paints one frame ahead.
 */
export const useAfterInteractions = (): boolean => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => setReady(true));
    return () => handle.cancel();
  }, []);

  return ready;
};
